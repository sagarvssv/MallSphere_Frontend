import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import AuthSidebar from './AuthSidebar';

const AuthLayout = ({ children, type = 'login', role = 'user', backLink = '/' }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getTitle = () => {
    return type === 'login' ? 'Welcome back' : 'Create your pass';
  };

  const getEyebrow = () => {
    switch(role) {
      case 'stall-owner': return 'Stall owner access';
      case 'vendor': return 'Vendor access';
      default: return 'Account access';
    }
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
      case 'stall-owner': return 'from-[#C026D3] to-[#6D28D9]';
      case 'vendor': return 'from-[#4F46E5] to-[#6D28D9]';
      default: return 'from-[#0EA5E9] to-[#6366F1]';
    }
  };

  const getRoleAccentText = () => {
    switch(role) {
      case 'stall-owner': return 'text-fuchsia-600';
      case 'vendor': return 'text-indigo-600';
      default: return 'text-sky-600';
    }
  };

  return (
    <div className="min-h-screen flex">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&display=swap');
      `}</style>

      {/* Left Side - AuthSidebar */}
      <AuthSidebar userType={role} type={type} />

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8 bg-[#F7F5FA] relative">
        <div className={`w-full max-w-lg relative z-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="mb-8">
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 mb-8 font-medium transition-colors group"
            >
              <ArrowLeft className="mr-2 w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back
            </button>

            <div className="mb-2">
              <p className={`text-[11px] font-semibold tracking-[0.12em] uppercase mb-2 ${getRoleAccentText()}`}>
                {getEyebrow()}
              </p>
              <h1
                className="text-4xl font-bold text-gray-900 mb-3 leading-[1.1]"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                {getTitle()}
              </h1>
              <p className="text-gray-500 text-base leading-relaxed">{getSubtitle()}</p>
            </div>
          </div>

          {/* Form container */}
          <div className="bg-white rounded-3xl shadow-xl shadow-gray-900/5 ring-1 ring-gray-100 p-8 mb-8">
            {children || (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all duration-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all duration-200 bg-white"
                  />
                </div>

                {type === 'login' && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-gray-600">Remember me</span>
                    </label>
                    <a href="#" className={`font-semibold ${getRoleAccentText()} hover:opacity-80 transition-opacity`}>
                      Forgot password?
                    </a>
                  </div>
                )}

                <button className={`w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r ${getRoleGradient()} hover:opacity-90 shadow-sm shadow-indigo-600/25 transition-opacity duration-200`}>
                  {type === 'login' ? 'Sign In' : 'Create Account'}
                </button>

                <div className="text-center text-sm text-gray-500">
                  {type === 'login' ? "Don't have an account? " : "Already have an account? "}
                  <a href="#" className={`font-semibold ${getRoleAccentText()} hover:opacity-80 transition-opacity`}>
                    {type === 'login' ? 'Sign up' : 'Sign in'}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Footer Links */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 space-y-2 md:space-y-0">
              <div className="flex space-x-4">
                <a href="/terms" className="hover:text-gray-600 transition-colors">Terms</a>
                <a href="/privacy" className="hover:text-gray-600 transition-colors">Privacy</a>
                <a href="/security" className="hover:text-gray-600 transition-colors">Security</a>
              </div>
              <span>© {new Date().getFullYear()} MallSphere Platform</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;