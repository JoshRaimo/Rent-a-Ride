const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class SocketServer {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ['https://rent-a-ride-mfvw.onrender.com']
          : ['http://localhost:3000'],
        credentials: true
      }
    });

    this.userSockets = new Map(); // Map userId to socket
    this.chatRooms = new Map(); // Map chatId to Set of socketIds
    this.typingUsers = new Map(); // Map chatId to Set of typing users

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        socket.username = decoded.username;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      this.handleConnection(socket);
      this.handleDisconnection(socket);
      this.handleJoinChat(socket);
      this.handleLeaveChat(socket);
      this.handleTyping(socket);
      this.handleStopTyping(socket);
      this.handleNewMessage(socket);
      this.handleMessageDeleted(socket);
      this.handleUserStatus(socket);
    });
  }

  handleConnection(socket) {
    const userId = socket.userId;
    
    // Store user socket mapping
    this.userSockets.set(userId, socket);
    
    // Update user online status
    this.updateUserStatus(userId, true);
    
    // Join user to their personal room for notifications
    socket.join(`user-${userId}`);
    
    // Broadcast user online status to general chat
    this.io.to('general-chat').emit('userStatusChanged', {
      userId,
      username: socket.username,
      isOnline: true,
      timestamp: new Date()
    });
  }

  handleDisconnection(socket) {
    const userId = socket.userId;
    
    // Remove user socket mapping
    this.userSockets.delete(userId);
    
    // Update user offline status
    this.updateUserStatus(userId, false);
    
    // Leave all chat rooms
    socket.rooms.forEach(room => {
      if (room !== socket.id && room !== `user-${userId}`) {
        socket.leave(room);
        this.removeUserFromChatRoom(room, socket.id);
      }
    });
    
    // Broadcast user offline status to general chat
    this.io.to('general-chat').emit('userStatusChanged', {
      userId,
      username: socket.username,
      isOnline: false,
      timestamp: new Date()
    });
  }

  handleJoinChat(socket) {
    socket.on('joinChat', async (chatId) => {
      try {
        // Leave previous chat room
        socket.rooms.forEach(room => {
          if (room !== socket.id && room !== `user-${socket.userId}` && room.startsWith('chat-')) {
            socket.leave(room);
            this.removeUserFromChatRoom(room, socket.id);
          }
        });

        // Join new chat room
        const roomName = `chat-${chatId}`;
        socket.join(roomName);
        this.addUserToChatRoom(roomName, socket.id);
        
        // Notify other users in the chat
        socket.to(roomName).emit('userJoinedChat', {
          userId: socket.userId,
          username: socket.username,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error joining chat:', error);
      }
    });
  }

  handleLeaveChat(socket) {
    socket.on('leaveChat', (chatId) => {
      const roomName = `chat-${chatId}`;
      socket.leave(roomName);
      this.removeUserFromChatRoom(roomName, socket.id);
      
      // Notify other users in the chat
      socket.to(roomName).emit('userLeftChat', {
        userId: socket.userId,
        username: socket.username,
        timestamp: new Date()
      });
    });
  }

  handleTyping(socket) {
    socket.on('typing', (chatId) => {
      const roomName = `chat-${chatId}`;
      const typingKey = `${roomName}-${socket.userId}`;
      
      // Add user to typing list
      if (!this.typingUsers.has(roomName)) {
        this.typingUsers.set(roomName, new Set());
      }
      this.typingUsers.get(roomName).add(socket.userId);
      
      // Broadcast typing indicator
      socket.to(roomName).emit('userTyping', {
        userId: socket.userId,
        username: socket.username,
        chatId
      });
      
      // Clear typing indicator after 3 seconds
      setTimeout(() => {
        this.handleStopTyping(socket, chatId);
      }, 3000);
    });
  }

  handleStopTyping(socket, chatId = null) {
    if (chatId) {
      const roomName = `chat-${chatId}`;
      if (this.typingUsers.has(roomName)) {
        this.typingUsers.get(roomName).delete(socket.userId);
        
        // Broadcast stop typing
        socket.to(roomName).emit('userStoppedTyping', {
          userId: socket.userId,
          username: socket.username,
          chatId
        });
      }
    } else {
      // Handle stop typing event from client
      socket.on('stopTyping', (chatId) => {
        this.handleStopTyping(socket, chatId);
      });
    }
  }

  handleNewMessage(socket) {
    socket.on('newMessage', (messageData) => {
      const { chatId, message } = messageData;
      const roomName = `chat-${chatId}`;
      
      // Broadcast message to all users in the chat
      this.io.to(roomName).emit('messageReceived', {
        chatId,
        message: {
          ...message,
          isNew: true
        }
      });
      
      // Send notification to users not in the chat
      this.sendMessageNotification(chatId, message, roomName);
    });
  }

  handleMessageDeleted(socket) {
    socket.on('messageDeleted', (data) => {
      const { chatId, messageId } = data;
      const roomName = `chat-${chatId}`;
      
      // Broadcast message deletion to all users in the chat
      this.io.to(roomName).emit('messageDeleted', {
        chatId,
        messageId
      });
    });
  }

  handleUserStatus(socket) {
    socket.on('updateStatus', async (status) => {
      try {
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: status === 'online',
          lastSeen: new Date()
        });
        
        // Broadcast status update
        this.io.to('general-chat').emit('userStatusChanged', {
          userId: socket.userId,
          username: socket.username,
          isOnline: status === 'online',
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    });
  }

  // Helper methods
  addUserToChatRoom(roomName, socketId) {
    if (!this.chatRooms.has(roomName)) {
      this.chatRooms.set(roomName, new Set());
    }
    this.chatRooms.get(roomName).add(socketId);
  }

  removeUserFromChatRoom(roomName, socketId) {
    if (this.chatRooms.has(roomName)) {
      this.chatRooms.get(roomName).delete(socketId);
      if (this.chatRooms.get(roomName).size === 0) {
        this.chatRooms.delete(roomName);
      }
    }
  }

  async updateUserStatus(userId, isOnline) {
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline,
        lastSeen: new Date()
      });
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  }

  sendMessageNotification(chatId, message, excludeRoom) {
    // Get all users in the chat
    const chatRoom = this.chatRooms.get(`chat-${chatId}`);
    if (!chatRoom) return;

    // Send notification to users not currently viewing the chat
    chatRoom.forEach(socketId => {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket && !socket.rooms.has(excludeRoom)) {
        socket.emit('messageNotification', {
          chatId,
          message: {
            id: message._id,
            content: message.content,
            sender: message.sender,
            timestamp: message.createdAt
          }
        });
      }
    });
  }

  // Public methods for external use
  broadcastToChat(chatId, event, data) {
    const roomName = `chat-${chatId}`;
    this.io.to(roomName).emit(event, data);
  }

  sendToUser(userId, event, data) {
    const userSocket = this.userSockets.get(userId);
    if (userSocket) {
      userSocket.emit(event, data);
    }
  }

  getOnlineUsers() {
    return Array.from(this.userSockets.keys());
  }

  getChatParticipants(chatId) {
    const roomName = `chat-${chatId}`;
    const chatRoom = this.chatRooms.get(roomName);
    if (!chatRoom) return [];
    
    return Array.from(chatRoom).map(socketId => {
      const socket = this.io.sockets.sockets.get(socketId);
      return socket ? {
        userId: socket.userId,
        username: socket.username,
        role: socket.userRole
      } : null;
    }).filter(Boolean);
  }
}

module.exports = SocketServer;
