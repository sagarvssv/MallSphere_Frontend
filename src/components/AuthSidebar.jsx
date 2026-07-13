import { Shield, TrendingUp, Store, Building2, CheckCircle, ScanLine } from 'lucide-react';

const AuthSidebar = ({ userType, type = 'login' }) => {
  const loginFeatures = {
    'stall-owner': [
      { icon: <TrendingUp className="w-4 h-4" />, text: 'Real-time sales analytics' },
      { icon: <Store className="w-4 h-4" />, text: 'Inventory management tools' },
      { icon: <CheckCircle className="w-4 h-4" />, text: 'Easy stall setup process' }
    ],
    'vendor': [
      { icon: <Building2 className="w-4 h-4" />, text: 'Multi-location dashboard' },
      { icon: <TrendingUp className="w-4 h-4" />, text: 'Enterprise analytics suite' },
      { icon: <Shield className="w-4 h-4" />, text: 'Advanced security features' }
    ]
  };

  const registerFeatures = {
    'stall-owner': [
      { icon: <CheckCircle className="w-4 h-4" />, text: 'Free business analytics' },
      { icon: <Store className="w-4 h-4" />, text: 'Easy stall setup process' },
      { icon: <TrendingUp className="w-4 h-4" />, text: 'Growth insights included' }
    ],
    'vendor': [
      { icon: <CheckCircle className="w-4 h-4" />, text: 'Enterprise onboarding' },
      { icon: <Building2 className="w-4 h-4" />, text: 'Multi-mall management' },
      { icon: <Shield className="w-4 h-4" />, text: 'Priority support included' }
    ]
  };

  const currentFeatures = type === 'login' ? loginFeatures[userType] : registerFeatures[userType];
  const title = type === 'login' ? 'Welcome back' : 'Join the floor';
  const subtitle = type === 'login'
    ? 'Sign in to pick up right where you left off.'
    : 'Set up your pass and get your stall listed.';

  const roleConfig = {
    'stall-owner': {
      gradient: 'from-[#C026D3] to-[#6D28D9]',
      passLabel: 'STALL OWNER PASS',
      passIcon: <Store className="w-5 h-5" />,
      idPrefix: 'STL',
    },
    'vendor': {
      gradient: 'from-[#4F46E5] to-[#6D28D9]',
      passLabel: 'VENDOR PASS',
      passIcon: <Building2 className="w-5 h-5" />,
      idPrefix: 'VND',
    },
    default: {
      gradient: 'from-[#0EA5E9] to-[#6366F1]',
      passLabel: 'MEMBER PASS',
      passIcon: <Shield className="w-5 h-5" />,
      idPrefix: 'MS',
    }
  };

  const config = roleConfig[userType] || roleConfig.default;

  return (
    <div className="hidden lg:flex lg:w-1/2 bg-[#1B1526] relative overflow-hidden">
      {/* Ambient glow */}
      <div className={`absolute -top-32 -left-20 w-[28rem] h-[28rem] rounded-full bg-gradient-to-br ${config.gradient} opacity-20 blur-3xl`} />
      <div className={`absolute bottom-0 right-0 w-72 h-72 rounded-full bg-gradient-to-br ${config.gradient} opacity-10 blur-3xl`} />

      <div className="relative z-10 flex flex-col justify-center px-12 py-12 w-full">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-10">
          <div className={`w-10 h-10 bg-gradient-to-br ${config.gradient} rounded-xl flex items-center justify-center shadow-lg shrink-0`}>
            <span className="text-white font-bold text-lg" style={{ fontFamily: "'Outfit', sans-serif" }}>M</span>
          </div>
          <span className="text-lg font-semibold text-white/90 tracking-wide">MallSphere</span>
        </div>

        {/* Headline */}
        <div className="mb-10">
          <h2
            className="text-4xl font-bold text-white mb-3 leading-[1.1]"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {title}
          </h2>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">{subtitle}</p>
        </div>

        {/* Signature: floating access pass */}
        <div className="relative mb-10 mt-2 ml-2">
          <div
            className={`relative w-full max-w-xs rounded-2xl bg-gradient-to-br ${config.gradient} p-5 shadow-2xl rotate-[-3deg] transition-transform duration-500 hover:rotate-0`}
            style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
          >
            {/* sheen */}
            <div className="pointer-events-none absolute -left-10 top-0 h-full w-16 bg-white/10 -skew-x-12 rounded-2xl" />

            <div className="relative flex items-center justify-between mb-6">
              <span className="text-white/70 text-[10px] font-bold tracking-[0.15em] uppercase">MallSphere Access</span>
              <ScanLine className="w-4 h-4 text-white/50" />
            </div>

            <div className="relative flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20 shrink-0">
                <span className="text-white">{config.passIcon}</span>
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight">{config.passLabel}</p>
                <p className="text-white/60 text-[11px] font-mono tracking-wide mt-0.5">
                  {config.idPrefix}-2026-{userType === 'vendor' ? '8841' : '2207'}
                </p>
              </div>
            </div>

            {/* perforation + barcode */}
            <div className="relative pt-4 border-t border-dashed border-white/25">
              <div className="flex items-end gap-[3px] h-6">
                {[3,1,2,4,1,3,2,1,4,2,1,3,2,4,1,2,3,1,4,2,1,3].map((h, i) => (
                  <div
                    key={i}
                    className="bg-white/40 rounded-sm"
                    style={{ width: '2px', height: `${h * 5 + 4}px` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Privileges */}
        <div className="space-y-2.5 mb-10">
          {currentFeatures?.map((feature, index) => (
            <div
              key={index}
              className="flex items-center gap-3 px-3.5 py-3 bg-white/[0.04] rounded-xl ring-1 ring-white/[0.06] hover:bg-white/[0.07] transition-colors duration-200"
            >
              <div className={`flex-shrink-0 w-8 h-8 bg-gradient-to-br ${config.gradient} rounded-lg flex items-center justify-center`}>
                <span className="text-white">{feature.icon}</span>
              </div>
              <p className="text-slate-200 text-sm font-medium">{feature.text}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex gap-8 pt-8 border-t border-white/[0.08]">
          <div>
            <div className="text-xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>10K+</div>
            <div className="text-xs text-slate-500 mt-0.5">Active vendors</div>
          </div>
          <div>
            <div className="text-xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>99%</div>
            <div className="text-xs text-slate-500 mt-0.5">Satisfaction</div>
          </div>
          <div>
            <div className="text-xl font-bold text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>24/7</div>
            <div className="text-xs text-slate-500 mt-0.5">Support</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthSidebar;