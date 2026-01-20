import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../utils/storage';
import { Job, Bid, User, Payment } from '../types';
import { formatDate, generateId, getBudgetDisplay, createNotification } from '../utils/helpers';
import ProjectSubmission from '../components/ProjectSubmission';
import ProjectReview from '../components/ProjectReview';

const JobDetailPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [job, setJob] = useState<Job | null>(null);
  const [client, setClient] = useState<User | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [isPlacingBid, setIsPlacingBid] = useState(false);
  const [bidForm, setBidForm] = useState({
    amount: '',
    proposal: '',
    estimatedDuration: '',
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [isInvitation, setIsInvitation] = useState(false);
  const [invitedBy, setInvitedBy] = useState<string | null>(null);

  useEffect(() => {
    const loadData = () => {
      if (!jobId) return;

      const allJobs = StorageService.getJobs();
      const foundJob = allJobs.find(j => j.id === jobId);
      
      if (!foundJob) {
        navigate('/jobs');
        return;
      }

      setJob(foundJob);

      // Check if this is an invitation
      const invitationParam = searchParams.get('invitation');
      const fromParam = searchParams.get('from');
      setIsInvitation(invitationParam === 'true');
      setInvitedBy(fromParam);

      // Load client info
      const allUsers = StorageService.getUsers();
      const clientUser = allUsers.find(u => u.id === foundJob.clientId);
      setClient(clientUser || null);

      // Load bids
      const allBids = StorageService.getBids();
      const jobBids = allBids.filter(bid => bid.jobId === jobId);
      setBids(jobBids);
    };

    loadData();
  }, [jobId, navigate, searchParams]);

  const handleBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!job || !user || user.userType !== 'freelancer') return;

    const newBid: Bid = {
      id: generateId(),
      jobId: job.id,
      freelancerId: user.id,
      amount: parseFloat(bidForm.amount),
      proposal: bidForm.proposal,
      estimatedDuration: bidForm.estimatedDuration,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const allBids = StorageService.getBids();
    console.log('Before saving bid:', {
      newBid,
      currentBidsCount: allBids.length,
      userId: user.id,
      userType: user.userType
    });
    allBids.push(newBid);
    StorageService.saveBids(allBids);

    console.log('After saving bid:', {
      totalBidsCount: allBids.length,
      savedBid: newBid
    });

    const updatedJob = { ...job, bids: [...job.bids, newBid] };
    const allJobs = StorageService.getJobs();
    const jobIndex = allJobs.findIndex(j => j.id === job.id);
    if (jobIndex !== -1) {
      allJobs[jobIndex] = updatedJob;
      StorageService.saveJobs(allJobs);
    }

    const notification = createNotification(
      job.clientId,
      'bid_received',
      'New Bid Received',
      `${user.firstName} ${user.lastName} has placed a bid on your job "${job.title}"`,
      `/jobs/${job.id}`
    );
    const allNotifications = StorageService.getNotifications();
    allNotifications.push(notification);
    StorageService.saveNotifications(allNotifications);

    setBids([...bids, newBid]);
    setJob(updatedJob);
    setIsPlacingBid(false);
    setBidForm({ amount: '', proposal: '', estimatedDuration: '' });
  };

  const handleAcceptBid = (bid: Bid) => {
    if (!job || !user || user.userType !== 'client') return;

    setSelectedBid(bid);
    setShowPaymentModal(true);
  };

  const handlePaymentConfirm = () => {
    if (!job || !selectedBid || !user) return;

    const payment: Payment = {
      id: generateId(),
      jobId: job.id,
      clientId: job.clientId,
      freelancerId: selectedBid.freelancerId,
      amount: selectedBid.amount,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const allPayments = StorageService.getPayments();
    allPayments.push(payment);
    StorageService.savePayments(allPayments);

    // Update all other bids to rejected
    const updatedBids = bids.map(b => 
      b.id === selectedBid.id 
        ? { ...b, status: 'accepted' as const }
        : { ...b, status: 'rejected' as const }
    );

    // Update the job with new bids and status
    const updatedJob = {
      ...job,
      status: 'in_progress' as const,
      selectedFreelancerId: selectedBid.freelancerId,
      bids: updatedBids,
    };

    const allJobs = StorageService.getJobs();
    const jobIndex = allJobs.findIndex(j => j.id === job.id);
    if (jobIndex !== -1) {
      allJobs[jobIndex] = updatedJob;
      StorageService.saveJobs(allJobs);
    }

    // Update bids in storage
    StorageService.saveBids(updatedBids);

    // Create notifications
    const freelancerNotification = createNotification(
      selectedBid.freelancerId,
      'bid_accepted',
      'Bid Accepted!',
      `Your bid for "${job?.title}" has been accepted! You can now start working on this project.`,
      `/jobs/${job?.id}`
    );

    const allNotifications = StorageService.getNotifications();
    allNotifications.push(freelancerNotification);
    StorageService.saveNotifications(allNotifications);

    // Reject other freelancers
    updatedBids.filter(b => b.status === 'rejected' && b.freelancerId !== selectedBid.freelancerId).forEach(rejectedBid => {
      const rejectionNotification = createNotification(
        rejectedBid.freelancerId,
        'bid_rejected',
        'Bid Not Selected',
        `Your bid for "${job?.title}" was not selected. The client has chosen another freelancer.`,
        `/jobs`
      );
      allNotifications.push(rejectionNotification);
    });
    StorageService.saveNotifications(allNotifications);

    setJob(updatedJob);
    setBids(updatedBids);
    setShowPaymentModal(false);
    alert(`Congratulations! You've accepted ${getBidderName(selectedBid.freelancerId)}'s bid and assigned them to this project.`);
  };

  const handleDeleteBid = (bidToDelete: Bid) => {
    if (!window.confirm('Are you sure you want to delete your bid? This action cannot be undone.')) {
      return;
    }

    if (!job) return; // Add null check

    // Remove the bid from storage
    const allBids = StorageService.getBids();
    const filteredBids = allBids.filter(b => b.id !== bidToDelete.id);
    StorageService.saveBids(filteredBids);

    // Update the job's bids
    const updatedJob: Job = {
      ...job,
      bids: job.bids.filter(b => b.id !== bidToDelete.id),
    };

    const allJobs = StorageService.getJobs();
    const jobIndex = allJobs.findIndex(j => j.id === job.id);
    if (jobIndex !== -1) {
      allJobs[jobIndex] = updatedJob;
      StorageService.saveJobs(allJobs);
    }

    // Update local state
    setJob(updatedJob);
    setBids(prev => prev.filter(b => b.id !== bidToDelete.id));

    alert('Your bid has been successfully deleted.');
  };

  const getBidderName = (freelancerId: string) => {
    const allUsers = StorageService.getUsers();
    const freelancer = allUsers.find(u => u.id === freelancerId);
    return freelancer ? `${freelancer.firstName} ${freelancer.lastName}` : 'Unknown Freelancer';
  };

  const handleAcceptInvitation = () => {
    if (!job || !user || user.userType !== 'freelancer' || !isInvitation) return;

    // Create an automatic bid for the invited freelancer
    const newBid: Bid = {
      id: generateId(),
      jobId: job.id,
      freelancerId: user.id,
      amount: job.budget, // Use the job's budget as the bid amount
      proposal: `I'm accepting this job invitation and I'm ready to start working on this project.`,
      estimatedDuration: job.duration,
      status: 'accepted', // Auto-accept the bid
      createdAt: new Date().toISOString(),
    };

    const allBids = StorageService.getBids();
    allBids.push(newBid);
    StorageService.saveBids(allBids);

    // Update job status and assign freelancer
    const updatedJob = {
      ...job,
      status: 'in_progress' as const,
      selectedFreelancerId: user.id,
      bids: [...job.bids, newBid],
    };

    const allJobs = StorageService.getJobs();
    const jobIndex = allJobs.findIndex(j => j.id === job.id);
    if (jobIndex !== -1) {
      allJobs[jobIndex] = updatedJob;
      StorageService.saveJobs(allJobs);
    }

    // Create notification for client
    const notification = createNotification(
      job.clientId,
      'bid_accepted',
      'Invitation Accepted!',
      `${user.firstName} ${user.lastName} has accepted your job invitation and is now working on "${job.title}"`,
      `/jobs/${job.id}`
    );

    const allNotifications = StorageService.getNotifications();
    allNotifications.push(notification);
    StorageService.saveNotifications(allNotifications);

    // Create notification for freelancer
    const freelancerNotification = createNotification(
      user.id,
      'job_completed',
      'Job Started!',
      `You have been assigned to work on "${job.title}". Good luck!`,
      `/jobs/${job.id}`
    );

    allNotifications.push(freelancerNotification);
    StorageService.saveNotifications(allNotifications);

    setJob(updatedJob);
    setBids([...bids, newBid]);
    setIsInvitation(false);
    setInvitedBy(null);

    alert(`Congratulations! You've been assigned to work on "${job.title}". The client has been notified.`);
  };

  if (!job || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin -ml-1 mr-3 h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === job.clientId;
  const canBid = user?.userType === 'freelancer' && job.status === 'pending';
  const hasBid = bids.some(bid => bid.freelancerId === user?.id);
  const userBid = bids.find(bid => bid.freelancerId === user?.id);
  const isRejected = userBid?.status === 'rejected';
  const isAccepted = userBid?.status === 'accepted' || job.selectedFreelancerId === user?.id;

  // Hide project details from rejected freelancers
  if (isRejected && user?.userType === 'freelancer') {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-900 mb-2">Access Restricted</h2>
            <p className="text-red-700 mb-4">
              Your bid for this project was not selected. You no longer have access to view the project details.
            </p>
            <Link
              to="/jobs"
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Browse Other Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                <div className="flex items-center space-x-4 text-gray-600">
                  <span>Posted by {client.firstName} {client.lastName}</span>
                  <span>•</span>
                  <span>{formatDate(job.createdAt)}</span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                job.status === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {job.status.replace('_', ' ')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {getBudgetDisplay(job.budget, job.budgetType)}
                </div>
                <p className="text-gray-600 text-sm">Budget</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600 mb-1">{job.duration}</div>
                <p className="text-gray-600 text-sm">Duration</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600 mb-1">{bids.length}</div>
                <p className="text-gray-600 text-sm">Bids</p>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Job Description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Skills Required</h2>
              <div className="flex flex-wrap gap-2">
                {job.skillsRequired.map(skill => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {job.deadline && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Deadline</h2>
                <p className="text-gray-700">{formatDate(job.deadline)}</p>
              </div>
            )}
          </div>

          {job.status === 'pending' && bids.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Bids ({bids.length})</h2>
              <div className="space-y-4">
                {bids.map(bid => (
                  <div key={bid.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{getBidderName(bid.freelancerId)}</h3>
                        <p className="text-gray-600 text-sm">{formatDate(bid.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-green-600">${bid.amount.toLocaleString()}</div>
                        <p className="text-gray-600 text-sm">{bid.estimatedDuration}</p>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-3">{bid.proposal}</p>
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bid.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        bid.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {bid.status}
                      </span>
                      <div className="flex space-x-2">
                        {isOwner && bid.status === 'pending' && (
                          <button
                            onClick={() => handleAcceptBid(bid)}
                            className="btn-primary text-sm"
                          >
                            Accept Bid
                          </button>
                        )}
                        {user?.id === bid.freelancerId && bid.status === 'pending' && (
                          <button
                            onClick={() => handleDeleteBid(bid)}
                            className="btn-danger text-sm"
                          >
                            Delete Bid
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Details</h2>
            
            <div className="space-y-3 mb-6">
              <div>
                <span className="text-gray-600 text-sm">Category</span>
                <p className="font-medium text-gray-900">{job.category}</p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Budget Type</span>
                <p className="font-medium text-gray-900 capitalize">{job.budgetType}</p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Status</span>
                <p className="font-medium text-gray-900 capitalize">{job.status.replace('_', ' ')}</p>
              </div>
            </div>

            {/* Invitation Acceptance UI */}
            {isInvitation && user?.userType === 'freelancer' && job.status === 'pending' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-3">
                  <svg className="h-6 w-6 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-blue-900">Job Invitation</h3>
                </div>
                <p className="text-blue-800 mb-4">
                  You've been invited to work on this job by {invitedBy ? getBidderName(invitedBy) : 'the client'}. 
                  Accept this invitation to automatically get assigned to this project.
                </p>
                <div className="bg-white rounded-lg p-3 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Budget:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {getBudgetDisplay(job.budget, job.budgetType)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <span className="ml-2 font-medium">{job.duration}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleAcceptInvitation}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Accept Invitation
                  </button>
                  <button
                    onClick={() => {
                      setIsInvitation(false);
                      setInvitedBy(null);
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}

            {canBid && !hasBid && !isInvitation && (
              <div>
                {!isPlacingBid ? (
                  <button
                    onClick={() => setIsPlacingBid(true)}
                    className="w-full btn-primary"
                  >
                    Place a Bid
                  </button>
                ) : (
                  <form onSubmit={handleBidSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Bid Amount ($)
                      </label>
                      <input
                        type="number"
                        required
                        value={bidForm.amount}
                        onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })}
                        className="input-field"
                        placeholder="Enter your bid"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estimated Duration
                      </label>
                      <input
                        type="text"
                        required
                        value={bidForm.estimatedDuration}
                        onChange={(e) => setBidForm({ ...bidForm, estimatedDuration: e.target.value })}
                        className="input-field"
                        placeholder="e.g., 2 weeks"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Proposal
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={bidForm.proposal}
                        onChange={(e) => setBidForm({ ...bidForm, proposal: e.target.value })}
                        className="input-field"
                        placeholder="Explain why you're the perfect fit for this job..."
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="flex-1 btn-primary"
                      >
                        Submit Bid
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsPlacingBid(false)}
                        className="flex-1 btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {hasBid && !isAccepted && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm font-medium">You have already placed a bid on this job</p>
              </div>
            )}

            {isOwner && job.status === 'pending' && bids.length === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">No bids yet. Share this job to get more visibility!</p>
              </div>
            )}

            {job.status === 'in_progress' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm font-medium">This project is currently in progress</p>
              </div>
            )}

            {job.status === 'completed' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm font-medium">This project has been completed</p>
              </div>
            )}

            {/* Message Button for Active Projects */}
            {(job.status === 'in_progress' || job.status === 'completed') && job.selectedFreelancerId && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <Link
                  to={`/messages`}
                  state={{ 
                    otherUserId: user?.id === job.clientId ? job.selectedFreelancerId : job.clientId,
                    jobId: job.id 
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {user?.id === job.clientId ? 'Message Freelancer' : 'Message Client'}
                </Link>
              </div>
            )}

            {/* Project Submission for Freelancers */}
            <ProjectSubmission 
              job={job} 
              onSubmissionComplete={() => {
                // Reload job data to show updated submission
                const allJobs = StorageService.getJobs();
                const updatedJob = allJobs.find(j => j.id === job.id);
                if (updatedJob) setJob(updatedJob);
              }}
            />

            {/* Project Review for Clients */}
            <ProjectReview 
              job={job} 
              onReviewComplete={() => {
                // Reload job data to show updated status
                const allJobs = StorageService.getJobs();
                const updatedJob = allJobs.find(j => j.id === job.id);
                if (updatedJob) setJob(updatedJob);
              }}
            />
          </div>
        </div>
      </div>

      {showPaymentModal && selectedBid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 animate-slide-up">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Confirm Payment</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Bid Amount:</span>
                <span className="font-semibold">${selectedBid.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Service Fee:</span>
                <span className="font-semibold">${(selectedBid.amount * 0.1).toFixed(2)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Total:</span>
                  <span className="font-bold text-lg">${(selectedBid.amount * 1.1).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm mb-6">
              This amount will be held in escrow until the project is completed. You can release the funds once you're satisfied with the work.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handlePaymentConfirm}
                className="flex-1 btn-primary"
              >
                Confirm & Fund Escrow
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetailPage;
