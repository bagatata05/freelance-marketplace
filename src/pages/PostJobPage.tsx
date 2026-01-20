import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../utils/storage';
import { Job } from '../types';
import { generateId, createNotification } from '../utils/helpers';

const PostJobPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Web Development',
    budget: 0,
    budgetType: 'fixed' as 'fixed' | 'hourly',
    duration: '',
    deadline: '',
    skillsRequired: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Job description is required';
    }

    if (formData.budget <= 0) {
      newErrors.budget = 'Budget must be greater than 0';
    }

    if (!formData.duration.trim()) {
      newErrors.duration = 'Duration is required';
    }

    if (!formData.skillsRequired.trim()) {
      newErrors.skillsRequired = 'At least one skill is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (!user || user.userType !== 'client') {
      navigate('/login');
      return;
    }

    setIsSubmitting(true);

    try {
      const newJob: Job = {
        id: generateId(),
        clientId: user.id,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budget: formData.budget,
        budgetType: formData.budgetType,
        duration: formData.duration,
        skillsRequired: formData.skillsRequired.split(',').map(s => s.trim()).filter(s => s),
        status: 'pending',
        createdAt: new Date().toISOString(),
        deadline: formData.deadline || undefined,
        bids: [],
        invitedFreelancers: [],
        submission: undefined,
      };

      const allJobs = StorageService.getJobs();
      allJobs.push(newJob);
      StorageService.saveJobs(allJobs);

      const notification = createNotification(
        user.id,
        'first_job_posted',
        'Job Posted Successfully!',
        `Your job "${formData.title}" has been posted and is now visible to freelancers.`,
        `/jobs/${newJob.id}`
      );
      const allNotifications = StorageService.getNotifications();
      allNotifications.push(notification);
      StorageService.saveNotifications(allNotifications);

      navigate(`/jobs/${newJob.id}`);
    } catch (error) {
      console.error('Error posting job:', error);
      setErrors({ general: 'Failed to post job. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.userType !== 'client') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Only clients can post jobs.</p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary"
          >
            Sign In as Client
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Post a New Job</h1>
        <p className="text-gray-600">Find the perfect freelancer for your project</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Job Details</h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Job Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className={`input-field ${errors.title ? 'border-red-500' : ''}`}
                placeholder="e.g., Build a React Dashboard"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input-field"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Job Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={6}
                value={formData.description}
                onChange={handleChange}
                className={`input-field ${errors.description ? 'border-red-500' : ''}`}
                placeholder="Provide a detailed description of what you need done..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            <div>
              <label htmlFor="skillsRequired" className="block text-sm font-medium text-gray-700 mb-2">
                Skills Required *
              </label>
              <input
                type="text"
                id="skillsRequired"
                name="skillsRequired"
                required
                value={formData.skillsRequired}
                onChange={handleChange}
                className={`input-field ${errors.skillsRequired ? 'border-red-500' : ''}`}
                placeholder="e.g., React, TypeScript, Node.js (comma separated)"
              />
              {errors.skillsRequired && (
                <p className="mt-1 text-sm text-red-600">{errors.skillsRequired}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">Separate multiple skills with commas</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Budget & Timeline</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="budgetType" className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Type *
                </label>
                <select
                  id="budgetType"
                  name="budgetType"
                  value={formData.budgetType}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="hourly">Hourly Rate</option>
                </select>
              </div>

              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.budgetType === 'fixed' ? 'Budget ($)' : 'Hourly Rate ($)'} *
                </label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  required
                  min="1"
                  value={formData.budget || ''}
                  onChange={handleChange}
                  className={`input-field ${errors.budget ? 'border-red-500' : ''}`}
                  placeholder={formData.budgetType === 'fixed' ? '1000' : '50'}
                />
                {errors.budget && (
                  <p className="mt-1 text-sm text-red-600">{errors.budget}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Duration *
                </label>
                <input
                  type="text"
                  id="duration"
                  name="duration"
                  required
                  value={formData.duration}
                  onChange={handleChange}
                  className={`input-field ${errors.duration ? 'border-red-500' : ''}`}
                  placeholder="e.g., 2 weeks, 1 month"
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
                )}
              </div>

              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>
        </div>

        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{errors.general}</p>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/client/dashboard')}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Posting Job...
              </span>
            ) : (
              'Post Job'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostJobPage;
