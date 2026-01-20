import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../utils/storage';
import { Job, Review, User } from '../types';
import { formatDate, generateId, calculateAverageRating } from '../utils/helpers';
import '../styles/review.css';

const ReviewPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [job, setJob] = useState<Job | null>(null);
  const [client, setClient] = useState<User | null>(null);
  const [freelancer, setFreelancer] = useState<User | null>(null);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
  });

  useEffect(() => {
    const loadData = () => {
      if (!jobId || !user) return;

      const allJobs = StorageService.getJobs();
      const foundJob = allJobs.find(j => j.id === jobId);
      
      if (!foundJob) {
        navigate('/jobs');
        return;
      }

      if (foundJob.status !== 'completed') {
        navigate(`/jobs/${jobId}`);
        return;
      }

      setJob(foundJob);

      const allUsers = StorageService.getUsers();
      const foundClient = allUsers.find(u => u.id === foundJob.clientId);
      const foundFreelancer = allUsers.find(u => u.id === foundJob.selectedFreelancerId);
      
      setClient(foundClient || null);
      setFreelancer(foundFreelancer || null);

      const allReviews = StorageService.getReviews();
      const jobReviews = allReviews.filter(r => r.jobId === jobId);
      setReviews(jobReviews);

      const userReview = jobReviews.find(r => r.reviewerId === user.id);
      setExistingReview(userReview || null);
    };

    loadData();
  }, [jobId, user, navigate]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!job || !user || !freelancer || !client) return;

    const isClientReviewing = user.id === job.clientId;
    const revieweeId = isClientReviewing ? freelancer.id : client.id;

    if (!isClientReviewing && user.id !== freelancer.id) {
      return;
    }

    setIsSubmitting(true);

    try {
      const newReview: Review = {
        id: generateId(),
        reviewerId: user.id,
        revieweeId,
        jobId: job.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        createdAt: new Date().toISOString(),
      };

      const allReviews = StorageService.getReviews();
      
      if (existingReview) {
        const reviewIndex = allReviews.findIndex(r => r.id === existingReview.id);
        if (reviewIndex !== -1) {
          allReviews[reviewIndex] = newReview;
        }
      } else {
        allReviews.push(newReview);
      }
      
      StorageService.saveReviews(allReviews);

      const updatedReviews = existingReview 
        ? reviews.map(r => r.id === existingReview.id ? newReview : r)
        : [...reviews, newReview];
      
      setReviews(updatedReviews);
      setExistingReview(newReview);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error submitting review:', error);
      setIsSubmitting(false);
    }
  };

  const getAverageRating = () => {
    return calculateAverageRating(reviews);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const canReview = () => {
    if (!job || !user) return false;
    
    const isClient = user.id === job.clientId;
    const isFreelancer = user.id === job.selectedFreelancerId;
    
    return job.status === 'completed' && (isClient || isFreelancer) && !existingReview;
  };

  const getRatingWidthClass = (percentage: number) => {
    const roundedPercentage = Math.round(percentage / 10) * 10;
    return `review-width-${roundedPercentage}`;
  };

  const distribution = getRatingDistribution();

  if (!job || !client || !freelancer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin -ml-1 mr-3 h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading review page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reviews</h1>
        <p className="text-gray-600">Reviews for "{job.title}"</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Rating Overview</h2>
            
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-gray-900 mb-2">
                {getAverageRating()}
              </div>
              <div className="flex justify-center mb-2">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-8 w-8 ${i < Math.floor(getAverageRating()) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600">{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</p>
            </div>

            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map(rating => {
                const percentage = reviews.length > 0 ? (distribution[rating as keyof typeof distribution] / reviews.length) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600 w-3">{rating}</span>
                    <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className={`bg-yellow-400 h-2 rounded-full review-progress-bar ${getRatingWidthClass(percentage)}`}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">
                      {distribution[rating as keyof typeof distribution]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {canReview() && (
            <div className="card mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {user?.id === job.clientId ? 'Review Freelancer' : 'Review Client'}
              </h2>
              
              <form onSubmit={handleSubmitReview} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Rating *
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setReviewForm({ ...reviewForm, rating })}
                        className="focus:outline-none transition-colors"
                        aria-label={`Rate ${rating} stars`}
                      >
                        <svg
                          className={`h-8 w-8 ${
                            rating <= reviewForm.rating ? 'text-yellow-400' : 'text-gray-300'
                          } hover:text-yellow-400 transition-colors`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                    Review *
                  </label>
                  <textarea
                    id="comment"
                    rows={4}
                    required
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    className="input-field"
                    placeholder="Share your experience working on this project..."
                  />
                </div>

                <div className="flex space-x-4">
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
                        Submitting...
                      </span>
                    ) : (
                      'Submit Review'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/jobs/${jobId}`)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              All Reviews ({reviews.length})
            </h2>
            
            <div className="space-y-6">
              {reviews.length > 0 ? (
                reviews.map(review => {
                  const reviewer = review.reviewerId === client.id ? client : freelancer;
                  const reviewee = review.revieweeId === client.id ? client : freelancer;
                  
                  return (
                    <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                            {reviewer?.firstName[0]}{reviewer?.lastName[0]}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {reviewer?.firstName} {reviewer?.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {review.reviewerId === client.id ? 'Client' : 'Freelancer'} • 
                              reviewing {reviewee?.firstName} {reviewee?.lastName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex mb-1">
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
                          <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                        </div>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">⭐</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No reviews yet</h3>
                  <p className="text-gray-600">Be the first to review this project!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
