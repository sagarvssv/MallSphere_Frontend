import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import AuthSidebar from './AuthSidebar';

const AuthLayout = ({ children, type = 'login', role = 'user', backLink = '/' }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getTitle = () => {
    return type === 'login' ? 'Welcome Back' : 'Create Account';
  };

  const getSubtitle = () => {
    if (type === 'login') {
      switch(role) {
        case 'stall-owner': return "Access your stall management dashboard";
        case 'vendor': return "Enter your mall administration panel";
        default: return "Sign in to continue";
      }
    } else {
      switch(role) {
        case 'stall-owner': return "Register your stall and start selling";
        case 'vendor': return "Setup your mall management system";
        default: return "Create your account";
      }
    }
  };

  const getRoleGradient = () => {
    switch(role) {
      case 'stall-owner': return 'from-purple-600 to-pink-600';
      case 'vendor': return 'from-indigo-600 to-purple-600';
      default: return 'from-blue-600 to-cyan-600';
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Content/AuthSidebar */}
      <AuthSidebar userType={role} type={type} />

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 bg-gradient-to-br from-slate-50 to-slate-100 relative">
        {/* Subtle background decoration */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',
          opacity: 0.3
        }}></div>
        
        <div className={`w-full max-w-lg relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="mb-10">
            <button 
              onClick={() => window.history.back()}
              className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-8 font-medium transition-all duration-200 group bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md border border-slate-200"
            >
              <ArrowLeft className="mr-2 w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
            </button>
            
            <div className="mb-8">
              <h1 className={`text-5xl font-bold bg-gradient-to-r ${getRoleGradient()} bg-clip-text text-transparent mb-4 leading-tight`}>
                {getTitle()}
              </h1>
              <p className="text-slate-600 text-lg leading-relaxed">{getSubtitle()}</p>
            </div>
          </div>

          {/* Form container with glass effect */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-300/50 border border-white/50 p-8 mb-8">
            {children || (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all duration-200 bg-white hover:border-slate-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all duration-200 bg-white hover:border-slate-300"
                  />
                </div>

                {type === 'login' && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500" />
                      <span className="text-slate-600">Remember me</span>
                    </label>
                    <a href="#" className={`font-semibold bg-gradient-to-r ${getRoleGradient()} bg-clip-text text-transparent hover:opacity-80 transition-opacity`}>
                      Forgot password?
                    </a>
                  </div>
                )}

                <button className={`w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r ${getRoleGradient()} hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] transform`}>
                  {type === 'login' ? 'Sign In' : 'Create Account'}
                </button>

                <div className="text-center text-sm text-slate-600">
                  {type === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <a href="#" className={`font-semibold bg-gradient-to-r ${getRoleGradient()} bg-clip-text text-transparent hover:opacity-80 transition-opacity`}>
                    {type === 'login' ? 'Sign up' : 'Sign in'}
                  </a>
                </div>

                {/* Divider */}
                <div className="relative flex items-center py-4">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-slate-500 text-sm">Or continue with</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                {/* Social Login */}
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center space-x-2 py-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-slate-700 text-sm">Google</span>
                  </button>
                  <button className="flex items-center justify-center space-x-2 py-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span className="text-slate-700 text-sm">Facebook</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Links */}
          <div className="pt-6 border-t border-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-center text-sm text-slate-500 space-y-2 md:space-y-0">
              <div className="flex space-x-4">
                <a href="/terms" className="hover:text-slate-700 transition-colors">Terms</a>
                <a href="/privacy" className="hover:text-slate-700 transition-colors">Privacy</a>
                <a href="/security" className="hover:text-slate-700 transition-colors">Security</a>
              </div>
              <div>
                <span className="text-slate-400">© {new Date().getFullYear()} MallSphere Platform</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.3; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        
        .transform {
          transform: translateZ(0);
        }
      `}</style>
    </div>
  );
};

export default AuthLayout;