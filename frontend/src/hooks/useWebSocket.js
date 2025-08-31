import { useEffect, useRef, useCallback, useState } from 'react';
import { io } from 'socket.io-client';
import { WS_BASE_URL } from '../utils/api';

const useWebSocket = (token, onMessageReceived, onMessageDeleted, onUserTyping, onUserStoppedTyping, onUserStatusChanged) => {
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const connectionRef = useRef(null); // Track connection attempt

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  }, []);

  // Join chat room
  const joinChat = useCallback((chatId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('joinChat', chatId);
    }
  }, []);

  // Leave chat room
  const leaveChat = useCallback((chatId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leaveChat', chatId);
    }
  }, []);

  // Send typing indicator
  const sendTyping = useCallback((chatId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('typing', chatId);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('stopTyping', chatId);
        }
      }, 3000);
    }
  }, []);

  // Stop typing indicator
  const stopTyping = useCallback((chatId) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('stopTyping', chatId);
    }
  }, []);

  // Send message via WebSocket (for real-time updates)
  const sendMessage = useCallback((chatId, message) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('newMessage', { chatId, message });
    }
  }, []);

  // Delete message via WebSocket (for real-time updates)
  const deleteMessage = useCallback((chatId, messageId) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('messageDeleted', { chatId, messageId });
    }
  }, []);

  // Update user status
  const updateStatus = useCallback((status) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('updateStatus', status);
    }
  }, []);

  // Connect on mount and when token changes
  useEffect(() => {
    if (!token) return;

    // Prevent multiple connection attempts
    if (connectionRef.current === token) return;
    connectionRef.current = token;

    // Disconnect existing connection if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Initialize socket connection
    const socket = io(WS_BASE_URL, {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000
    });

    // Connection events
    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Chat events
    socket.on('messageReceived', (data) => {
      if (onMessageReceived) {
        onMessageReceived(data);
      }
    });

    socket.on('messageDeleted', (data) => {
      if (onMessageDeleted) {
        onMessageDeleted(data);
      }
    });

    socket.on('userTyping', (data) => {
      if (onUserTyping) {
        onUserTyping(data);
      }
    });

    socket.on('userStoppedTyping', (data) => {
      if (onUserStoppedTyping) {
        onUserStoppedTyping(data);
      }
    });

    socket.on('userStatusChanged', (data) => {
      if (onUserStatusChanged) {
        onUserStatusChanged(data);
      }
    });

    socketRef.current = socket;

    return () => {
      connectionRef.current = null;
      socket.disconnect();
    };
  }, [token]); // Only depend on token, not the callback functions

  return {
    socket: socketRef.current,
    isConnected,
    joinChat,
    leaveChat,
    sendTyping,
    stopTyping,
    sendMessage,
    deleteMessage,
    updateStatus,
    connect: () => {}, // Placeholder for compatibility
    disconnect
  };
};

export default useWebSocket;
