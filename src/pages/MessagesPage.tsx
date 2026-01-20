import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../utils/storage';
import { User, Job } from '../types';
import ConversationsList from '../components/ConversationsList';
import MessageThread from '../components/MessageThread';

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();
  const [selectedJob, setSelectedJob] = useState<Job | undefined>();

  useEffect(() => {
    // Check if navigation state contains pre-selected conversation
    if (location.state) {
      const state = location.state as { otherUserId?: string; jobId?: string };
      
      if (state.otherUserId) {
        // Find the user
        const allUsers = StorageService.getUsers();
        const otherUser = allUsers.find(u => u.id === state.otherUserId);
        
        if (otherUser) {
          setSelectedUser(otherUser);
          setSelectedJobId(state.jobId);
          
          // Find the job if jobId is provided
          if (state.jobId) {
            const allJobs = StorageService.getJobs();
            const job = allJobs.find(j => j.id === state.jobId);
            setSelectedJob(job);
          }
        }
      }
    }

    // Mark all messages as read when user visits messages page
    if (user) {
      const allMessages = StorageService.getMessages();
      const unreadMessages = allMessages.filter(
        message => message.receiverId === user.id && !message.read
      );
      
      if (unreadMessages.length > 0) {
        // Mark messages as read
        const updatedMessages = allMessages.map(message => {
          if (message.receiverId === user.id && !message.read) {
            return { ...message, read: true };
          }
          return message;
        });
        
        StorageService.saveMessages(updatedMessages);
      }
    }
  }, [location.state, user]);

  const handleSelectConversation = (otherUser: User, jobId?: string, job?: Job) => {
    setSelectedUser(otherUser);
    setSelectedJobId(jobId);
    setSelectedJob(job);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to view messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      {/* Conversations List - Left Side */}
      <div className="w-full md:w-96 border-r border-gray-200 bg-white">
        <ConversationsList
          onSelectConversation={handleSelectConversation}
          selectedUserId={selectedUser?.id}
          selectedJobId={selectedJobId}
        />
      </div>

      {/* Message Thread - Right Side */}
      <div className="hidden md:flex flex-1 flex-col">
        {selectedUser ? (
          <MessageThread
            otherUser={selectedUser}
            jobId={selectedJobId}
            job={selectedJob}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile View - Show message thread when selected */}
      {selectedUser && (
        <div className="md:hidden fixed inset-0 z-50 bg-white">
          <div className="h-full flex flex-col">
            <div className="border-b border-gray-200 px-4 py-3 bg-white">
              <button
                onClick={() => setSelectedUser(null)}
                className="mb-2 text-blue-600 hover:text-blue-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to conversations
              </button>
            </div>
            <MessageThread
              otherUser={selectedUser}
              jobId={selectedJobId}
              job={selectedJob}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
