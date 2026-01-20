import { User, Job, Bid, Review, Badge, Notification } from '../types';

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatMessageTime = (dateString: string): string => {
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

export const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
  return formatDate(dateString);
};

export const calculateAverageRating = (reviews: Review[]): number => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
};

export const getUserReviews = (userId: string, allReviews: Review[]): Review[] => {
  return allReviews.filter(review => review.revieweeId === userId);
};

export const getUserJobs = (userId: string, allJobs: Job[], userType: 'freelancer' | 'client'): Job[] => {
  if (userType === 'client') {
    return allJobs.filter(job => job.clientId === userId);
  }
  return allJobs.filter(job => job.selectedFreelancerId === userId);
};

export const getUserBids = (userId: string, allBids: Bid[]): Bid[] => {
  const userBids = allBids.filter(bid => bid.freelancerId === userId);
  console.log('getUserBids called:', {
    userId,
    allBidsCount: allBids.length,
    filteredBidsCount: userBids.length,
    allBids: allBids.map(b => ({ id: b.id, freelancerId: b.freelancerId })),
    userBids: userBids.map(b => ({ id: b.id, freelancerId: b.freelancerId }))
  });
  return userBids;
};

export const checkBadgeEligibility = (user: User, allBadges: Badge[], allJobs: Job[], allBids: Bid[], allReviews: Review[]): Badge[] => {
  const earnedBadges: Badge[] = [];
  const defaultBadges = allBadges.filter(badge => !badge.earnedAt);

  defaultBadges.forEach(badge => {
    let earned = false;

    switch (badge.id) {
      case 'profile_complete':
        earned = !!(
          user.profile?.bio &&
          user.profile?.title &&
          user.profile?.skills.length > 0 &&
          user.profile?.location &&
          user.profile?.education &&
          user.profile?.experience
        );
        break;

      case 'first_bid':
        earned = allBids.some(bid => bid.freelancerId === user.id);
        break;

      case 'first_job_posted':
        earned = allJobs.some(job => job.clientId === user.id);
        break;

      case 'first_review':
        earned = allReviews.some(review => 
          review.reviewerId === user.id || review.revieweeId === user.id
        );
        break;

      case 'rising_star':
        const completedJobs = allJobs.filter(job => 
          job.selectedFreelancerId === user.id && job.status === 'completed'
        );
        earned = completedJobs.length >= 5;
        break;
    }

    if (earned) {
      earnedBadges.push({
        ...badge,
        earnedAt: new Date().toISOString()
      });
    }
  });

  return earnedBadges;
};

export const createNotification = (
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  actionUrl?: string
): Notification => {
  return {
    id: generateId(),
    userId,
    type,
    title,
    message,
    read: false,
    createdAt: new Date().toISOString(),
    actionUrl
  };
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'in_progress':
      return 'text-blue-600 bg-blue-100';
    case 'completed':
      return 'text-green-600 bg-green-100';
    case 'cancelled':
    case 'rejected':
      return 'text-red-600 bg-red-100';
    case 'accepted':
      return 'text-green-600 bg-green-100';
    case 'escrow':
      return 'text-purple-600 bg-purple-100';
    case 'released':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const getBudgetDisplay = (budget: number, budgetType: 'fixed' | 'hourly'): string => {
  if (budgetType === 'fixed') {
    return `$${budget.toLocaleString()} (fixed)`;
  }
  return `$${budget.toLocaleString()}/hr`;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};
