import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../contexts/ChatContext';
import { useAuthModal } from '../contexts/AuthModalContext';
import { MessageCircle, Users, HelpCircle, Car, X, Send, MoreVertical, Trash2, Reply } from 'lucide-react';

const Chat = () => {
  const {
    chats,
    activeChat,
    messages,
    loading,
    error,
    createOrGetChat,
    fetchChatMessages,
    sendMessage,
    deleteMessage,
    setActiveChat,
    markMessagesAsRead,
    // WebSocket functions
    isConnected,
    joinChat,
    leaveChat,
    sendTyping,
    stopTyping
  } = useChat();

  // Get user from localStorage since that's where it's stored in your app
  const user = JSON.parse(localStorage.getItem('user')) || null;
  const token = localStorage.getItem('token');
  const [isOpen, setIsOpen] = useState(false);
  const [messageInput, setMessageInput] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [chatType, setChatType] = useState('general');
  const messagesEndRef = useRef(null);
  const [showChatList, setShowChatList] = useState(true);
  const [typingUsers, setTypingUsers] = useState(new Set());

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChat]);

  // Handle chat type selection
  const handleChatTypeSelect = async (type) => {
    if (!user || !token) {
      return;
    }

    // Prevent multiple rapid clicks
    if (loading) return;

    setChatType(type);
    try {
      let chatData = { type };
      
      if (type === 'support') {
        chatData.title = 'Customer Support';
      } else if (type === 'general') {
        chatData.title = 'General Chat';
      }
      
      const chat = await createOrGetChat(chatData);
      setActiveChat(chat);
      await fetchChatMessages(chat.chatId); // Use chatId field instead of MongoDB _id
      setShowChatList(false);
      
      // Join WebSocket chat room
      if (isConnected) {
        joinChat(chat.chatId); // Use chatId for WebSocket room
      }
    } catch (error) {
      console.error('Error selecting chat type:', error);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChat) return;

    try {
      // Stop typing indicator
      if (isConnected) {
        stopTyping(activeChat.chatId);
      }
      
      await sendMessage(
        activeChat.chatId, // Use chatId field instead of MongoDB _id
        messageInput.trim(),
        'text',
        replyTo?._id
      );
      setMessageInput('');
      setReplyTo(null);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await deleteMessage(messageId);
      } catch (error) {
        console.error('Error deleting message:', error);
      }
    }
  };

  // Reply to message
  const handleReply = (message) => {
    setReplyTo(message);
  };

  // Cancel reply
  const handleCancelReply = () => {
    setReplyTo(null);
  };

  // Handle typing indicator
  const handleTyping = (e) => {
    setMessageInput(e.target.value);
    
    // Send typing indicator via WebSocket
    if (isConnected && activeChat && e.target.value.trim()) {
      sendTyping(activeChat.chatId);
    }
  };

  // Handle typing indicators from other users
  useEffect(() => {
    if (!isConnected) return;

    const handleUserTyping = (data) => {
      if (data.chatId === activeChat?.chatId) { // Keep using chatId for WebSocket events
        setTypingUsers(prev => new Set(prev).add(data.username));
      }
    };

    const handleUserStoppedTyping = (data) => {
      if (data.chatId === activeChat?.chatId) { // Keep using chatId for WebSocket events
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.username);
          return newSet;
        });
      }
    };

    // Listen for typing events
    const socket = window.socket; // Access socket from global scope if needed
    if (socket) {
      socket.on('userTyping', handleUserTyping);
      socket.on('userStoppedTyping', handleUserStoppedTyping);
    }

    return () => {
      if (socket) {
        socket.off('userTyping', handleUserTyping);
        socket.off('userStoppedTyping', handleUserStoppedTyping);
      }
    };
  }, [isConnected, activeChat]);

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get chat display name
  const getChatDisplayName = (chat) => {
    if (chat.type === 'general') return 'General Chat';
    if (chat.type === 'support') return 'Customer Support';
    if (chat.type === 'booking' && chat.booking) {
      return `Booking #${chat.booking._id.slice(-6)}`;
    }
    return chat.title || 'Chat';
  };

  // Get unread count for a chat
  const getUnreadCount = (chat) => {
    return chat.unreadCount || 0;
  };

  // Don't render chat if no user or token
  if (!user || !token) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full p-4 shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl"
          title="Open Chat"
        >
          <MessageCircle className="w-7 h-7" />
          {chats.some(chat => getUnreadCount(chat) > 0) && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-sm font-semibold rounded-full w-7 h-7 flex items-center justify-center shadow-lg">
              {chats.reduce((sum, chat) => sum + getUnreadCount(chat), 0)}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">
              {activeChat ? getChatDisplayName(activeChat) : 'Chat'}
            </h3>
            <p className="text-white/80 text-sm">
              {isConnected ? 'Connected' : 'Connecting...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection status indicator */}
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 connection-status' : 'bg-red-400'} shadow-lg`} 
               title={isConnected ? 'Connected' : 'Disconnected'} />
          
          <button
            onClick={() => setShowChatList(!showChatList)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            title="Toggle Chat List"
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            title="Close Chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 flex">
        {/* Chat List Sidebar */}
        {showChatList && (
          <div className="w-2/5 border-r border-gray-200 bg-gray-50">
            <div className="p-4 border-b border-gray-200">
              <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Chat Types</h4>
              <div className="space-y-2">
                <button
                  onClick={() => handleChatTypeSelect('general')}
                  className={`w-full text-left p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    chatType === 'general' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                      : 'hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  General
                </button>
                <button
                  onClick={() => handleChatTypeSelect('support')}
                  className={`w-full text-left p-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    chatType === 'support' 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                      : 'hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 inline mr-2" />
                  Support
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wide">Recent Chats</h4>
              <div className="space-y-2">
                {chats.map(chat => (
                  <button
                    key={chat._id}
                                         onClick={() => {
                       setActiveChat(chat);
                       fetchChatMessages(chat.chatId); // Use chatId field instead of MongoDB _id
                       setShowChatList(false);
                     }}
                    className={`w-full text-left p-3 rounded-xl text-sm transition-all duration-200 ${
                      activeChat?._id === chat._id 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
                        : 'hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate font-medium">{getChatDisplayName(chat)}</span>
                      {getUnreadCount(chat) > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-1 min-w-[24px] shadow-sm">
                          {getUnreadCount(chat)}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
                {chats.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs">No recent chats</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col chat-transition chat-container">
          {!activeChat ? (
            <div key="no-chat" className="flex-1 flex items-center justify-center text-gray-500 chat-content">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-600">Select a chat type to start messaging</p>
                <p className="text-sm text-gray-400 mt-2">Choose from General or Support chat</p>
              </div>
            </div>
          ) : (
            <div key="active-chat" className="flex-1 flex flex-col chat-content">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50 chat-messages">
                {loading ? (
                  <div className="text-center text-gray-500 py-8 loading-transition">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="font-medium">Loading messages...</p>
                  </div>
                ) : error ? (
                  <div className="text-center text-red-500 py-8 loading-transition">
                    <p className="font-medium">{error}</p>
                  </div>
                ) : messages[activeChat.chatId]?.length > 0 ? (
                  messages[activeChat.chatId]?.map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${message.sender._id === user?._id ? 'justify-end' : 'justify-start'} message-bubble`}
                    >
                      <div
                        className={`max-w-[85%] p-4 rounded-2xl shadow-sm message-bubble ${
                          message.sender._id === user?._id
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                            : 'bg-white text-gray-800 border border-gray-200'
                        }`}
                      >
                        {/* Reply preview */}
                        {message.replyTo && (
                          <div className={`text-xs mb-3 p-2 rounded-lg ${
                            message.sender._id === user?._id
                              ? 'bg-white/20'
                              : 'bg-gray-100'
                          }`}>
                            <div className="font-semibold text-xs">
                              {message.replyTo.sender.username}
                            </div>
                            <div className="truncate text-xs opacity-80">
                              {message.replyTo.content}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="text-xs font-semibold mb-1 opacity-80">
                              {message.sender.username}
                            </div>
                            <div className="break-words leading-relaxed chat-message">
                              {message.isDeleted ? (
                                <em className="opacity-60 italic">Message deleted</em>
                              ) : (
                                message.content
                              )}
                            </div>
                            <div className="text-xs opacity-60 mt-2">
                              {formatTime(message.createdAt)}
                            </div>
                          </div>
                          
                          {/* Message actions */}
                          {!message.isDeleted && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleReply(message)}
                                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                title="Reply"
                              >
                                <Reply className="w-4 h-4" />
                              </button>
                              {(message.sender._id === user?._id || user?.role === 'admin') && (
                                <button
                                  onClick={() => handleDeleteMessage(message._id)}
                                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-600">No messages yet</p>
                    <p className="text-sm text-gray-400 mt-1">Start the conversation!</p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply preview */}
              {replyTo && (
                <div className="px-5 py-3 bg-blue-50 border-t border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-blue-800">
                      <span className="font-semibold">Replying to {replyTo.sender.username}:</span>
                      <div className="truncate max-w-[280px] text-blue-600">{replyTo.content}</div>
                    </div>
                    <button
                      onClick={handleCancelReply}
                      className="p-1.5 hover:bg-blue-200 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>
              )}

              {/* Typing indicator */}
              {typingUsers.size > 0 && (
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="text-sm text-gray-600 italic font-medium">
                    {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                    <span className="inline-block typing-dots">...</span>
                  </div>
                </div>
              )}

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-5 border-t border-gray-200 bg-white">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={handleTyping}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 placeholder-gray-400 font-medium chat-input"
                    disabled={!activeChat}
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim() || !activeChat}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold shadow-md hover:shadow-lg"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
