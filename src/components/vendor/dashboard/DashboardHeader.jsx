import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaStore, FaBell, FaSignOutAlt, FaCopy, FaCheck } from 'react-icons/fa';

const DashboardHeader = ({ vendorData, pendingStallsCount, onLogout }) => {
  const [copied, setCopied] = useState(false);

  const vendorId = vendorData?.vendorId;

  const handleCopyId = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(vendorId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy vendor ID:', err);
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm ring-1 ring-gray-100 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 md:py-5 gap-4">
          {/* Brand + Vendor Identity */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative bg-gradient-to-br from-[#4F46E5] to-[#6D28D9] p-3 rounded-2xl shadow-md shrink-0">
              <FaStore className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                  MallSphere
                </h1>
                <span className="text-sm md:text-base font-medium text-gray-400 truncate">
                  Vendor Dashboard
                </span>
              </div>
              <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 mt-0.5">
                <p className="text-sm text-gray-500">
                  Welcome, <span className="font-medium text-gray-700">{vendorData?.name || 'Vendor'}</span>
                </p>
                {vendorId && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-mono text-gray-400">#{vendorId}</span>
                    <button
                      onClick={handleCopyId}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Copy vendor ID"
                    >
                      {copied ? (
                        <FaCheck className="h-2.5 w-2.5 text-emerald-600" />
                      ) : (
                        <FaCopy className="h-2.5 w-2.5" />
                      )}
                    </button>
                  </div>
                )}
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Verified Vendor
                </span>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <button
              className="relative p-2.5 text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-xl ring-1 ring-transparent hover:ring-gray-200 transition-colors"
              aria-label="Notifications"
            >
              <FaBell className="h-4.5 w-4.5" />
              {pendingStallsCount > 0 && (
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3.5 py-2.5 text-rose-600 rounded-xl hover:bg-rose-50 ring-1 ring-transparent hover:ring-rose-200 font-medium text-sm transition-colors"
            >
              <FaSignOutAlt className="h-4 w-4" />
              <span className="hidden md:inline">Logout</span>
            </button>

            <div className="w-px h-8 bg-gray-100 hidden md:block" />

            <Link to="/vendor/profile" className="flex items-center gap-3 pl-1 pr-2 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
              <div className="h-10 w-10 bg-gradient-to-br from-[#4F46E5] to-[#6D28D9] rounded-full flex items-center justify-center shadow-sm shrink-0">
                <span className="font-bold text-white text-sm">
                  {vendorData?.name?.charAt(0)?.toUpperCase() || 'V'}
                </span>
              </div>
              <div className="hidden md:block min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{vendorData?.name || 'Vendor'}</p>
                <p className="text-xs text-gray-400 truncate max-w-[160px]">{vendorData?.email || ''}</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;