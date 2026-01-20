import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../utils/storage';
import { User, Review, UserProfile } from '../types';
import { calculateAverageRating, getUserReviews, formatDate } from '../utils/helpers';

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId?: string }>();
  const { user: currentUser, updateUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '',
    title: '',
    hourlyRate: 0,
    skills: '',
    location: '',
    languages: '',
    education: '',
    experience: '',
  });
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(true);

  const isOwnProfile = !userId || userId === currentUser?.id;
  const displayUser = isOwnProfile ? currentUser : profileUser;

  useEffect(() => {
    const loadProfile = async () => {
      if (!isOwnProfile && userId) {
        const users = StorageService.getUsers();
        const user = users.find(u => u.id === userId);
        setProfileUser(user || null);
      }
      
      if (displayUser) {
        const allReviews = StorageService.getReviews();
        const userReviews = getUserReviews(displayUser.id, allReviews);
        setReviews(userReviews);
        
        setEditForm({
          bio: displayUser.profile?.bio || '',
          title: displayUser.profile?.title || '',
          hourlyRate: displayUser.profile?.hourlyRate || 0,
          skills: displayUser.profile?.skills.join(', ') || '',
          location: displayUser.profile?.location || '',
          languages: displayUser.profile?.languages.join(', ') || '',
          education: displayUser.profile?.education || '',
          experience: displayUser.profile?.experience || '',
        });
      }
      
      setLoading(false);
    };

    loadProfile();
  }, [userId, isOwnProfile, currentUser, displayUser]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && displayUser && displayUser.profile) {
      const updatedSkills = [...displayUser.profile.skills, newSkill.trim()];
      updateUser({
        profile: {
          ...displayUser.profile,
          skills: updatedSkills,
        },
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (displayUser && displayUser.profile) {
      const updatedSkills = displayUser.profile.skills.filter(skill => skill !== skillToRemove);
      updateUser({
        profile: {
          ...displayUser.profile,
          skills: updatedSkills,
        },
      });
    }
  };

  const handleSaveProfile = () => {
    if (!displayUser) return;

    const updatedProfile: UserProfile = {
      bio: editForm.bio,
      title: editForm.title,
      hourlyRate: editForm.hourlyRate,
      skills: editForm.skills.split(',').map(s => s.trim()).filter(s => s),
      location: editForm.location,
      languages: editForm.languages.split(',').map(s => s.trim()).filter(s => s),
      education: editForm.education,
      experience: editForm.experience,
      portfolio: [],
      avatar: displayUser.profile?.avatar || '',
    };

    updateUser({ profile: updatedProfile });
    setIsEditing(false);
  };

  const averageRating = calculateAverageRating(reviews);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin -ml-1 mr-3 h-12 w-12 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!displayUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Profile not found</h2>
          <p className="mt-2 text-gray-600">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="card">
            <div className="text-center">
              <div className="h-24 w-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
                {displayUser.firstName[0]}{displayUser.lastName[0]}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {displayUser.firstName} {displayUser.lastName}
              </h1>
              <p className="text-gray-600 mt-1">{displayUser.userType === 'freelancer' ? 'Freelancer' : 'Client'}</p>
              
              {displayUser.profile?.title && (
                <p className="text-lg font-medium text-gray-800 mt-2">{displayUser.profile.title}</p>
              )}

              {displayUser.userType === 'freelancer' && displayUser.profile && displayUser.profile.hourlyRate > 0 && (
                <p className="text-lg font-semibold text-blue-600 mt-2">
                  ${displayUser.profile.hourlyRate}/hr
                </p>
              )}

              {averageRating > 0 && (
                <div className="flex items-center justify-center mt-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`h-5 w-5 ${i < Math.floor(averageRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="ml-2 text-gray-600">({averageRating})</span>
                </div>
              )}

              {displayUser.profile && displayUser.profile.location && (
                <p className="text-gray-600 mt-3 flex items-center justify-center">
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {displayUser.profile.location}
                </p>
              )}

              {isOwnProfile && (
                <button
                  onClick={handleEditToggle}
                  className="btn-secondary mt-4"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Badges</h3>
              <div className="space-y-2">
                {displayUser.badges.length > 0 ? (
                  Array.from(new Set(displayUser.badges.map(b => b.id)))
                    .map(badgeId => displayUser.badges.find(b => b.id === badgeId)!)
                    .map(badge => (
                    <div key={badge.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                      <span className="text-2xl">{badge.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">{badge.name}</p>
                        <p className="text-xs text-gray-600">{badge.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No badges earned yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
            {isEditing && isOwnProfile ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    name="bio"
                    value={editForm.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="input-field"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Professional Title</label>
                  <input
                    name="title"
                    type="text"
                    value={editForm.title}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g. Full Stack Developer"
                  />
                </div>
                {displayUser.userType === 'freelancer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate ($)</label>
                    <input
                      name="hourlyRate"
                      type="number"
                      value={editForm.hourlyRate}
                      onChange={handleInputChange}
                      className="input-field"
                      placeholder="50"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    name="location"
                    type="text"
                    value={editForm.location}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                  <input
                    name="education"
                    type="text"
                    value={editForm.education}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Your education background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                  <textarea
                    name="experience"
                    value={editForm.experience}
                    onChange={handleInputChange}
                    rows={3}
                    className="input-field"
                    placeholder="Your work experience"
                  />
                </div>
                <div className="flex space-x-3">
                  <button onClick={handleSaveProfile} className="btn-primary">
                    Save Changes
                  </button>
                  <button onClick={handleEditToggle} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {displayUser.profile?.bio ? (
                  <p className="text-gray-700">{displayUser.profile.bio}</p>
                ) : (
                  <p className="text-gray-500 italic">No bio provided</p>
                )}

                {displayUser.profile?.education && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900">Education</h4>
                    <p className="text-gray-700">{displayUser.profile.education}</p>
                  </div>
                )}

                {displayUser.profile?.experience && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900">Experience</h4>
                    <p className="text-gray-700">{displayUser.profile.experience}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills</h2>
            {isEditing && isOwnProfile ? (
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {displayUser.profile?.skills.map(skill => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {skill}
                      <button
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    className="input-field"
                    placeholder="Add a new skill"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                  />
                  <button onClick={handleAddSkill} className="btn-primary">
                    Add
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {displayUser.profile?.skills.length ? (
                  displayUser.profile.skills.map(skill => (
                    <span
                      key={skill}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No skills listed</p>
                )}
              </div>
            )}
          </div>

          {displayUser.profile?.languages && displayUser.profile.languages.length > 0 && (
            <div className="card mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Languages</h2>
              <div className="flex flex-wrap gap-2">
                {displayUser.profile.languages.map(language => (
                  <span
                    key={language}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                  >
                    {language}
                  </span>
                ))}
              </div>
            </div>
          )}

          {reviews.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Reviews ({reviews.length})</h2>
              <div className="space-y-4">
                {reviews.map(review => (
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
                    <p className="text-gray-700">{review.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
