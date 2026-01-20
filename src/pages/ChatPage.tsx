import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../utils/storage';
import { Chat, ChatMessage, User } from '../types';
import { formatTimeAgo, formatDateTime, generateId } from '../utils/helpers';

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const loadData = () => {
      if (!user) return;

      const allChats = StorageService.getChats();
      const users = StorageService.getUsers();
      
      setAllUsers(users);
      
      const userChats = allChats.filter((chat: Chat) => 
        chat.participants.includes(user.id)
      );
      setChats(userChats);

      if (chatId) {
        const chat = userChats.find((c: Chat) => c.id === chatId);
        if (chat) {
          setCurrentChat(chat);
          setMessages(chat.messages.sort((a: ChatMessage, b: ChatMessage) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          ));
        } else {
          navigate('/messages');
        }
      }
    };

    loadData();
  }, [user, chatId, navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getChatPartner = (chat: Chat) => {
    const partnerId = chat.participants.find(id => id !== user?.id);
    return allUsers.find(u => u.id === partnerId);
  };

  const getChatPartnerName = (chat: Chat) => {
    const partner = getChatPartner(chat);
    return partner ? `${partner.firstName} ${partner.lastName}` : 'Unknown User';
  };

  const getChatPartnerAvatar = (chat: Chat) => {
    const partner = getChatPartner(chat);
    if (!partner) return '?';
    return `${partner.firstName[0]}${partner.lastName[0]}`;
  };

  const getLastMessage = (chat: Chat) => {
    if (chat.messages.length === 0) return 'No messages yet';
    const lastMessage = chat.messages[chat.messages.length - 1];
    return lastMessage.content.length > 30 
      ? lastMessage.content.substring(0, 30) + '...'
      : lastMessage.content;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentChat || !user) return;

    setIsSending(true);

    const receiverUser = getChatPartner(currentChat);
    const trimmedMessage = newMessage.trim();

    if (!receiverUser) {
      setIsSending(false);
      return;
    }

    const messageObj: ChatMessage = {
      id: generateId(),
      senderId: user.id,
      receiverId: receiverUser.id,
      content: trimmedMessage,
      timestamp: new Date().toISOString(),
      read: false
    };

    const updatedMessages = [...currentChat.messages, messageObj];
    const updatedChat = {
      ...currentChat,
      messages: updatedMessages,
      lastMessageAt: messageObj.timestamp,
    };

    const allChats = StorageService.getChats();
    const chatIndex = allChats.findIndex((c: Chat) => c.id === currentChat.id);
    if (chatIndex !== -1) {
      allChats[chatIndex] = updatedChat;
      StorageService.saveChats(allChats);
    }

    setMessages(updatedMessages);
    setCurrentChat(updatedChat);
    setChats(prev => prev.map((c: Chat) => c.id === currentChat.id ? updatedChat : c));
    setNewMessage('');
    setIsSending(false);
  };

  const markMessagesAsRead = useCallback(() => {
    if (!currentChat || !user) return;

    const updatedMessages = currentChat.messages.map((msg: ChatMessage) => 
      msg.receiverId === user.id && !msg.read 
        ? { ...msg, read: true }
        : msg
    );

    const updatedChat = {
      ...currentChat,
      messages: updatedMessages,
    };

    const allChats = StorageService.getChats();
    const chatIndex = allChats.findIndex((c: Chat) => c.id === currentChat.id);
    if (chatIndex !== -1) {
      allChats[chatIndex] = updatedChat;
      StorageService.saveChats(allChats);
    }

    setCurrentChat(updatedChat);
    setMessages(updatedMessages);
  }, [currentChat, user]);

  useEffect(() => {
    if (currentChat) {
      markMessagesAsRead();
    }
  }, [currentChat, markMessagesAsRead]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to use messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 h-[600px]">
          <div className="lg:col-span-1 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {chats.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {chats.map(chat => (
                    <div
                      key={chat.id}
                      onClick={() => navigate(`/messages/${chat.id}`)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        currentChat?.id === chat.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                            {getChatPartnerAvatar(chat)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {getChatPartnerName(chat)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {chat.messages.length > 0 && formatTimeAgo(chat.lastMessageAt)}
                            </p>
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {getLastMessage(chat)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
                  <p className="text-gray-600 text-sm">Start a conversation by bidding on a project or accepting a bid</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col">
            {currentChat ? (
              <>
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                      {getChatPartnerAvatar(currentChat)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {getChatPartnerName(currentChat)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getChatPartner(currentChat)?.userType === 'freelancer' ? 'Freelancer' : 'Client'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === user.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.senderId === user.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {formatDateTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-gray-200">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 input-field"
                      disabled={isSending}
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || isSending}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                  {isSending ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Send'
                  )}
                </button>
              </form>
            </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-4">📱</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a conversation</h3>
                  <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
