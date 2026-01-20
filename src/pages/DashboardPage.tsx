import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../utils/storage';
import { Job, Bid, Review, Notification, Payment } from '../types';
import { formatDate, calculateAverageRating, getBudgetDisplay, getUserReviews, getUserJobs, getUserBids, formatTimeAgo } from '../utils/helpers';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    const loadData = () => {
      if (!user) return;

      const allJobs = StorageService.getJobs();
      const allBids = StorageService.getBids();
      const allReviews = StorageService.getReviews();
      const allPayments = StorageService.getPayments();
      const allNotifications = StorageService.getNotifications();

      const userJobs = getUserJobs(user.id, allJobs, user.userType);
      const userBids = getUserBids(user.id, allBids);
      
      // For freelancers, also include jobs they've bid on (not just their own jobs)
      const bidJobs = user.userType === 'freelancer' 
        ? allJobs.filter(job => userBids.some(bid => bid.jobId === job.id))
        : [];
      
      const allRelevantJobs = [...userJobs, ...bidJobs].filter((job, index, arr) => 
        arr.findIndex(j => j.id === job.id) === index
      );
      
      const userReviews = getUserReviews(user.id, allReviews);
      const userNotifications = allNotifications.filter(n => n.userId === user.id);

      console.log('Dashboard Data:', {
        userId: user.id,
        userType: user.userType,
        allBidsCount: allBids.length,
        userBidsCount: userBids.length,
        userBids: userBids,
        userJobsCount: userJobs.length,
        bidJobsCount: bidJobs.length,
        allRelevantJobsCount: allRelevantJobs.length,
        allBids: allBids.map(b => ({ id: b.id, freelancerId: b.freelancerId, jobId: b.jobId }))
      });

      setJobs(allRelevantJobs);
      setBids(userBids);
      setReviews(userReviews);
      setPayments(allPayments.filter(p => p.clientId === user.id || p.freelancerId === user.id));
      setNotifications(userNotifications);
      setLastRefresh(new Date());
    };

    loadData();

    // Add event listener for storage changes to refresh dashboard
    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check for changes every 5 seconds as a fallback
    const interval = setInterval(handleStorageChange, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [user]);

  const getAverageRating = () => {
    return calculateAverageRating(reviews);
  };

  const getTotalEarnings = () => {
    if (user?.userType !== 'freelancer') return 0;
    return payments
      .filter(p => p.freelancerId === user.id && p.status === 'released')
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const getTotalSpent = () => {
    if (user?.userType !== 'client') return 0;
    return payments
      .filter(p => p.clientId === user.id && (p.status === 'released' || p.status === 'escrow'))
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const getRecentNotifications = () => {
    return notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  const markNotificationAsRead = (notificationId: string) => {
    const allNotifications = StorageService.getNotifications();
    const notificationIndex = allNotifications.findIndex(n => n.id === notificationId);
    if (notificationIndex !== -1) {
      allNotifications[notificationIndex].read = true;
      StorageService.saveNotifications(allNotifications);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h2>
          <p className="text-gray-600">You need to be signed in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  const isFreelancer = user.userType === 'freelancer';

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.firstName}!
            </h1>
            <p className="text-gray-600">
              {isFreelancer ? 'Manage your freelance career' : 'Manage your projects and team'}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary text-sm"
          >
            Refresh Dashboard
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="text-2xl font-bold text-blue-600">
            {isFreelancer ? bids.length : jobs.length}
          </div>
          <p className="text-gray-600 text-sm">
            {isFreelancer ? 'Total Bids' : 'Total Jobs Posted'}
          </p>
        </div>
        
        <div className="card">
          <div className="text-2xl font-bold text-green-600">
            {jobs.filter(j => j.status === 'in_progress').length}
          </div>
          <p className="text-gray-600 text-sm">Active Projects</p>
        </div>
        
        <div className="card">
          <div className="text-2xl font-bold text-purple-600">
            {jobs.filter(j => j.status === 'completed').length}
          </div>
          <p className="text-gray-600 text-sm">Completed Projects</p>
        </div>
        
        <div className="card">
          <div className="text-2xl font-bold text-yellow-600">
            ${isFreelancer ? getTotalEarnings() : getTotalSpent()}
          </div>
          <p className="text-gray-600 text-sm">
            {isFreelancer ? 'Total Earnings' : 'Total Spent'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {isFreelancer ? 'Recent Bids' : 'Recent Jobs'}
              </h2>
              <Link
                to={isFreelancer ? '/freelancer/bids' : '/client/jobs'}
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            
            <div className="space-y-4">
              {isFreelancer ? (
                (() => {
                  console.log('Rendering bids:', {
                    bidsCount: bids.length,
                    jobsCount: jobs.length,
                    bids: bids.map(b => ({ id: b.id, jobId: b.jobId, amount: b.amount })),
                    jobs: jobs.map(j => ({ id: j.id, title: j.title }))
                  });
                  
                  return bids.slice(0, 5).map(bid => {
                    const job = jobs.find(j => j.id === bid.jobId);
                    console.log('Processing bid:', {
                      bidId: bid.id,
                      bidJobId: bid.jobId,
                      foundJob: !!job,
                      jobTitle: job?.title
                    });
                    
                    if (!job) return null;
                    
                    return (
                      <div key={bid.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              <Link to={`/jobs/${job.id}`} className="hover:text-blue-600">
                                {job.title}
                              </Link>
                            </h3>
                            <p className="text-gray-600 text-sm">
                              Bid: ${bid.amount.toLocaleString()} • {formatDate(bid.createdAt)}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {bid.status}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm">{bid.proposal}</p>
                      </div>
                    );
                  });
                })()
              ) : (
                jobs.slice(0, 5).map(job => (
                  <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          <Link to={`/jobs/${job.id}`} className="hover:text-blue-600">
                            {job.title}
                          </Link>
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {getBudgetDisplay(job.budget, job.budgetType)} • {formatDate(job.createdAt)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {job.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-gray-700 text-sm">{job.bids.length} bids</p>
                      <Link to={`/jobs/${job.id}`} className="text-blue-600 hover:text-blue-500 text-sm">
                        View Details
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {(isFreelancer ? bids.length === 0 : jobs.length === 0) && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {isFreelancer ? 'No bids yet' : 'No jobs posted yet'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {isFreelancer 
                    ? 'Start bidding on projects to grow your career'
                    : 'Post your first job to find talented freelancers'
                  }
                </p>
                <Link
                  to={isFreelancer ? '/jobs' : '/client/post-job'}
                  className="btn-primary"
                >
                  {isFreelancer ? 'Browse Jobs' : 'Post a Job'}
                </Link>
              </div>
            )}
          </div>

          {reviews.length > 0 && (
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Reviews</h2>
                <div className="flex items-center">
                  <span className="text-lg font-semibold text-gray-900 mr-2">
                    {getAverageRating()}
                  </span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`h-5 w-5 ${i < Math.floor(getAverageRating()) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {reviews.slice(0, 3).map(review => (
                  <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notifications</h2>
            <div className="space-y-3">
              {getRecentNotifications().length > 0 ? (
                getRecentNotifications().map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${
                      notification.read 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium text-gray-900 text-sm">{notification.title}</h3>
                      {!notification.read && (
                        <button
                          onClick={() => markNotificationAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-500 text-xs"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                    <p className="text-gray-600 text-xs mb-2">{notification.message}</p>
                    <p className="text-gray-500 text-xs">{formatTimeAgo(notification.createdAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No notifications</p>
              )}
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {isFreelancer ? (
                <>
                  <Link to="/jobs" className="block w-full btn-secondary text-center">
                    Browse Jobs
                  </Link>
                  <Link to="/freelancer/profile" className="block w-full btn-secondary text-center">
                    Edit Profile
                  </Link>
                  <Link to="/messages" className="block w-full btn-secondary text-center">
                    Messages
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/client/post-job" className="block w-full btn-primary text-center">
                    Post New Job
                  </Link>
                  <Link to="/client/jobs" className="block w-full btn-secondary text-center">
                    My Jobs
                  </Link>
                  <Link to="/freelancers" className="block w-full btn-secondary text-center">
                    Find Freelancers
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
