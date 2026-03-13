import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../utils/storage';
import { Conversation, User, Job } from '../types';

interface ConversationsListProps {
  onSelectConversation: (otherUser: User, jobId?: string, job?: Job) => void;
  selectedUserId?: string;
  selectedJobId?: string;
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  onSelectConversation,
  selectedUserId,
  selectedJobId
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const formatMessageTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  useEffect(() => {
    if (!user) return;

    const loadData = () => {
      const userConversations = StorageService.getConversationsForUser(user.id);
      const allUsers = StorageService.getUsers();
      const allJobs = StorageService.getJobs();

      setConversations(userConversations.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ));
      setUsers(allUsers);
      setJobs(allJobs);
      setLoading(false);
    };

    loadData();

    // Set up polling for new conversations
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const getOtherUser = (conversation: Conversation): User | null => {
    const otherUserId = conversation.participants.find(id => id !== user?.id);
    return otherUserId ? users.find(u => u.id === otherUserId) || null : null;
  };

  const getJob = (conversation: Conversation): Job | null => {
    return conversation.jobId ? jobs.find(j => j.id === conversation.jobId) || null : null;
  };

  const getUnreadCount = (conversation: Conversation): number => {
    if (!user) return 0;
    const messages = StorageService.getMessagesBetweenUsers(
      conversation.participants[0], 
      conversation.participants[1], 
      conversation.jobId
    );
    return messages.filter(msg => msg.receiverId === user.id && !msg.read).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
        <p className="text-gray-500 text-sm">
          Start a conversation by bidding on a job or accepting an invitation!
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
           <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Chats</h2>
           <button className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
           </button>
        </div>
        <div className="relative">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           </div>
           <input type="text" placeholder="Search Messenger..." className="w-full pl-9 pr-4 py-2 bg-[#f0f2f5] border-transparent rounded-full focus:outline-none focus:ring-0 focus:bg-[#e4e6e9] transition-colors text-[15px] placeholder:text-gray-500" />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden pt-2 px-2 pb-4 space-y-1">
        {conversations.map((conversation) => {
          const otherUser = getOtherUser(conversation);
          const job = getJob(conversation);
          const unreadCount = getUnreadCount(conversation);
          const isSelected = otherUser && selectedUserId === otherUser.id && 
                           (!selectedJobId || selectedJobId === conversation.jobId);

          if (!otherUser) return null;

          return (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(otherUser, conversation.jobId, job || undefined)}
              className={`p-3 rounded-xl mx-1 cursor-pointer transition-colors relative group ${
                isSelected ? 'bg-[#f0f2f5]' : 'hover:bg-[#f0f2f5]/80'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative flex-shrink-0">
                  <div className="w-[52px] h-[52px] bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-lg font-bold text-white">
                      {otherUser.firstName.charAt(0)}{otherUser.lastName.charAt(0)}
                    </span>
                  </div>
                  {/* Fake Online Indicator */}
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-baseline justify-between">
                    <p className={`text-[15px] truncate max-w-[160px] ${unreadCount > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
                      {otherUser.firstName} {otherUser.lastName}
                    </p>
                    <span className={`text-[13px] flex-shrink-0 ${unreadCount > 0 ? 'text-[#0084ff] font-semibold' : 'text-gray-500'}`}>
                      {formatMessageTime(conversation.updatedAt)}
                    </span>
                  </div>
                  
                  {job && (
                    <p className="text-[12px] text-blue-600 truncate mb-0.5 mt-0.5 pr-6">
                      Re: {job.title}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <p className={`text-[14px] truncate pr-2 ${unreadCount > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                      {conversation.lastMessage?.content || 'Say hello...'}
                    </p>
                    {/* Action button visibility on hover */}
                     <button className="opacity-0 group-hover:opacity-100 p-1.5 absolute right-3 bg-white border border-gray-200 shadow-sm rounded-full text-gray-500 hover:text-gray-800 transition-opacity">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                     </button>
                    {unreadCount > 0 && (
                      <div className="w-2.5 h-2.5 bg-[#0084ff] rounded-full flex-shrink-0 mt-1"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConversationsList;
