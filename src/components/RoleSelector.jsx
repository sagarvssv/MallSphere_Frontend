import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, Building2, ArrowRight, Sparkles, TrendingUp, Shield } from 'lucide-react';

const RoleSelector = () => {
  const [hoveredRole, setHoveredRole] = useState(null);
  const navigate = useNavigate();

  const roles = [
    {
      id: 'stall-owner',
      title: 'Stall Owner',
      description: 'Manage your store and grow your business',
      icon: Store,
      gradient: 'from-purple-500 via-purple-600 to-pink-600',
      badgeColor: 'bg-purple-100 text-purple-700',
      loginPath: '/stall-owner/login',
      registerPath: '/stall-owner/register',
      features: ['Inventory Management', 'Sales Analytics', 'Customer Insights'],
      badge: 'Popular Choice',
      dotColor: 'bg-purple-500',
    },
    {
      id: 'vendor',
      title: 'Mall Owner',
      description: 'Manage your entire mall ecosystem',
      icon: Building2,
      gradient: 'from-indigo-500 via-indigo-600 to-purple-600',
      badgeColor: 'bg-indigo-100 text-indigo-700',
      loginPath: '/vendor/login',
      registerPath: '/vendor/register',
      features: ['Multi-location', 'Enterprise Tools', 'Advanced Reports'],
      badge: 'Enterprise Solution',
      dotColor: 'bg-indigo-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob" />
        <div className="absolute top-40 right-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-1/2 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-blob animation-delay-4000" />
      </div>

      {/* Floating Icons */}
      <div className="absolute top-10 left-1/4 animate-float pointer-events-none">
        <Sparkles className="w-5 h-5 text-blue-400 opacity-60" />
      </div>
      <div className="absolute top-1/3 right-1/4 animate-float animation-delay-2000 pointer-events-none">
        <TrendingUp className="w-6 h-6 text-purple-400 opacity-60" />
      </div>
      <div className="absolute bottom-20 left-1/3 animate-float animation-delay-4000 pointer-events-none">
        <Shield className="w-5 h-5 text-pink-400 opacity-55" />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6 py-14">
        <div className="w-full max-w-3xl">

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/80 backdrop-blur-xl rounded-2xl mb-5 shadow border border-white/50">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-semibold text-xl">M</span>
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-3">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                MallSphere
              </span>
            </h1>
            <p className="text-lg text-slate-500 max-w-md mx-auto leading-relaxed">
              Choose your role and start your journey with the future of mall management
            </p>
          </div>

          {/* Role Cards — 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {roles.map((role) => {
              const IconComponent = role.icon;
              const isHovered = hoveredRole === role.id;

              return (
                <div
                  key={role.id}
                  onMouseEnter={() => setHoveredRole(role.id)}
                  onMouseLeave={() => setHoveredRole(null)}
                  className={`bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 overflow-hidden transition-all duration-300 ${
                    isHovered ? '-translate-y-1 shadow-xl' : ''
                  }`}
                >
                  {/* Card Header */}
                  <div className={`bg-gradient-to-br ${role.gradient} p-7 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -mr-14 -mt-14" />
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full -ml-10 -mb-10" />
                    <div className="relative z-10">
                      <div className="w-13 h-13 w-12 h-12 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center mb-4 border border-white/30">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-1">{role.title}</h3>
                      <p className="text-white/85 text-sm">{role.description}</p>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    {/* Features */}
                    <div className="mb-5 space-y-2.5">
                      {role.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 text-slate-500 text-sm">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${role.dotColor}`} />
                          {feature}
                        </div>
                      ))}
                    </div>

                    {/* Buttons */}
                    <div className="space-y-2.5">
                      <button
                        onClick={() => navigate(role.loginPath)}
                        className={`w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r ${role.gradient} hover:opacity-90 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group`}
                      >
                        Sign In
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                      <button
                        onClick={() => navigate(role.registerPath)}
                        className="w-full py-3 rounded-xl font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all duration-200"
                      >
                        Create Account
                      </button>
                    </div>

                    {/* Badge */}
                    <div className="mt-5 text-center">
                      <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${role.badgeColor}`}>
                        {role.badge}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow border border-white/50 p-6 mb-8">
            <div className="grid grid-cols-3 text-center divide-x divide-slate-100">
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-1">
                  10,000+
                </div>
                <div className="text-sm text-slate-500">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-1">
                  500+
                </div>
                <div className="text-sm text-slate-500">Registered Businesses</div>
              </div>
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-500 bg-clip-text text-transparent mb-1">
                  50+
                </div>
                <div className="text-sm text-slate-500">Mall Locations</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-slate-400 mb-3">Trusted by thousands of businesses worldwide</p>
            <div className="flex justify-center gap-6 text-sm text-slate-400">
              <a href="/about" className="hover:text-slate-600 transition-colors">About</a>
              <a href="/features" className="hover:text-slate-600 transition-colors">Features</a>
              <a href="/pricing" className="hover:text-slate-600 transition-colors">Pricing</a>
              <a href="/contact" className="hover:text-slate-600 transition-colors">Contact</a>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -40px) scale(1.08); }
          50% { transform: translate(-15px, 15px) scale(0.94); }
          75% { transform: translate(40px, 40px) scale(1.04); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default RoleSelector;