import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProjectCard from '../components/ProjectCard';

// Mock data for featured projects (normally fetched from an API)
const FEATURED_PROJECTS = [
  {
    id: 'p1',
    title: 'Modern E-commerce App Design',
    creatorName: 'Sarah Jenkins',
    creatorAvatar: 'https://i.pravatar.cc/150?u=sarah',
    imageUrl: 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&q=80&w=800',
    likes: 2453,
    views: 12400,
    tags: ['UI/UX', 'Mobile']
  },
  {
    id: 'p2',
    title: 'Fintech Dashboard Dark Mode',
    creatorName: 'Alex River',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800',
    likes: 892,
    views: 5120,
    tags: ['Web', 'Dashboard']
  },
  {
    id: 'p3',
    title: 'Brand Identity - Aura Coffee',
    creatorName: 'Elena V.',
    creatorAvatar: 'https://i.pravatar.cc/150?u=elena',
    imageUrl: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&q=80&w=800',
    likes: 4120,
    views: 32000,
    tags: ['Branding', 'Print']
  },
  {
    id: 'p4',
    title: '3D Abstract Illustrations',
    creatorName: 'Max Studio',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
    likes: 1205,
    views: 8400,
    tags: ['3D', 'Art']
  },
  {
    id: 'p5',
    title: 'Healthcare Platform Redesign',
    creatorName: 'David Kim',
    creatorAvatar: 'https://i.pravatar.cc/150?u=david',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800',
    likes: 310,
    views: 2100,
    tags: ['UX', 'Medical']
  },
  {
    id: 'p6',
    title: 'Minimalist Architecture Portfolio',
    creatorName: 'Sophie L.',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800',
    likes: 5430,
    views: 45000,
    tags: ['Web', 'Minimal']
  }
];

const HomePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-behance-gray">
      {/* Hero Section */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-20 pb-16">
        <div className="max-w-4xl animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-black text-behance-black leading-[1.1] mb-6 tracking-tight">
            The World's Best Creators Are On <span className="text-behance-blue">FreelanceHub</span>
          </h1>
          <p className="text-xl md:text-2xl text-behance-text font-medium mb-10 max-w-3xl leading-relaxed">
            A comprehensive platform to help hirers and creators navigate the creative world from discovering inspiration, to connecting with one another.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-20 animate-fade-in animate-delay-200">
            {!user ? (
              <>
                <Link
                  to="/register"
                  className="btn-primary text-lg px-8 py-4 font-bold"
                >
                  Hire a Freelancer
                </Link>
                <Link
                  to="/jobs"
                  className="btn-secondary text-lg px-8 py-4 font-bold"
                >
                  Find Work
                </Link>
              </>
            ) : (
              <Link
                to={user.userType === 'freelancer' ? '/freelancer/dashboard' : '/client/dashboard'}
                className="btn-primary text-lg px-8 py-4 font-bold"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* Project Grid Filters (Visual Only for Demo) */}
        <div className="flex items-center justify-between mb-8 border-b border-gray-200 pb-4 animate-fade-in animate-delay-300">
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            <button className="px-4 py-2 bg-black text-white rounded-full text-sm font-bold whitespace-nowrap">For You</button>
            <button className="px-4 py-2 bg-transparent hover:bg-gray-200 text-gray-900 rounded-full text-sm font-bold whitespace-nowrap transition-colors">Discover</button>
            <button className="px-4 py-2 bg-transparent hover:bg-gray-200 text-gray-900 rounded-full text-sm font-bold whitespace-nowrap transition-colors">UI/UX Design</button>
            <button className="px-4 py-2 bg-transparent hover:bg-gray-200 text-gray-900 rounded-full text-sm font-bold whitespace-nowrap transition-colors">Illustration</button>
            <button className="px-4 py-2 bg-transparent hover:bg-gray-200 text-gray-900 rounded-full text-sm font-bold whitespace-nowrap transition-colors">Development</button>
          </div>
          <div className="hidden md:flex">
            <button className="flex items-center gap-2 text-sm font-bold text-gray-900 hover:text-behance-blue transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
              Filter
            </button>
          </div>
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10 animate-fade-in animate-delay-300">
          {FEATURED_PROJECTS.map((project, idx) => (
            <div key={project.id} className={`animate-slide-up`} style={{ animationDelay: `${idx * 100}ms` }}>
              <ProjectCard {...project} />
            </div>
          ))}
        </div>
      </div>

      {/* Simplified "How It Works" Section */}
      <div className="bg-white py-24 border-t border-gray-200">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-black text-behance-black mb-6 tracking-tight">How FreelanceHub Works</h2>
            <p className="text-xl text-behance-muted font-medium">Connect with top tier talent or find your next big opportunity in three simple steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-behance-gray rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl font-black text-behance-black">1</span>
              </div>
              <h3 className="text-2xl font-bold text-behance-black mb-4">Create Your Profile</h3>
              <p className="text-behance-muted font-medium">Showcase your portfolio or outline your project needs to attract the right match.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-behance-gray rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl font-black text-behance-black">2</span>
              </div>
              <h3 className="text-2xl font-bold text-behance-black mb-4">Connect</h3>
              <p className="text-behance-muted font-medium">Browse portfolios, send proposals, or invite creators to collaborate on your vision.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-behance-gray rounded-full flex items-center justify-center mb-6">
                <span className="text-3xl font-black text-behance-black">3</span>
              </div>
              <h3 className="text-2xl font-bold text-behance-black mb-4">Collaborate & Succeed</h3>
              <p className="text-behance-muted font-medium">Work together seamlessly and process payments securely through our platform.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section with Bold Typography */}
      <div className="bg-behance-black text-white py-24">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-black mb-16 tracking-tight">Join A Thriving Creative Ecosystem</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
              <div className="text-6xl md:text-7xl font-black text-behance-blue mb-2">10K+</div>
              <p className="text-xl text-gray-400 font-bold">Active Creators</p>
            </div>
            <div>
              <div className="text-6xl md:text-7xl font-black text-white mb-2">50K+</div>
              <p className="text-xl text-gray-400 font-bold">Projects Published</p>
            </div>
            <div>
              <div className="text-6xl md:text-7xl font-black text-behance-blue mb-2">$5M+</div>
              <p className="text-xl text-gray-400 font-bold">Earned by Freelancers</p>
            </div>
          </div>
          
          {!user && (
            <div className="mt-20">
              <Link to="/register" className="btn-primary text-xl px-10 py-5 font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all">
                Sign Up Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
