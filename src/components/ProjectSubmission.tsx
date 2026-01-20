import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../utils/storage';
import { Job } from '../types';
import type { ProjectSubmission as ProjectSubmissionType } from '../types';
import { generateId } from '../utils/helpers';

interface ProjectSubmissionProps {
  job: Job;
  onSubmissionComplete?: () => void;
}

const ProjectSubmission: React.FC<ProjectSubmissionProps> = ({ job, onSubmissionComplete }) => {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        alert('File size must be less than 50MB');
        return;
      }

      // Check file type (only zip files)
      if (!file.name.toLowerCase().endsWith('.zip')) {
        alert('Only ZIP files are allowed');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user || !job.selectedFreelancerId) return;

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      // Convert file to base64
      const fileData = await fileToBase64(selectedFile);
      
      // Create submission object
      const submission: ProjectSubmissionType = {
        id: generateId(),
        jobId: job.id,
        freelancerId: user.id,
        fileName: selectedFile.name,
        fileData: fileData,
        fileSize: selectedFile.size,
        submittedAt: new Date().toISOString(),
        status: 'submitted'
      };

      // Update job with submission
      const allJobs = StorageService.getJobs();
      const jobIndex = allJobs.findIndex(j => j.id === job.id);
      
      if (jobIndex !== -1) {
        allJobs[jobIndex] = {
          ...allJobs[jobIndex],
          submission: submission
        };
        StorageService.saveJobs(allJobs);
      }

      // Create notification for client
      const notification = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: job.clientId,
        type: 'job_completed' as const,
        title: 'Project Submitted',
        message: `${user.firstName} ${user.lastName} has submitted their work for "${job.title}". Please review and approve.`,
        read: false,
        createdAt: new Date().toISOString(),
        actionUrl: `/jobs/${job.id}`
      };

      const allNotifications = StorageService.getNotifications();
      allNotifications.push(notification);
      StorageService.saveNotifications(allNotifications);

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setIsSubmitting(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      alert('Project submitted successfully! The client has been notified.');
      onSubmissionComplete?.();

    } catch (error) {
      console.error('Upload failed:', error);
      setIsSubmitting(false);
      alert('Upload failed. Please try again.');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canSubmit = user?.id === job.selectedFreelancerId && job.status === 'in_progress' && !job.submission;

  if (!canSubmit) {
    return null;
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <svg className="h-6 w-6 text-green-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <h3 className="text-lg font-semibold text-green-900">Submit Project</h3>
      </div>

      <p className="text-green-800 mb-4">
        Upload your completed project as a ZIP file. The client will be notified and can review your work.
      </p>

      <div className="space-y-4">
        <div>
          <label htmlFor="zip-file-upload" className="block text-sm font-medium text-gray-700 mb-2">
            Select ZIP File
          </label>
          <input
            id="zip-file-upload"
            ref={fileInputRef}
            type="file"
            accept=".zip"
            onChange={handleFileSelect}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Choose a ZIP file to upload"
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum file size: 50MB. Only ZIP files are accepted.
          </p>
        </div>

        {selectedFile && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-8 w-8 text-yellow-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="text-red-500 hover:text-red-700"
                aria-label="Remove selected file"
                title="Remove file"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {isSubmitting && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Uploading...</span>
              <span className="text-sm text-gray-500">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 bg-green-600 ${
                  uploadProgress === 0 ? 'w-0' :
                  uploadProgress <= 10 ? 'w-1/12' :
                  uploadProgress <= 20 ? 'w-1/6' :
                  uploadProgress <= 30 ? 'w-1/4' :
                  uploadProgress <= 40 ? 'w-1/3' :
                  uploadProgress <= 50 ? 'w-5/12' :
                  uploadProgress <= 60 ? 'w-7/12' :
                  uploadProgress <= 70 ? 'w-3/4' :
                  uploadProgress <= 80 ? 'w-5/6' :
                  uploadProgress <= 90 ? 'w-11/12' :
                  'w-full'
                }`}
              />
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isSubmitting}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Uploading...' : 'Submit Project'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectSubmission;
