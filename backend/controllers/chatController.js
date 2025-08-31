const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

// WebSocket server instance (will be set from app.js)
let socketServer = null;

// Function to set socket server instance
const setSocketServer = (server) => {
  socketServer = server;
};

// Create or get existing chat room
const createOrGetChat = async (req, res) => {
  try {
    const { type, participantIds = [], bookingId, title } = req.body;
    const userId = req.user.id;

    // Validate chat type
    if (!['support', 'general', 'booking'].includes(type)) {
      return res.status(400).json({ message: 'Invalid chat type' });
    }

    let chatId;
    let participants = [userId, ...(Array.isArray(participantIds) ? participantIds : [])];

    if (type === 'general') {
      // General chat - one room for all users
      chatId = 'general-chat';
      participants = []; // Will be populated with all users
    } else if (type === 'support') {
      // Support chat - unique per user
      chatId = `support-${userId}`;
      participants = [userId]; // Only the requesting user initially
    } else if (type === 'booking') {
      // Booking chat - unique per booking
      if (!bookingId) {
        return res.status(400).json({ message: 'Booking ID required for booking chats' });
      }
      chatId = `booking-${bookingId}`;
      participants = [userId]; // Will be populated with booking participants
    }

    // Check if chat already exists
    let chat = await Chat.findOne({ chatId });

    if (!chat) {
      // Create new chat
      chat = new Chat({
        chatId,
        type,
        participants,
        booking: bookingId || undefined,
        title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} Chat`
      });

      await chat.save();
    } else {
      // Add user to existing chat if not already a participant
      if (!chat.participants.includes(userId)) {
        chat.participants.push(userId);
        await chat.save();
      }
    }

    // Populate participants info
    await chat.populate('participants', 'username email profileImage');

    res.status(200).json({ chat });
  } catch (error) {
    console.error('Error creating/getting chat:', error);
    res.status(500).json({ message: 'Failed to create/get chat', error: error.message });
  }
};

// Get user's chat rooms
const getUserChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    let query = { participants: userId, isActive: true };
    
    if (type) {
      query.type = type;
    }

    const chats = await Chat.find(query)
      .populate('participants', 'username email profileImage')
      .populate('booking', 'startDate endDate car')
      .sort({ lastActivity: -1 });

    // Get unread message counts for each chat
    const chatsWithUnreadCounts = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          sender: { $ne: userId },
          'readBy.user': { $ne: userId }
        });

        return {
          ...chat.toObject(),
          unreadCount
        };
      })
    );

    res.status(200).json({ chats: chatsWithUnreadCounts });
  } catch (error) {
    console.error('Error getting user chats:', error);
    res.status(500).json({ message: 'Failed to get chats', error: error.message });
  }
};

// Get chat messages
const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    // Find the chat by either chatId (string) or MongoDB _id
    let chat = await Chat.findOne({ chatId });
    if (!chat) {
      // Try to find by MongoDB _id
      chat = await Chat.findById(chatId);
    }
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check access based on chat type
    if (chat.type === 'general') {
      // General chat - all users have access
      // No additional check needed
    } else if (chat.type === 'support') {
      // Support chat - only the user who created it has access
      if (!chat.participants.includes(userId)) {
        return res.status(403).json({ message: 'Access denied to this chat' });
      }
    } else if (chat.type === 'booking') {
      // Booking chat - only participants have access
      if (!chat.participants.includes(userId)) {
        return res.status(403).json({ message: 'Access denied to this chat' });
      }
    }

    // Get messages with pagination
    const skip = (page - 1) * limit;
    const messages = await Message.find({ 
      chat: chat._id,
      isDeleted: false 
    })
      .populate('sender', 'username email profileImage')
      .populate('replyTo', 'content sender')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Mark messages as read for this user
    await Message.updateMany(
      {
        chat: chat._id,
        sender: { $ne: userId },
        'readBy.user': { $ne: userId }
      },
      {
        $push: {
          readBy: {
            user: userId,
            readAt: new Date()
          }
        }
      }
    );

    // Update chat last activity
    await Chat.findByIdAndUpdate(chat._id, { lastActivity: new Date() });

    res.status(200).json({ 
      messages: messages.reverse(), // Show oldest first
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Error getting chat messages:', error);
    res.status(500).json({ message: 'Failed to get messages', error: error.message });
  }
};

// Send message
const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params; // Get chatId from URL parameters
    const { content, messageType = 'text', replyTo } = req.body;
    const userId = req.user.id;

    // Find the chat by either chatId (string) or MongoDB _id
    let chat = await Chat.findOne({ chatId });
    if (!chat) {
      // Try to find by MongoDB _id
      chat = await Chat.findById(chatId);
    }
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check access based on chat type
    if (chat.type === 'general') {
      // General chat - all users have access
      // No additional check needed
    } else if (chat.type === 'support') {
      // Support chat - only the user who created it has access
      if (!chat.participants.includes(userId)) {
        return res.status(403).json({ message: 'Access denied to this chat' });
      }
    } else if (chat.type === 'booking') {
      // Booking chat - only participants have access
      if (!chat.participants.includes(userId)) {
        return res.status(403).json({ message: 'Access denied to this chat' });
      }
    }

    // Validate message content
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Create new message
    const message = new Message({
      chat: chat._id,
      sender: userId,
      content: content.trim(),
      messageType,
      replyTo: replyTo || undefined
    });

    await message.save();

    // Populate sender info
    await message.populate('sender', 'username email profileImage');
    if (replyTo) {
      await message.populate('replyTo', 'content sender');
    }

    // Update chat last activity
    await Chat.findByIdAndUpdate(chat._id, { lastActivity: new Date() });

    // Emit WebSocket event for real-time message
    if (socketServer) {
      socketServer.broadcastToChat(chat.chatId, 'messageReceived', {
        chatId: chat.chatId,
        message: {
          ...message.toObject(),
          isNew: true
        }
      });
    }

    res.status(201).json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

// Delete message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only allow sender or admin to delete message
    if (message.sender.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Cannot delete this message' });
    }

    // Soft delete
    message.isDeleted = true;
    await message.save();

    // Emit WebSocket event for real-time message deletion
    if (socketServer) {
      socketServer.broadcastToChat(message.chat.toString(), 'messageDeleted', {
        chatId: message.chat.toString(),
        messageId: message._id
      });
    }

    res.status(200).json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Failed to delete message', error: error.message });
  }
};

// Get online users for general chat
const getOnlineUsers = async (req, res) => {
  try {
    const users = await User.find({ isOnline: true })
      .select('username email profileImage lastSeen')
      .sort({ lastSeen: -1 })
      .limit(50);

    res.status(200).json({ users });
  } catch (error) {
    console.error('Error getting online users:', error);
    res.status(500).json({ message: 'Failed to get online users', error: error.message });
  }
};

module.exports = {
  createOrGetChat,
  getUserChats,
  getChatMessages,
  sendMessage,
  deleteMessage,
  getOnlineUsers,
  setSocketServer
};
