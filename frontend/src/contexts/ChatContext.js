import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import axios from '../utils/api';
import useWebSocket from '../hooks/useWebSocket';

const ChatContext = createContext();

// Chat action types
const CHAT_ACTIONS = {
  SET_CHATS: 'SET_CHATS',
  ADD_CHAT: 'ADD_CHAT',
  UPDATE_CHAT: 'UPDATE_CHAT',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  DELETE_MESSAGE: 'DELETE_MESSAGE',
  SET_ACTIVE_CHAT: 'SET_ACTIVE_CHAT',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_ONLINE_USERS: 'SET_ONLINE_USERS',
  MARK_MESSAGES_READ: 'MARK_MESSAGES_READ',
  SET_UNREAD_COUNT: 'SET_UNREAD_COUNT'
};

// Initial state
const initialState = {
  chats: [],
  activeChat: null,
  messages: {},
  onlineUsers: [],
  loading: false,
  error: null,
  unreadCount: 0
};

// Chat reducer
const chatReducer = (state, action) => {
  switch (action.type) {
    case CHAT_ACTIONS.SET_CHATS:
      return {
        ...state,
        chats: action.payload,
        loading: false
      };
    
    case CHAT_ACTIONS.ADD_CHAT:
      return {
        ...state,
        chats: [action.payload, ...state.chats]
      };
    
    case CHAT_ACTIONS.UPDATE_CHAT:
      return {
        ...state,
        chats: state.chats.map(chat => 
          chat._id === action.payload._id ? action.payload : chat
        )
      };
    
    case CHAT_ACTIONS.SET_MESSAGES:
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.chatId]: action.payload.messages
        }
      };
    
    case CHAT_ACTIONS.ADD_MESSAGE:
      const { chatId, message } = action.payload;
      const existingMessages = state.messages[chatId] || [];
      
      return {
        ...state,
        messages: {
          ...state.messages,
          [chatId]: [...existingMessages, message]
        }
      };
    
    case CHAT_ACTIONS.UPDATE_MESSAGE:
      const { chatId: updateChatId, messageId, updates } = action.payload;
      return {
        ...state,
        messages: {
          ...state.messages,
          [updateChatId]: state.messages[updateChatId]?.map(msg =>
            msg._id === messageId ? { ...msg, ...updates } : msg
          ) || []
        }
      };
    
    case CHAT_ACTIONS.DELETE_MESSAGE:
      const { chatId: deleteChatId, messageId: deleteMsgId } = action.payload;
      return {
        ...state,
        messages: {
          ...state.messages,
          [deleteChatId]: state.messages[deleteChatId]?.map(msg =>
            msg._id === deleteMsgId ? { ...msg, isDeleted: true } : msg
          ) || []
        }
      };
    
    case CHAT_ACTIONS.SET_ACTIVE_CHAT:
      return {
        ...state,
        activeChat: action.payload
      };
    
    case CHAT_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case CHAT_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    case CHAT_ACTIONS.SET_ONLINE_USERS:
      return {
        ...state,
        onlineUsers: action.payload
      };
    
    case CHAT_ACTIONS.MARK_MESSAGES_READ:
      const { chatId: readChatId, userId } = action.payload;
      return {
        ...state,
        messages: {
          ...state.messages,
          [readChatId]: state.messages[readChatId]?.map(msg => {
            if (msg.sender._id !== userId && !msg.readBy?.find(r => r.user === userId)) {
              return {
                ...msg,
                readBy: [...(msg.readBy || []), { user: userId, readAt: new Date() }]
              };
            }
            return msg;
          }) || []
        }
      };
    
    case CHAT_ACTIONS.SET_UNREAD_COUNT:
      return {
        ...state,
        unreadCount: action.payload
      };
    
    default:
      return state;
  }
};

