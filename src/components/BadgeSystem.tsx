import React, { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../utils/storage';
import { Badge } from '../types';
import { checkBadgeEligibility } from '../utils/helpers';

interface BadgeSystemProps {
  onBadgeEarned?: (badge: Badge) => void;
}

const BadgeSystem: React.FC<BadgeSystemProps> = ({ onBadgeEarned }) => {
  const { user, updateUser } = useAuth();
  const processedBadgesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    const checkAndAwardBadges = () => {
      const allBadges = StorageService.getBadges();
      const allJobs = StorageService.getJobs();
      const allBids = StorageService.getBids();
      const allReviews = StorageService.getReviews();

      const eligibleBadges = checkBadgeEligibility(user, allBadges, allJobs, allBids, allReviews);
      
      // Filter out badges that have already been processed or already earned
      const newBadges = eligibleBadges.filter(badge => 
        !processedBadgesRef.current.has(badge.id) && 
        !user.badges.some(userBadge => userBadge.id === badge.id)
      );
      
      if (newBadges.length > 0) {
        // Mark badges as processed
        newBadges.forEach(badge => processedBadgesRef.current.add(badge.id));
        
        // Deduplicate existing badges and add new ones
        const existingBadgeIds = new Set(user.badges.map(b => b.id));
        const uniqueNewBadges = newBadges.filter(badge => !existingBadgeIds.has(badge.id));
        
        const updatedUserBadges = [...user.badges, ...uniqueNewBadges];
        const updatedUser = { ...user, badges: updatedUserBadges };
        
        updateUser(updatedUser);
        
        const allUsers = StorageService.getUsers();
        const userIndex = allUsers.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
          allUsers[userIndex] = updatedUser;
          StorageService.saveUsers(allUsers);
        }

        // Trigger notifications for new badges
        uniqueNewBadges.forEach(badge => {
          onBadgeEarned?.(badge);
        });
      }
    };

    checkAndAwardBadges();
  }, [user, updateUser, onBadgeEarned]);

  return null;
};

export const BadgeDisplay: React.FC<{ badges: Badge[]; compact?: boolean }> = ({ badges, compact = false }) => {
  if (badges.length === 0) return null;

  return (
    <div className={`${compact ? 'flex flex-wrap gap-1' : 'space-y-2'}`}>
      {badges.map(badge => (
        <div
          key={badge.id}
          className={`inline-flex items-center space-x-2 ${
            compact 
              ? 'px-2 py-1 bg-gray-100 rounded-full text-xs' 
              : 'px-3 py-2 bg-gray-50 rounded-lg text-sm'
          }`}
          title={badge.description}
        >
          <span className={`${compact ? 'text-sm' : 'text-lg'}`}>{badge.icon}</span>
          {!compact && (
            <div>
              <p className="font-medium text-gray-900">{badge.name}</p>
              <p className="text-xs text-gray-600">{badge.description}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export const BadgeNotification: React.FC<{ badge: Badge; onClose: () => void }> = ({ badge, onClose }) => {
  return (
    <div className="fixed top-20 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm animate-slide-up z-50">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <div className="text-3xl">{badge.icon}</div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Badge Earned!</h3>
          <p className="text-gray-700 text-sm mt-1">{badge.name}</p>
          <p className="text-gray-500 text-xs mt-1">{badge.description}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          aria-label="Dismiss notification"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default BadgeSystem;
