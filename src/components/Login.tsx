import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { validateEmail, validatePassword } from '../utils/helpers';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    const success = await login(formData.email, formData.password);
    
    if (success) {
      navigate('/dashboard');
    } else {
      setErrors({ general: 'Invalid email or password' });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Column - Form */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-16 lg:px-24">
        {/* Logo */}
        <div className="mb-10 animate-fade-in">
          <Link to="/" className="flex items-center gap-2">
             {/* A generic geometric crown-like logo matching the vibe */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 5L28 15L23 15L23 25L17 25L17 15L12 15L20 5Z" fill="#3144D9"/>
              <path d="M12 28L28 28L28 32L12 32L12 28Z" fill="#3144D9"/>
              <path d="M6 18L10 22L14 18L10 14L6 18Z" fill="#3144D9"/>
              <path d="M26 18L30 22L34 18L30 14L26 18Z" fill="#3144D9"/>
            </svg>
          </Link>
        </div>

        <div className="animate-slide-up">
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
            Welcome back!
          </h2>
          <p className="mt-4 text-gray-600 font-medium">
            Enter to get unlimited access to data & information.
          </p>

          <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-gray-900 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-5 py-3.5 bg-white border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-auth-purple focus:border-transparent outline-none transition-all`}
                  placeholder="Enter your mail address"
                />
                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-bold text-gray-900 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-5 py-3.5 bg-white border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:ring-2 focus:ring-auth-purple focus:border-transparent outline-none transition-all pr-12`}
                    placeholder="Enter password"
                  />
                  {/* Password Toggle Icon */}
                  <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-sm text-red-500 font-medium">{errors.password}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-auth-purple focus:ring-auth-purple border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm font-semibold text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-semibold text-auth-purple hover:text-auth-blue transition-colors">
                  Forgot your password?
                </Link>
              </div>
            </div>

            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600 font-medium">{errors.general}</p>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-auth-purple hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-auth-purple disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                   <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging In...
                  </span>
                ) : (
                  'Log In'
                )}
              </button>
            </div>



            <p className="mt-8 text-center text-sm text-gray-900 font-semibold">
              Don't have an account ?{' '}
              <Link to="/register" className="text-auth-purple hover:text-auth-blue transition-colors underline decoration-2 underline-offset-4">
                Register here
              </Link>
            </p>
{/* 
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500 font-medium">Demo accounts:</p>
              <div className="mt-2 text-xs text-gray-400 space-y-1">
                <p>freelancer@example.com / password123</p>
                <p>client@example.com / password123</p>
              </div>
            </div> */}
          </form>
        </div>
      </div>

      {/* Right Column - Geometric Pattern Pattern */}
      <div className="hidden lg:flex w-[55%] bg-auth-navy relative overflow-hidden items-center justify-center">
         {/* Decorative Elements mimicking the reference design */}
         <div className="absolute inset-0 z-0">
            {/* Top Left Quadrant - Purple Abstract */}
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-[#7042EE]">
              <div className="w-full h-full opacity-50 relative">
                <div className="absolute top-1/4 left-1/4 w-32 h-64 bg-[#8C60F9] rounded-full transform -rotate-45" />
                <div className="absolute bottom-1/4 right-1/4 w-32 h-64 bg-[#6232D9] rounded-full transform rotate-45" />
              </div>
            </div>

            {/* Top Right Quadrant - Dark Nav/Geometric */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#0E173C]">
                <div className="absolute top-10 left-10 flex gap-2">
                  <div className="w-4 h-4 bg-[#F2C034] transform rotate-45" />
                  <div className="w-4 h-4 bg-[#E9316C] transform rotate-45" />
                </div>
                <div className="absolute top-20 left-10 flex gap-1">
                   {Array.from({length: 20}).map((_, i) => (
                      <div key={i} className={`w-1 h-6 bg-${i % 2 === 0 ? 'white' : 'blue-500'} opacity-80`} />
                   ))}
                </div>
                {/* 3D Cube Pattern */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGcgc3Ryb2tlPSIjMjk0NzkzIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiPjxwYXRoIGQ9Ik0yMCAwbDIwIDEwTDIwIDIwIDAgMTB6TTAgMTBsMjAgMTB2MjBMMCAzMHpNMjAgMjBsMjAtMTB2MjBMMjAgNDB6Ii8+PC9nPjwvc3ZnPg==')] opacity-30" />
            </div>

            {/* Middle Band - Deep Blue */}
            <div className="absolute top-1/2 left-0 w-full h-1/4 bg-[#3144D9] -translate-y-1/2 flex items-center">
                {/* Yellow Star */}
                <div className="absolute left-[20%] top-[-20px] w-16 h-16 bg-[#F2C034]" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }} />
                
                {/* Cyan Block */}
                <div className="absolute left-[5%] bottom-[-20%] w-24 h-32 bg-[#1CBBB5] transform rotate-[-10deg] opacity-90 shadow-2xl" />

                {/* Dots & Lines */}
                <div className="absolute right-[30%] flex gap-2 opacity-50">
                  <div className="w-3 h-3 rounded-full bg-white" />
                  <div className="w-3 h-3 rounded-full bg-white" />
                  <div className="w-3 h-3 rounded-full bg-white" />
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>

                {/* Radiating lines (Dandelion) */}
                <div className="absolute right-[10%] bottom-0 w-32 h-16 overflow-hidden">
                   <div className="absolute bottom-0 left-1/2 w-4 h-4 rounded-full bg-white -translate-x-1/2 z-10" />
                   {Array.from({length: 8}).map((_, i) => (
                     <div key={i} className="absolute bottom-2 left-1/2 w-0.5 h-16 bg-white opacity-40 origin-bottom" style={{ transform: `rotate(${(i - 3.5) * 20}deg)` }}>
                        <div className="absolute top-0 left-1/2 w-1.5 h-1.5 rounded-full bg-white -translate-x-1/2" />
                     </div>
                   ))}
                </div>
            </div>

            {/* Bottom Right Quadrant - Connecting curves */}
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-[#0E173C]">
               <div className="absolute top-0 right-0 w-64 h-64 bg-[#7042EE] rounded-tl-full opacity-80 flex items-end justify-start">
                 <div className="w-48 h-48 bg-[#3144D9] rounded-tl-full" />
               </div>
               {/* Cyan corner */}
               <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#1CBBB5] rounded-tl-full" />
               {/* Dots grid */}
               <div className="absolute bottom-8 right-8 w-16 h-24 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxjaXJjbGUgY3g9IjMiIGN5PSIzIiByPSIxLjUiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC42Ii8+PC9zdmc+')]"/>
            </div>

             {/* Bottom Left Quadrant */}
             <div className="absolute bottom-0 left-0 w-1/2 h-1/4 bg-[#0E173C]">
                {/* Purple concentric circles */}
                <div className="absolute bottom-0 left-0 w-48 h-48 border-[24px] border-[#8C60F9] rounded-tr-full bg-[#7042EE] opacity-90" />
                {/* Wavy lines */}
                <div className="absolute bottom-10 right-10 opacity-70">
                    <svg width="80" height="20" viewBox="0 0 80 20" fill="none">
                      <path d="M0 10 Q 10 0, 20 10 T 40 10 T 60 10 T 80 10" stroke="#1CBBB5" strokeWidth="2" fill="none"/>
                      <path d="M0 15 Q 10 5, 20 15 T 40 15 T 60 15 T 80 15" stroke="#1CBBB5" strokeWidth="2" fill="none"/>
                    </svg>
                </div>
             </div>
         </div>
      </div>
    </div>
  );
};

export default Login;
