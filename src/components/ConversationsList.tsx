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
    <div className="h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
      </div>
      
      <div className="divide-y divide-gray-200">
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
              className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {otherUser.firstName.charAt(0)}{otherUser.lastName.charAt(0)}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {otherUser.firstName} {otherUser.lastName}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatMessageTime(conversation.updatedAt)}
                    </span>
                  </div>
                  
                  {job && (
                    <p className="text-xs text-blue-600 truncate mb-1">
                      📋 {job.title}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.lastMessage?.content || 'No messages yet'}
                    </p>
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
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
