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

  // State to manage mobile/tablet views (if sidebar is open)
  const [showRightPanel, setShowRightPanel] = useState(false);

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
    setShowRightPanel(false); // Close panel when switching chats on smaller screens
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to view messages.</p>
        </div>
      </div>
    );
  }

  // Right Side Info Panel (Desktop) or Drawer (Mobile) Content (Dummy structure based on ref)
  const InfoPanel = () => (
    <div className="h-full flex flex-col bg-white overflow-y-auto">
       {selectedUser ? (
         <div className="p-6 flex flex-col items-center border-b border-gray-100">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg mb-4">
              {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-gray-900">{selectedUser.firstName} {selectedUser.lastName}</h2>
            {selectedJob && <p className="text-sm text-blue-600 font-medium mt-1 text-center bg-blue-50 py-1 px-3 rounded-full">{selectedJob.title}</p>}
            <p className="text-sm text-gray-500 mt-2">Active now</p>

            {/* Quick Actions */}
            <div className="flex w-full gap-3 mt-6">
              <button className="flex-1 flex flex-col items-center justify-center gap-2 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-700">
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <span className="text-xs font-semibold text-gray-600">Audio</span>
              </button>
              <button className="flex-1 flex flex-col items-center justify-center gap-2 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors">
                 <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-700">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                 </div>
                 <span className="text-xs font-semibold text-gray-600">Video</span>
              </button>
            </div>
         </div>
       ) : (
         <div className="p-6 flex flex-col items-center">
             <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 shadow-inner mb-4">
                 <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
             </div>
             <p className="text-gray-500 font-medium">No contact selected</p>
         </div>
       )}

       <div className="flex-1 overflow-y-auto">
          {/* Settings Group */}
          <div className="p-4 border-b border-gray-100">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Settings</h3>
             <button className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group">
                <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600">Search in Conversation</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </button>
             <button className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group mt-1">
                <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600">Change Color</span>
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
             </button>
              <button className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group mt-1">
                <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-600">Change Emoji</span>
                <span>👍</span>
             </button>
          </div>

          {/* Shared Photos Gallery Placeholder */}
          <div className="p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2 flex justify-between items-center">
              Shared Media
              <span className="text-blue-500 text-[10px] cursor-pointer hover:underline">See All</span>
            </h3>
            <div className="grid grid-cols-3 gap-2 px-2">
               {/* Dummy generated colorful boxes */}
               {['bg-orange-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-pink-400', 'bg-yellow-400'].map((color, i) => (
                 <div key={i} className={`aspect-square rounded-lg ${color} opacity-80 hover:opacity-100 cursor-pointer transition-opacity shadow-sm flex items-center justify-center`}>
                    <svg className="w-6 h-6 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 </div>
               ))}
            </div>
          </div>
       </div>
    </div>
  );

  return (
    // Force full viewport height minus navbar height (usually ~73px)
    <div className="h-[calc(100vh-73px)] w-full flex bg-gray-50 overflow-hidden">
      
      {/* LEFT COLUMN: Conversations List */}
      <div className={`${selectedUser ? 'hidden md:flex' : 'flex'} w-full md:w-[320px] lg:w-[360px] h-full flex-col border-r border-gray-200 bg-white flex-shrink-0 z-10 shadow-[2px_0_8px_rgba(0,0,0,0.02)]`}>
        <ConversationsList
          onSelectConversation={handleSelectConversation}
          selectedUserId={selectedUser?.id}
          selectedJobId={selectedJobId}
        />
      </div>

      {/* MIDDLE COLUMN: Message Thread */}
      <div className={`${!selectedUser ? 'hidden md:flex' : 'flex'} flex-1 h-full flex-col relative z-0`}>
        {selectedUser ? (
          <div className="w-full h-full flex flex-col pt-0">
             {/* Mobile Header Override to add back button */}
             <div className="md:hidden flex items-center px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="mr-3 p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="flex-1 min-w-0">
                   <h2 className="text-lg font-bold text-gray-900 truncate">{selectedUser.firstName} {selectedUser.lastName}</h2>
                </div>
                <button onClick={() => setShowRightPanel(true)} className="p-2 -mr-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
             </div>
             
             {/* Actual Thread */}
             <div className="flex-1 h-full overflow-hidden">
                <MessageThread
                  otherUser={selectedUser}
                  jobId={selectedJobId}
                  job={selectedJob}
                  onOpenInfo={() => setShowRightPanel(true)}
                />
             </div>
          </div>
        ) : (
          <div className="flex items-center justify-center flex-1 h-full bg-[#f9fafc]">
            <div className="text-center px-6 py-10 bg-white shadow-sm border border-gray-100 rounded-3xl max-w-sm">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Your Messages</h3>
              <p className="text-gray-500 text-sm">Select a conversation from the sidebar or start a new one to connect with talent.</p>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Contact Info / Shared Media (Desktop only natively) */}
      <div className={`hidden xl:block w-[320px] 2xl:w-[380px] h-full border-l border-gray-200 bg-white flex-shrink-0 z-10 shadow-[-2px_0_8px_rgba(0,0,0,0.02)] transition-all duration-300 ${selectedUser ? 'opacity-100 translate-x-0' : 'opacity-50 translate-x-4 pointer-events-none'}`}>
        <InfoPanel />
      </div>

      {/* Mobile/Tablet Right Info Panel Drawer */}
      {showRightPanel && (
         <div className="xl:hidden fixed inset-0 z-50 flex justify-end bg-gray-900/20 backdrop-blur-sm transition-opacity" onClick={() => setShowRightPanel(false)}>
            <div className="w-80 h-full bg-white shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
               <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">Details</h2>
                  <button onClick={() => setShowRightPanel(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
               </div>
               <div className="h-[calc(100vh-65px)]">
                 <InfoPanel />
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default MessagesPage;