// Chat provider component
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Fetch user's chats
  const fetchUserChats = useCallback(async () => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !user) {
      return;
    }

    try {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });
      const response = await axios.get('/chat/user-chats');
      dispatch({ type: CHAT_ACTIONS.SET_CHATS, payload: response.data.chats });
    } catch (error) {
      console.error('Error fetching chats:', error);
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: 'Failed to fetch chats' });
    }
  }, []); // Remove token and user dependencies to prevent infinite loops

  // Create or get chat
  const createOrGetChat = useCallback(async (chatData) => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !user) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await axios.post('/chat/create', chatData);
      const chat = response.data.chat;
      
      // Check if chat already exists in state
      const existingChat = state.chats.find(c => c._id === chat._id);
      if (!existingChat) {
        dispatch({ type: CHAT_ACTIONS.ADD_CHAT, payload: chat });
      }
      
      return chat;
    } catch (error) {
      console.error('Error creating/getting chat:', error);
      throw error;
    }
  }, [state.chats]); // Remove token and user dependencies

  // Fetch chat messages
  const fetchChatMessages = useCallback(async (chatId, page = 1) => {
    try {
      const response = await axios.get(`/chat/${chatId}/messages?page=${page}&limit=50`);
      dispatch({
        type: CHAT_ACTIONS.SET_MESSAGES,
        payload: {
          chatId, // This should be the chatId field (like 'general-chat')
          messages: response.data.messages
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (chatId, content, messageType = 'text', replyTo = null) => {
    try {
      const response = await axios.post(`/chat/${chatId}/messages`, {
        content,
        messageType,
        replyTo
      });
      
      const message = response.data.message;
      dispatch({
        type: CHAT_ACTIONS.ADD_MESSAGE,
        payload: { chatId, message } // chatId should be the chatId field (like 'general-chat')
      });
      
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }, []);

  // Delete message
  const deleteMessage = useCallback(async (messageId) => {
    try {
      await axios.delete(`/chat/messages/${messageId}`);
      dispatch({
        type: CHAT_ACTIONS.DELETE_MESSAGE,
        payload: { chatId: state.activeChat?.chatId, messageId }
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }, [state.activeChat]);

  // Mark messages as read
  const markMessagesAsRead = useCallback((chatId, userId) => {
    dispatch({
      type: CHAT_ACTIONS.MARK_MESSAGES_READ,
      payload: { chatId, userId }
    });
  }, []);

  // Set active chat
  const setActiveChat = useCallback((chat) => {
    dispatch({ type: CHAT_ACTIONS.SET_ACTIVE_CHAT, payload: chat });
  }, []);

  // Get online users
  const fetchOnlineUsers = useCallback(async () => {
    try {
      const response = await axios.get('/chat/online-users');
      dispatch({ type: CHAT_ACTIONS.SET_ONLINE_USERS, payload: response.data.users });
    } catch (error) {
      console.error('Error fetching online users:', error);
    }
  }, []);

  // WebSocket event handlers
  const handleMessageReceived = useCallback((data) => {
    const { chatId, message } = data;
    
    // Add message to state if it's not from current user
    const user = JSON.parse(localStorage.getItem('user'));
    if (message.sender._id !== user?._id) {
      // chatId from WebSocket is already the correct chatId field (like 'general-chat')
      dispatch({
        type: CHAT_ACTIONS.ADD_MESSAGE,
        payload: { chatId, message }
      });
    }
  }, []);

  const handleMessageDeleted = useCallback((data) => {
    const { chatId, messageId } = data;
    // chatId from WebSocket is already the correct chatId field (like 'general-chat')
    dispatch({
      type: CHAT_ACTIONS.DELETE_MESSAGE,
      payload: { chatId, messageId }
    });
  }, []);

  const handleUserTyping = useCallback((data) => {
    // You can implement typing indicators here
    console.log('User typing:', data);
  }, []);

  const handleUserStoppedTyping = useCallback((data) => {
    // You can implement stop typing indicators here
    console.log('User stopped typing:', data);
  }, []);

  const handleUserStatusChanged = useCallback((data) => {
    // Update online users when status changes
    dispatch({
      type: CHAT_ACTIONS.SET_ONLINE_USERS,
      payload: (prevUsers) => {
        const updatedUsers = prevUsers.map(user => 
          user._id === data.userId 
            ? { ...user, isOnline: data.isOnline, lastSeen: data.timestamp }
            : user
        );
        return updatedUsers;
      }
    });
  }, []);

  // Initialize chats on mount (only once)
  useEffect(() => {
    // Only fetch chats if user is authenticated
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (token && user) {
      fetchUserChats();
    }
  }, []); // Empty dependency array - only run once on mount

  // Calculate total unread count
  useEffect(() => {
    const totalUnread = state.chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
    dispatch({ type: CHAT_ACTIONS.SET_UNREAD_COUNT, payload: totalUnread });
  }, [state.chats]);

  // Initialize WebSocket connection
  const {
    isConnected,
    joinChat,
    leaveChat,
    sendTyping,
    stopTyping,
    updateStatus
  } = useWebSocket(
    token,
    handleMessageReceived,
    handleMessageDeleted,
    handleUserTyping,
    handleUserStoppedTyping,
    handleUserStatusChanged
  );

  const value = {
    ...state,
    fetchUserChats,
    createOrGetChat,
    fetchChatMessages,
    sendMessage,
    deleteMessage,
    markMessagesAsRead,
    setActiveChat,
    fetchOnlineUsers,
    // WebSocket functions
    isConnected,
    joinChat,
    leaveChat,
    sendTyping,
    stopTyping,
    updateStatus
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
