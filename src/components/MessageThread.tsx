import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../utils/storage';
import { Message, User, Job } from '../types';

interface MessageThreadProps {
  otherUser: User;
  jobId?: string;
  job?: Job;
  onOpenInfo?: () => void;
}

const MessageThread: React.FC<MessageThreadProps> = ({ otherUser, jobId, job, onOpenInfo }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;

    const loadMessages = () => {
      const conversationMessages = StorageService.getMessagesBetweenUsers(
        user.id, 
        otherUser.id, 
        jobId
      );
      setMessages(conversationMessages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ));

      // Mark messages as read
      const unreadMessageIds = conversationMessages
        .filter(msg => msg.receiverId === user.id && !msg.read)
        .map(msg => msg.id);
      
      if (unreadMessageIds.length > 0) {
        StorageService.markMessagesAsRead(unreadMessageIds);
      }

      // Update message count to detect new messages
      setMessageCount(conversationMessages.length);
    };

    loadMessages();

    // Set up polling for new messages
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, [user, otherUser.id, jobId]);

  useEffect(() => {
    // Only scroll to bottom when new messages are added (message count increases)
    if (messages.length > messageCount) {
      scrollToBottom();
      setMessageCount(messages.length);
    }
  }, [messages, messageCount]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setIsLoading(true);

    try {
      const message = StorageService.sendMessage({
        senderId: user.id,
        receiverId: otherUser.id,
        jobId,
        content: newMessage.trim(),
        messageType: 'text'
      });

      setMessages(prev => [...prev, message]);
      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = diffInMs / (1000 * 60);
    const diffInHours = diffInMinutes / 60;
    const diffInDays = diffInHours / 24;

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${Math.floor(diffInMinutes)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Please sign in to send messages</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header (Hidden on Mobile b/c MessagesPage handles it now) */}
      <div className="hidden md:flex border-b border-gray-100 flex-shrink-0 px-6 py-4 bg-white items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-sm">
               {otherUser.firstName.charAt(0)}{otherUser.lastName.charAt(0)}
             </div>
             <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white absolute bottom-0 right-0"></div>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 leading-tight">
              {otherUser.firstName} {otherUser.lastName}
            </h3>
            {job && (
              <p className="text-xs text-gray-500 font-medium">
                Re: {job.title}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 xl:hidden">
             {onOpenInfo && (
               <button onClick={onOpenInfo} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               </button>
             )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-5 bg-white relative scroll-smooth flex flex-col">
        {/* Scroll Controls */}
        {messages.length > 5 && (
          <div className="sticky top-4 right-4 z-10 flex flex-col space-y-2 self-end">
            <button
              onClick={scrollToTop}
              className="bg-white/80 backdrop-blur border border-gray-100 shadow-sm rounded-full p-2 hover:bg-gray-50 transition-colors"
              title="Scroll to top"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
            <button
              onClick={scrollToBottom}
              className="bg-white/80 backdrop-blur border border-gray-100 shadow-sm rounded-full p-2 hover:bg-gray-50 transition-colors"
              title="Scroll to bottom"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        )}
        
        {messages.length === 0 ? (
          <div className="text-center py-10 flex-1 flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-900 font-semibold text-lg">Send your first message</p>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              Say hello to {otherUser.firstName} to get the conversation started!
            </p>
          </div>
        ) : (
          <div className="flex flex-col space-y-1.5 mt-auto text-[15px]">
            {messages.map((message, index) => {
               const isMe = message.senderId === user.id;
               // Need some logic to know if next message is from same sender to cluster borders
               const nextMessage = messages[index + 1];
               const prevMessage = messages[index - 1];
               
               const isFirstInSequence = !prevMessage || prevMessage.senderId !== message.senderId;
               const isLastInSequence = !nextMessage || nextMessage.senderId !== message.senderId;

               return (
                  <div
                    key={message.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isFirstInSequence ? 'mt-4' : ''}`}
                  >
                    {!isMe && isLastInSequence && (
                       <div className="w-7 h-7 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full flex-shrink-0 mr-2 self-end shadow-sm flex items-center justify-center text-white text-[10px] font-bold">
                          {otherUser.firstName.charAt(0)}{otherUser.lastName.charAt(0)}
                       </div>
                    )}
                    {!isMe && !isLastInSequence && <div className="w-7 mr-2"></div>}
                    <div
                      title={formatMessageTime(message.createdAt)}
                      className={`max-w-[75%] md:max-w-[65%] px-4 py-2.5 shadow-sm 
                        ${isMe ? 'bg-[#0084ff] text-white' : 'bg-[#e4e6eb] text-gray-900'}
                        ${isMe && isFirstInSequence ? 'rounded-tl-[20px] rounded-tr-[20px] rounded-bl-[20px] rounded-br-md' : ''}
                        ${isMe && !isFirstInSequence && !isLastInSequence ? 'rounded-l-[20px] rounded-r-md' : ''}
                        ${isMe && isLastInSequence && !isFirstInSequence ? 'rounded-tl-[20px] rounded-tr-md rounded-bl-[20px] rounded-br-[20px]' : ''}
                        ${isMe && isFirstInSequence && isLastInSequence ? 'rounded-[20px]' : ''}
                        
                        ${!isMe && isFirstInSequence ? 'rounded-tr-[20px] rounded-tl-[20px] rounded-br-[20px] rounded-bl-md' : ''}
                        ${!isMe && !isFirstInSequence && !isLastInSequence ? 'rounded-r-[20px] rounded-l-md' : ''}
                        ${!isMe && isLastInSequence && !isFirstInSequence ? 'rounded-tr-[20px] rounded-tl-md rounded-br-[20px] rounded-bl-[20px]' : ''}
                        ${!isMe && isFirstInSequence && isLastInSequence ? 'rounded-[20px]' : ''}
                      `}
                    >
                      <p className="break-words leading-snug">{message.content}</p>
                    </div>
                  </div>
               );
            })}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Pill */}
      <div className="px-4 py-4 bg-white border-t border-gray-100 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
           {/* Utility Icons (Visual only for now) */}
           <div className="flex space-x-2 pb-2 text-[#0084ff] pr-1">
              <button type="button" className="p-1.5 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </button>
              <button type="button" className="p-1.5 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </button>
              <button type="button" className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                 <svg className="w-6 h-6 transform rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              </button>
           </div>
           
           {/* Input field */}
           <div className="flex-1 relative">
             <input
               ref={inputRef}
               type="text"
               value={newMessage}
               onChange={(e) => setNewMessage(e.target.value)}
               placeholder={`Message ${otherUser.firstName}...`}
               className="w-full pl-4 pr-12 py-3 bg-[#f0f2f5] border-transparent rounded-[20px] focus:outline-none focus:ring-0 focus:bg-[#e4e6e9] transition-colors placeholder:text-gray-500 font-medium text-[15px]"
               disabled={isLoading}
             />
             <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#0084ff] hover:bg-gray-200 rounded-full transition-colors z-10">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </button>
           </div>
           
           <button
             type="submit"
             disabled={!newMessage.trim() || isLoading}
             className="p-3 text-[#0084ff] disabled:text-gray-300 hover:bg-gray-100 disabled:hover:bg-transparent rounded-full transition-colors flex-shrink-0"
           >
              {isLoading ? (
                  <svg className="animate-spin h-6 w-6" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               ) : (
                  <svg className="w-6 h-6 transform rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
               )}
           </button>
        </form>
      </div>
    </div>
  );
};

export default MessageThread;
