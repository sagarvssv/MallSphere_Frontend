import { Sparkles, Shield, Zap, TrendingUp, Store, Building2, CheckCircle } from 'lucide-react';

const AuthSidebar = ({ userType, type = 'login' }) => {
  const loginFeatures = {
    'stall-owner': [
      { icon: <TrendingUp className="w-5 h-5" />, text: 'Real-time sales analytics' },
      { icon: <Store className="w-5 h-5" />, text: 'Inventory management tools' },
      { icon: <CheckCircle className="w-5 h-5" />, text: 'Easy stall setup process' }
    ],
    'vendor': [
      { icon: <Building2 className="w-5 h-5" />, text: 'Multi-location dashboard' },
      { icon: <TrendingUp className="w-5 h-5" />, text: 'Enterprise analytics suite' },
      { icon: <Shield className="w-5 h-5" />, text: 'Advanced security features' }
    ]
  };

  const registerFeatures = {
  
    'stall-owner': [
      { icon: <CheckCircle className="w-5 h-5" />, text: 'Free business analytics' },
      { icon: <Store className="w-5 h-5" />, text: 'Easy stall setup process' },
      { icon: <TrendingUp className="w-5 h-5" />, text: 'Growth insights included' }
    ],
    'vendor': [
      { icon: <CheckCircle className="w-5 h-5" />, text: 'Enterprise onboarding' },
      { icon: <Building2 className="w-5 h-5" />, text: 'Multi-mall management' },
      { icon: <Shield className="w-5 h-5" />, text: 'Priority support included' }
    ]
  };

  const currentFeatures = type === 'login' ? loginFeatures[userType] : registerFeatures[userType];
  const title = type === 'login' ? 'Welcome Back' : 'Join the Future';
  const subtitle = type === 'login' 
    ? 'Access your account and continue your journey'
    : 'Create your account and unlock amazing features';

  const getRoleColor = () => {
    switch(userType) {
      case 'stall-owner': return 'from-purple-400 to-pink-400';
      case 'vendor': return 'from-indigo-400 to-purple-400';
      default: return 'from-blue-400 to-cyan-400';
    }
  };

  return (
    <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br opacity-20">
        <div className={`absolute inset-0 bg-gradient-to-br ${getRoleColor()} mix-blend-overlay`}></div>
      </div>

      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)`,
        backgroundSize: '100px 100px'
      }}></div>

      <div className="relative z-10 flex flex-col justify-center px-12 py-8 text-white">
        {/* Logo/Brand */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <div className={`w-12 h-12 bg-gradient-to-br ${getRoleColor()} rounded-xl flex items-center justify-center shadow-lg`}>
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
              MallSphere
            </span>
          </div>
          
          <h2 className="text-4xl font-bold mb-4">
            {title}
          </h2>
          <p className="text-slate-300 text-lg">
            {subtitle}
          </p>
        </div>

        {/* Features List - Simplified */}
        <div className="space-y-6 mb-8">
          {currentFeatures?.map((feature, index) => (
            <div 
              key={index}
              className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${getRoleColor()} rounded-lg flex items-center justify-center`}>
                {feature.icon}
              </div>
              <div>
                <p className="text-white font-medium">{feature.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Simple Stats */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <div className="flex space-x-8">
            <div>
              <div className="text-2xl font-bold text-white">10K+</div>
              <div className="text-sm text-slate-300">Active Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">99%</div>
              <div className="text-sm text-slate-300">Satisfaction</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-sm text-slate-300">Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthSidebar;