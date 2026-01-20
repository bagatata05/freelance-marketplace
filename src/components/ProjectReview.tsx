import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../utils/storage';
import { Job } from '../types';
import type { ProjectSubmission as ProjectSubmissionType } from '../types';

interface ProjectReviewProps {
  job: Job;
  onReviewComplete?: () => void;
}

const ProjectReview: React.FC<ProjectReviewProps> = ({ job, onReviewComplete }) => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!job.submission) {
    return null;
  }

  const canReview = user?.id === job.clientId && job.status === 'in_progress' && job.submission.status === 'submitted';

  const handleDownload = () => {
    if (!job.submission) return;

    try {
      // Convert base64 back to blob
      const base64Data = job.submission.fileData.split(',')[1]; // Remove data URL prefix
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/zip' });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = job.submission.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const handleApprove = () => {
    if (!job || !user || !job.submission) return;

    setIsSubmitting(true);

    try {
      // Update submission status
      const updatedSubmission: ProjectSubmissionType = {
        ...job.submission,
        status: 'approved',
        clientFeedback: feedback
      };

      // Update job status to completed
      const updatedJob = {
        ...job,
        status: 'completed' as const,
        submission: updatedSubmission
      };

      const allJobs = StorageService.getJobs();
      const jobIndex = allJobs.findIndex(j => j.id === job.id);
      
      if (jobIndex !== -1) {
        allJobs[jobIndex] = updatedJob;
        StorageService.saveJobs(allJobs);
      }

      // Create notification for freelancer
      const freelancerNotification = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: job.selectedFreelancerId!,
        type: 'job_completed' as const,
        title: 'Project Approved!',
        message: `Your project submission for "${job.title}" has been approved! Payment will be released.`,
        read: false,
        createdAt: new Date().toISOString(),
        actionUrl: `/jobs/${job.id}`
      };

      const allNotifications = StorageService.getNotifications();
      allNotifications.push(freelancerNotification);
      StorageService.saveNotifications(allNotifications);

      // Create notification for client
      const clientNotification = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        type: 'payment_received' as const,
        title: 'Project Completed',
        message: `You have approved the project for "${job.title}". The payment has been released to the freelancer.`,
        read: false,
        createdAt: new Date().toISOString(),
        actionUrl: `/jobs/${job.id}`
      };

      allNotifications.push(clientNotification);
      StorageService.saveNotifications(allNotifications);

      setIsSubmitting(false);
      alert('Project approved! Payment has been released to the freelancer.');
      onReviewComplete?.();

    } catch (error) {
      console.error('Approval failed:', error);
      setIsSubmitting(false);
      alert('Approval failed. Please try again.');
    }
  };

  const handleReject = () => {
    if (!job || !user || !job.submission) return;

    if (!feedback.trim()) {
      alert('Please provide feedback for the rejection.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Update submission status
      const updatedSubmission: ProjectSubmissionType = {
        ...job.submission,
        status: 'rejected',
        clientFeedback: feedback
      };

      // Update job with rejected submission (keep job in progress)
      const updatedJob = {
        ...job,
        submission: updatedSubmission
      };

      const allJobs = StorageService.getJobs();
      const jobIndex = allJobs.findIndex(j => j.id === job.id);
      
      if (jobIndex !== -1) {
        allJobs[jobIndex] = updatedJob;
        StorageService.saveJobs(allJobs);
      }

      // Create notification for freelancer
      const freelancerNotification = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: job.selectedFreelancerId!,
        type: 'job_completed' as const,
        title: 'Project Revisions Required',
        message: `Your project submission for "${job.title}" requires revisions. Please check the client's feedback.`,
        read: false,
        createdAt: new Date().toISOString(),
        actionUrl: `/jobs/${job.id}`
      };

      const allNotifications = StorageService.getNotifications();
      allNotifications.push(freelancerNotification);
      StorageService.saveNotifications(allNotifications);

      setIsSubmitting(false);
      alert('Project has been rejected with feedback. The freelancer will be notified.');
      setFeedback('');
      onReviewComplete?.();

    } catch (error) {
      console.error('Rejection failed:', error);
      setIsSubmitting(false);
      alert('Rejection failed. Please try again.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFreelancerName = () => {
    const allUsers = StorageService.getUsers();
    const freelancer = allUsers.find(u => u.id === job.selectedFreelancerId);
    return freelancer ? `${freelancer.firstName} ${freelancer.lastName}` : 'Unknown Freelancer';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-blue-900">Project Submission</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.submission.status)}`}>
          {job.submission.status.charAt(0).toUpperCase() + job.submission.status.slice(1)}
        </span>
      </div>

      <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 mb-1">
              Submitted by {getFreelancerName()}
            </p>
            <p className="text-sm text-gray-500 mb-2">
              {job.submission.fileName} • {formatFileSize(job.submission.fileSize)}
            </p>
            <p className="text-xs text-gray-400">
              Submitted on {new Date(job.submission.submittedAt).toLocaleDateString()} at {new Date(job.submission.submittedAt).toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={handleDownload}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
        </div>
      </div>

      {job.submission.clientFeedback && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-2">Client Feedback:</h4>
          <p className="text-gray-700">{job.submission.clientFeedback}</p>
        </div>
      )}

      {canReview && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback (Required for rejection)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide feedback for the freelancer..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleApprove}
              disabled={isSubmitting}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Processing...' : 'Approve & Complete'}
            </button>
            <button
              onClick={handleReject}
              disabled={isSubmitting || !feedback.trim()}
              className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Processing...' : 'Request Revisions'}
            </button>
          </div>
        </div>
      )}

      {job.submission.status === 'approved' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-800 font-medium">
              This project has been approved and marked as completed. Payment has been released to the freelancer.
            </p>
          </div>
        </div>
      )}

      {job.submission.status === 'rejected' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-yellow-800 font-medium">
              This project requires revisions. The freelancer has been notified with your feedback.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectReview;
