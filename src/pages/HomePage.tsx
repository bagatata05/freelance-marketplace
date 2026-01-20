import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/animations.css';

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Find Your Perfect
            <span className="text-blue-600"> Freelance Match</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect with talented freelancers and clients worldwide. Whether you're looking to hire the best talent or find your next project, FreelanceHub makes it simple.
          </p>
          
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                to="/register"
                className="btn-primary px-8 py-3 text-lg"
              >
                Get Started
              </Link>
              <Link
                to="/jobs"
                className="btn-secondary px-8 py-3 text-lg"
              >
                Browse Jobs
              </Link>
            </div>
          )}

          {user && (
            <div className="mb-16">
              <Link
                to={user.userType === 'freelancer' ? '/freelancer/dashboard' : '/client/dashboard'}
                className="btn-primary px-8 py-3 text-lg"
              >
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="card text-center animate-slide-up animate-delay-100">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Find Top Talent</h3>
            <p className="text-gray-600">
              Access a global pool of skilled freelancers with verified expertise in every field.
            </p>
          </div>
          
          <div className="card text-center animate-slide-up animate-delay-200">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Launch Your Career</h3>
            <p className="text-gray-600">
              Discover exciting projects and build your portfolio with clients from around the world.
            </p>
          </div>
          
          <div className="card text-center animate-slide-up animate-delay-300">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Payments</h3>
            <p className="text-gray-600">
              Protected escrow system ensures safe transactions for both clients and freelancers.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Sign Up</h3>
              <p className="text-gray-600 text-sm">Create your free account in minutes</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Create Profile</h3>
              <p className="text-gray-600 text-sm">Showcase your skills and experience</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Connect</h3>
              <p className="text-gray-600 text-sm">Find the perfect match for your needs</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">4</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Work Together</h3>
              <p className="text-gray-600 text-sm">Collaborate and get paid securely</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Join Thousands of Happy Users</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">10K+</div>
              <p className="text-gray-600">Active Freelancers</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">5K+</div>
              <p className="text-gray-600">Projects Completed</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">$2M+</div>
              <p className="text-gray-600">Total Earnings</p>
            </div>
          </div>
          
          {!user && (
            <Link
              to="/register"
              className="btn-primary px-8 py-3 text-lg"
            >
              Start Your Journey Today
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
