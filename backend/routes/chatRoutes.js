const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const {
  createOrGetChat,
  getUserChats,
  getChatMessages,
  sendMessage,
  deleteMessage,
  getOnlineUsers
} = require('../controllers/chatController');

// All chat routes require authentication
router.use(authenticate);

// Create or get existing chat room
router.post('/create', createOrGetChat);

// Get user's chat rooms
router.get('/user-chats', getUserChats);

// Get chat messages
router.get('/:chatId/messages', getChatMessages);

// Send message
router.post('/:chatId/messages', sendMessage);

// Delete message
router.delete('/messages/:messageId', deleteMessage);

// Get online users (for general chat)
router.get('/online-users', getOnlineUsers);

module.exports = router;
