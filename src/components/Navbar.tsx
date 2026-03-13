import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { StorageService } from '../utils/storage';
import NotificationPopover from './NotificationPopover';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const updateUnreadCount = () => {
      const allMessages = StorageService.getMessages();
      const unreadMessages = allMessages.filter(
        message => message.receiverId === user.id && !message.read
      );
      setUnreadMessageCount(unreadMessages.length);
    };

    updateUnreadCount();

    // Update count every 5 seconds to catch new messages
    const interval = setInterval(updateUnreadCount, 5000);

    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    return user.userType === 'freelancer' ? '/freelancer/dashboard' : '/client/dashboard';
  };

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-black tracking-tight text-gray-900">Freelance<span className="text-behance-blue">Hub</span></span>
            </Link>
          </div>

          {user && (
            <div className="hidden md:flex items-center space-x-1 font-semibold text-sm">
              <Link
                  to="/jobs"
                  className={`px-4 py-2 rounded-full transition-colors ${
                    isActivePath('/jobs')
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Explore Jobs
                </Link>

              {user.userType === 'freelancer' && (
                <>
                  <Link
                    to="/freelancer/dashboard"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActivePath('/freelancer')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/freelancer/profile"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActivePath('/freelancer/profile')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    My Profile
                  </Link>
                </>
              )}

              {user.userType === 'client' && (
                <>
                  <Link
                    to="/client/dashboard"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActivePath('/client')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/client/post-job"
                    className="btn-primary text-sm"
                  >
                    Post Job
                  </Link>
                </>
              )}

              <Link
                to="/messages"
                className={`relative p-2 rounded-md text-sm font-medium transition-colors ${
                  isActivePath('/messages')
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
                title="Messages"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                  </span>
                )}
              </Link>

              <NotificationPopover />

              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-3 text-sm rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50 p-2 transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                    {user.firstName[0]}{user.lastName[0]}
                  </div>
                  <span className="hidden lg:block">{user.firstName} {user.lastName}</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 animate-slide-up">
                    <div className="py-1">
                      <Link
                        to={getDashboardPath()}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Profile Settings
                      </Link>
                      <Link
                        to="/messages"
                        className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span>Messages</span>
                        {unreadMessageCount > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                            {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                          </span>
                        )}
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        aria-label="Sign out of your account"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!user && (
            <div className="hidden md:flex md:items-center md:space-x-4">
              <Link
                to="/login"
                className="btn-secondary text-sm"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="btn-primary text-sm"
              >
                Sign Up
              </Link>
            </div>
          )}

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50"
              aria-label="Toggle mobile menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden animate-slide-up">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {user ? (
              <>
                <Link
                  to="/jobs"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Browse Jobs
                </Link>
                {user.userType === 'freelancer' && (
                  <>
                    <Link
                      to="/freelancer/dashboard"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/freelancer/profile"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Profile
                    </Link>
                  </>
                )}
                {user.userType === 'client' && (
                  <>
                    <Link
                      to="/client/dashboard"
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/client/post-job"
                      className="block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Post Job
                    </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
