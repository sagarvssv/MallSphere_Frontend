import { useState } from 'react';
import { Store, User, Copy, Check } from 'lucide-react';

const SellerHeader = ({ profile, onLogout, onTabChange }) => {
  const [copied, setCopied] = useState(false);

  const stallId = profile?.data?.sellerId;

  const handleCopyId = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(stallId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy stall ID:', err);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center shadow">
            <Store className="w-4 h-4 text-white" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-semibold text-stone-900">MallSphere</span>
            {stallId && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-400 font-medium tracking-wide">
                  ID: {stallId}
                </span>
                <button
                  onClick={handleCopyId}
                  className="text-stone-400 hover:text-stone-600 transition-colors"
                  title="Copy stall ID"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => onTabChange("profile")}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-stone-200 hover:border-stone-300 hover:bg-stone-50 transition-all text-sm font-medium text-stone-700"
          >
            {profile?.data?.profile ? (
              <img
                src={profile.data.profile}
                alt={profile.data.name}
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              <User className="w-7 h-7 p-1.5 bg-stone-100 rounded-full" />
            )}
            {profile?.data?.name || profile?.data?.shopName || 'Seller'}
          </button>

          <button
            onClick={onLogout}
            className="text-sm text-stone-500 hover:text-stone-700 px-3 py-1.5"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default SellerHeader;