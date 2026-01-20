import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../utils/storage';
import { Job, User } from '../types';
import { formatDate, getBudgetDisplay, getStatusColor, truncateText } from '../utils/helpers';

const JobListPage: React.FC = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBudgetType, setSelectedBudgetType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const categories = [
    'all',
    'Web Development',
    'Mobile Development',
    'Design',
    'Writing',
    'Marketing',
    'Data Science',
    'DevOps',
    'Customer Support',
    'Other'
  ];

  useEffect(() => {
    const loadData = () => {
      const allJobs = StorageService.getJobs();
      const allUsers = StorageService.getUsers();
      setJobs(allJobs);
      setUsers(allUsers);
      setFilteredJobs(allJobs);
    };

    loadData();
  }, []);

  useEffect(() => {
    let filtered = jobs.filter(job => job.status === 'pending');

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.skillsRequired.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(job => job.category === selectedCategory);
    }

    if (selectedBudgetType !== 'all') {
      filtered = filtered.filter(job => job.budgetType === selectedBudgetType);
    }

    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'budget_high') {
      filtered.sort((a, b) => b.budget - a.budget);
    } else if (sortBy === 'budget_low') {
      filtered.sort((a, b) => a.budget - b.budget);
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, selectedCategory, selectedBudgetType, sortBy]);

  const getClientName = (clientId: string) => {
    const client = users.find(u => u.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : 'Unknown Client';
  };

  const getJobStats = () => {
    const totalJobs = jobs.length;
    const pendingJobs = jobs.filter(job => job.status === 'pending').length;
    const inProgressJobs = jobs.filter(job => job.status === 'in_progress').length;
    const completedJobs = jobs.filter(job => job.status === 'completed').length;

    return { totalJobs, pendingJobs, inProgressJobs, completedJobs };
  };

  const stats = getJobStats();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Jobs</h1>
        <p className="text-gray-600">Find the perfect opportunity for your skills</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="text-2xl font-bold text-gray-900">{stats.totalJobs}</div>
          <p className="text-gray-600 text-sm">Total Jobs</p>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-yellow-600">{stats.pendingJobs}</div>
          <p className="text-gray-600 text-sm">Open Jobs</p>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-blue-600">{stats.inProgressJobs}</div>
          <p className="text-gray-600 text-sm">In Progress</p>
        </div>
        <div className="card">
          <div className="text-2xl font-bold text-green-600">{stats.completedJobs}</div>
          <p className="text-gray-600 text-sm">Completed</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              aria-label="Search jobs by title, description, or skills"
            />
          </div>
          
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
              aria-label="Filter by category"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedBudgetType}
              onChange={(e) => setSelectedBudgetType(e.target.value)}
              className="input-field"
              aria-label="Filter by budget type"
            >
              <option value="all">All Budget Types</option>
              <option value="fixed">Fixed Price</option>
              <option value="hourly">Hourly Rate</option>
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field"
              aria-label="Sort jobs"
            >
              <option value="newest">Newest First</option>
              <option value="budget_high">Budget: High to Low</option>
              <option value="budget_low">Budget: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredJobs.map(job => (
            <div key={job.id} className="card hover:shadow-lg transition-shadow duration-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    <Link
                      to={`/jobs/${job.id}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {job.title}
                    </Link>
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    Posted by {getClientName(job.clientId)} • {formatDate(job.createdAt)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                  {job.status.replace('_', ' ')}
                </span>
              </div>

              <p className="text-gray-700 mb-4">
                {truncateText(job.description, 150)}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {job.skillsRequired.slice(0, 4).map(skill => (
                  <span
                    key={skill}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {skill}
                  </span>
                ))}
                {job.skillsRequired.length > 4 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    +{job.skillsRequired.length - 4} more
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <div>
                    <span className="text-2xl font-bold text-green-600">
                      {getBudgetDisplay(job.budget, job.budgetType)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {job.duration}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {job.bids.length} {job.bids.length === 1 ? 'bid' : 'bids'}
                  </span>
                  <Link
                    to={`/jobs/${job.id}`}
                    className="btn-primary text-sm"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {user && user.userType === 'client' && (
        <div className="mt-8 text-center">
          <Link
            to="/client/post-job"
            className="btn-primary"
          >
            Post a New Job
          </Link>
        </div>
      )}
    </div>
  );
};

export default JobListPage;
