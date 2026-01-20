import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../utils/storage';
import { User, Job } from '../types';
import { getBudgetDisplay } from '../utils/helpers';

interface InviteFreelancerModalProps {
  freelancer: User;
  isOpen: boolean;
  onClose: () => void;
}

const InviteFreelancerModal: React.FC<InviteFreelancerModalProps> = ({
  freelancer,
  isOpen,
  onClose
}) => {
  const { user } = useAuth();
  const [clientJobs, setClientJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user?.userType === 'client') {
      const allJobs = StorageService.getJobs();
      const activeClientJobs = allJobs.filter(job => 
        job.clientId === user.id && 
        (job.status === 'pending' || job.status === 'in_progress')
      );
      setClientJobs(activeClientJobs);
    }
  }, [isOpen, user]);

  const handleInvite = () => {
    if (!user || user.userType !== 'client') return;
    
    if (!selectedJob) {
      alert('Please select a job to invite the freelancer to.');
      return;
    }

    setLoading(true);

    // Update the job to include the invited freelancer
    const allJobs = StorageService.getJobs();
    const jobIndex = allJobs.findIndex(job => job.id === selectedJob);
    
    if (jobIndex !== -1) {
      const job = allJobs[jobIndex];
      
      // Add freelancer to invited list if not already there
      if (!job.invitedFreelancers) {
        job.invitedFreelancers = [];
      }
      
      if (!job.invitedFreelancers.includes(freelancer.id)) {
        job.invitedFreelancers.push(freelancer.id);
        StorageService.saveJobs(allJobs);
      }
    }

    // Create a notification for the freelancer with invitation details
    const notification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: freelancer.id,
      type: 'job_invitation' as const,
      title: 'Job Invitation',
      message: `${user.firstName} ${user.lastName} has invited you to work on their job: ${clientJobs.find(j => j.id === selectedJob)?.title}`,
      read: false,
      createdAt: new Date().toISOString(),
      actionUrl: `/jobs/${selectedJob}?invitation=true&from=${user.id}`
    };

    const allNotifications = StorageService.getNotifications();
    allNotifications.push(notification);
    StorageService.saveNotifications(allNotifications);

    // Create a notification for the client
    const clientNotification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      type: 'invitation_sent' as const,
      title: 'Invitation Sent',
      message: `You have invited ${freelancer.firstName} ${freelancer.lastName} to work on your job: ${clientJobs.find(j => j.id === selectedJob)?.title}`,
      read: false,
      createdAt: new Date().toISOString(),
      actionUrl: `/jobs/${selectedJob}`
    };

    allNotifications.push(clientNotification);
    StorageService.saveNotifications(allNotifications);

    setTimeout(() => {
      setLoading(false);
      alert(`Invitation sent to ${freelancer.firstName} ${freelancer.lastName}! They can now accept the job directly.`);
      onClose();
      setSelectedJob('');
      setMessage('');
    }, 1000);
  };

  const handleCreateNewJob = () => {
    // Close modal and navigate to post job with freelancer pre-selected
    onClose();
    // In a real app, you might pass the freelancer ID in state or URL params
    window.location.href = '/client/post-job';
  };

  if (!isOpen) return null;

  if (!user || user.userType !== 'client') {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3 text-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Access Denied</h3>
            <div className="mt-2 px-7 py-3">
              <p className="text-sm text-gray-500">Only clients can invite freelancers to jobs.</p>
            </div>
            <div className="items-center px-4 py-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-24 hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Invite {freelancer.firstName} {freelancer.lastName}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close invitation modal"
              title="Close"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Freelancer Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium mr-3">
                {freelancer.firstName[0]}{freelancer.lastName[0]}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {freelancer.firstName} {freelancer.lastName}
                </h4>
                {freelancer.profile?.title && (
                  <p className="text-sm text-gray-600">{freelancer.profile.title}</p>
                )}
              </div>
            </div>
          </div>

          {/* Job Selection */}
          <div className="mb-4">
            <label htmlFor="job-selection" className="block text-sm font-medium text-gray-700 mb-2">
              Select Job to Invite To
            </label>
            {clientJobs.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-gray-600 mb-3">You don't have any active jobs to invite to.</p>
                <button
                  onClick={handleCreateNewJob}
                  className="btn-primary text-sm"
                >
                  Create New Job
                </button>
              </div>
            ) : (
              <div>
                <select
                  id="job-selection"
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                >
                  <option value="">Choose a job...</option>
                  {clientJobs.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.title} - {getBudgetDisplay(job.budget, job.budgetType)}
                    </option>
                  ))}
                </select>
                
                <button
                  onClick={handleCreateNewJob}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  or create a new job
                </button>
              </div>
            )}
          </div>

          {/* Optional Message */}
          <div className="mb-4">
            <label htmlFor="personal-message" className="block text-sm font-medium text-gray-700 mb-2">
              Personal Message (Optional)
            </label>
            <textarea
              id="personal-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to your invitation..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleInvite}
              disabled={!selectedJob || loading}
              className="px-4 py-2 bg-blue-600 text-white text-base font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteFreelancerModal;
