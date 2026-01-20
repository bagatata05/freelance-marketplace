import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../utils/storage';
import { User } from '../types';
import { calculateAverageRating } from '../utils/helpers';
import InviteFreelancerModal from '../components/InviteFreelancerModal';

interface FreelancerWithStats extends User {
  stats: {
    jobsCompleted: number;
    totalBids: number;
    averageRating: number;
    totalReviews: number;
    earnings: number;
  };
}

const FreelancersPage: React.FC = () => {
  const { user } = useAuth();
  const [freelancers, setFreelancers] = useState<FreelancerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'bids' | 'recent'>('rating');
  const [selectedFreelancer, setSelectedFreelancer] = useState<User | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    const loadFreelancers = () => {
      const allUsers = StorageService.getUsers();
      const allJobs = StorageService.getJobs();
      const allBids = StorageService.getBids();

      // Get all freelancer users
      const freelancerUsers = allUsers.filter(u => u.userType === 'freelancer');

      // Add additional data to each freelancer
      const freelancersWithData = freelancerUsers.map(freelancer => {
        const freelancerJobs = allJobs.filter(job => job.selectedFreelancerId === freelancer.id);
        const freelancerBids = allBids.filter(bid => bid.freelancerId === freelancer.id);
        
        // Calculate average rating from reviews (mock data for now)
        const averageRating = calculateAverageRating([]); // Would calculate from actual reviews
        
        return {
          ...freelancer,
          stats: {
            jobsCompleted: freelancerJobs.length,
            totalBids: freelancerBids.length,
            averageRating: averageRating || 0,
            totalReviews: 0, // Would calculate from actual reviews
            earnings: freelancerJobs
              .filter(job => job.status === 'completed')
              .reduce((sum, job) => sum + job.budget, 0)
          }
        };
      });

      setFreelancers(freelancersWithData);
      setLoading(false);
    };

    loadFreelancers();
  }, []);

  // Get all unique skills from all freelancers
  const allSkills = Array.from(new Set(
    freelancers.flatMap(f => f.profile?.skills || [])
  )).sort();

  // Filter and sort freelancers
  const filteredFreelancers = freelancers
    .filter(freelancer => {
      const matchesSearch = !searchTerm || 
        freelancer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        freelancer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (freelancer.profile?.title && freelancer.profile.title.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSkill = !skillFilter || 
        freelancer.profile?.skills?.includes(skillFilter);

      return matchesSearch && matchesSkill;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.stats?.averageRating || 0) - (a.stats?.averageRating || 0);
        case 'bids':
          return (b.stats?.totalBids || 0) - (a.stats?.totalBids || 0);
        case 'recent':
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        default:
          return 0;
      }
    });

  const getRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars.push(<span key={i} className="text-yellow-400">★</span>);
      } else {
        stars.push(<span key={i} className="text-gray-300">★</span>);
      }
    }
    return stars;
  };

  const handleInviteFreelancer = (freelancer: User) => {
    setSelectedFreelancer(freelancer);
    setShowInviteModal(true);
  };

  const handleCloseInviteModal = () => {
    setShowInviteModal(false);
    setSelectedFreelancer(null);
  };

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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Freelancers</h1>
        <p className="text-gray-600">Discover talented freelancers for your projects</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="search-freelancers" className="block text-sm font-medium text-gray-700 mb-2">
              Search Freelancers
            </label>
            <input
              id="search-freelancers"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or expertise..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="skills-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Skills
            </label>
            <select
              id="skills-filter"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Skills</option>
              {allSkills.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rating' | 'bids' | 'recent')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="rating">Highest Rated</option>
              <option value="bids">Most Active</option>
              <option value="recent">Recently Joined</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          Found {filteredFreelancers.length} freelancer{filteredFreelancers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Freelancers List */}
      {filteredFreelancers.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No freelancers found</h3>
          <p className="text-gray-500">Try adjusting your search criteria or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFreelancers.map((freelancer) => (
            <div key={freelancer.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium mr-3">
                  {freelancer.firstName[0]}{freelancer.lastName[0]}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {freelancer.firstName} {freelancer.lastName}
                  </h3>
                  {freelancer.profile?.title && (
                    <p className="text-sm text-gray-600">{freelancer.profile.title}</p>
                  )}
                </div>
              </div>

              {freelancer.profile?.bio && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {freelancer.profile.bio}
                </p>
              )}

              {/* Rating and Stats */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="flex mr-1">
                    {getRatingStars(freelancer.stats?.averageRating || 0)}
                  </div>
                  <span className="text-sm text-gray-600">
                    ({freelancer.stats?.totalReviews || 0} reviews)
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    ${(freelancer.stats?.earnings || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">earned</div>
                </div>
              </div>

              {/* Skills */}
              {freelancer.profile?.skills && freelancer.profile.skills.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {freelancer.profile.skills.slice(0, 3).map((skill: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {skill}
                      </span>
                    ))}
                    {freelancer.profile.skills.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        +{freelancer.profile.skills.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 text-center text-sm mb-4">
                <div className="bg-gray-50 rounded p-2">
                  <div className="font-medium text-gray-900">{freelancer.stats?.jobsCompleted || 0}</div>
                  <div className="text-gray-500 text-xs">Jobs</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="font-medium text-gray-900">{freelancer.stats?.totalBids || 0}</div>
                  <div className="text-gray-500 text-xs">Bids</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="font-medium text-gray-900">{freelancer.stats?.averageRating || 0}</div>
                  <div className="text-gray-500 text-xs">Rating</div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Link
                  to={`/profile/${freelancer.id}`}
                  className="block w-full text-center btn-primary text-sm"
                >
                  View Profile
                </Link>
                {user?.userType === 'client' && (
                  <button
                    onClick={() => handleInviteFreelancer(freelancer)}
                    className="block w-full text-center btn-secondary text-sm"
                  >
                    Invite to Job
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Freelancer Modal */}
      {selectedFreelancer && (
        <InviteFreelancerModal
          freelancer={selectedFreelancer}
          isOpen={showInviteModal}
          onClose={handleCloseInviteModal}
        />
      )}
    </div>
  );
};

export default FreelancersPage;
