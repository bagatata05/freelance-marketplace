import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../utils/storage';
import { Job } from '../types';
import { formatDate, getBudgetDisplay } from '../utils/helpers';

const ClientJobsPage: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    const loadJobs = () => {
      if (!user) return;

      const allJobs = StorageService.getJobs();
      const clientJobs = allJobs.filter(job => job.clientId === user.id);
      
      // Add bid information to jobs
      const jobsWithBids = clientJobs.map(job => {
        const allBids = StorageService.getBids();
        const jobBids = allBids.filter(bid => bid.jobId === job.id);
        return { ...job, bids: jobBids };
      });

      setJobs(jobsWithBids);
      setLoading(false);
    };

    loadJobs();
  }, [user]);

  const filteredJobs = jobs.filter(job => {
    switch (filter) {
      case 'active':
        return job.status === 'pending' || job.status === 'in_progress';
      case 'completed':
        return job.status === 'completed';
      default:
        return true;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteJob = (jobId: string) => {
    if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      const allJobs = StorageService.getJobs();
      const filteredJobs = allJobs.filter(job => job.id !== jobId);
      StorageService.saveJobs(filteredJobs);
      
      // Also delete related bids
      const allBids = StorageService.getBids();
      const filteredBids = allBids.filter(bid => bid.jobId !== jobId);
      StorageService.saveBids(filteredBids);
      
      setJobs(prev => prev.filter(job => job.id !== jobId));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to view your jobs.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Jobs</h1>
            <p className="text-gray-600">Manage all your posted jobs and track their progress</p>
          </div>
          <Link to="/client/post-job" className="btn-primary">
            Post New Job
          </Link>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Jobs ({jobs.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Active ({jobs.filter(j => j.status === 'pending' || j.status === 'in_progress').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Completed ({jobs.filter(j => j.status === 'completed').length})
          </button>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filter === 'all' ? 'No jobs posted yet' : `No ${filter} jobs`}
          </h3>
          <p className="text-gray-500 mb-4">
            {filter === 'all' 
              ? 'Start by posting your first job to find talented freelancers.'
              : `You don't have any ${filter} jobs at the moment.`
            }
          </p>
          <Link to="/client/post-job" className="btn-primary">
            Post Your First Job
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    <Link to={`/jobs/${job.id}`} className="hover:text-blue-600">
                      {job.title}
                    </Link>
                  </h3>
                  <p className="text-gray-600 mb-3">{job.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {job.skillsRequired.slice(0, 3).map((skill: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                    {job.skillsRequired.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        +{job.skillsRequired.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="ml-4 flex flex-col items-end space-y-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                    {job.status.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="text-red-600 hover:text-red-700 text-sm"
                    disabled={job.status === 'in_progress'}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm text-gray-500">
                <div>
                  <span>Budget: {getBudgetDisplay(job.budget, job.budgetType)}</span>
                  <span className="mx-2">•</span>
                  <span>Posted {formatDate(job.createdAt)}</span>
                </div>
                <div>
                  <span>{job.bids.length} bid{job.bids.length !== 1 ? 's' : ''}</span>
                  <span className="mx-2">•</span>
                  <span>{job.duration}</span>
                </div>
              </div>

              {job.bids.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-900">Recent Bids</h4>
                    <Link to={`/jobs/${job.id}#bids`} className="text-blue-600 hover:text-blue-700 text-sm">
                      View All
                    </Link>
                  </div>
                  <div className="space-y-2">
                    {job.bids.slice(0, 2).map((bid) => (
                      <div key={bid.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                        <div>
                          <span className="font-medium">${bid.amount.toLocaleString()}</span>
                          <span className="text-gray-500 ml-2">• {bid.estimatedDuration}</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {bid.status}
                        </span>
                      </div>
                    ))}
                    {job.bids.length > 2 && (
                      <div className="text-center text-xs text-gray-500 pt-1">
                        +{job.bids.length - 2} more bids
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link 
                  to={`/jobs/${job.id}`} 
                  className="w-full block text-center btn-secondary"
                >
                  View Job Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientJobsPage;
