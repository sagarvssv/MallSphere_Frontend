import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaStore,
  FaUserCircle,
  FaTachometerAlt,
  FaEdit,
  FaLock,
  FaSignOutAlt,
  FaChartPie,
} from 'react-icons/fa';

/**
 * Shared sidebar for the vendor area (Dashboard + Profile).
 *
 * activePage: 'dashboard' | 'profile'
 * activeProfileTab: only relevant when activePage === 'profile' — 'profile' | 'password'
 * onProfileTabChange: setter for activeProfileTab, only needed on the Profile page
 */
const VendorSidebar = ({
  vendorData,
  profilePreview,
  activePage = 'dashboard',
  activeProfileTab,
  onProfileTabChange,
  onLogout,
}) => {
  const name = vendorData?.name || 'Vendor';
  const email = vendorData?.email || '';

  const navItemClasses = (isActive) =>
    `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-semibold ${
      isActive
        ? 'bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white shadow-sm shadow-indigo-600/25'
        : 'text-gray-600 hover:bg-gray-50'
    }`;

  const linkItemClasses = (isActive) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-semibold ${
      isActive
        ? 'bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white shadow-sm shadow-indigo-600/25'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`;

  return (
    <div className="p-6">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-gradient-to-br from-[#4F46E5] to-[#6D28D9] p-2.5 rounded-xl shadow-sm">
          <FaStore className="h-5 w-5 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900">Vendor Panel</span>
      </div>

      {/* Vendor Info */}
      <div className="mb-6 p-4 bg-gradient-to-br from-[#1E1B4B] to-[#312E81] rounded-2xl relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-white/10 ring-2 ring-white/20 flex items-center justify-center shrink-0 overflow-hidden">
            {profilePreview ? (
              <img src={profilePreview} alt="Profile" className="w-full h-full rounded-full object-cover" />
            ) : (
              <FaUserCircle className="w-7 h-7 text-indigo-200" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{name}</p>
            <p className="text-xs text-indigo-300 truncate">{email}</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="space-y-1.5">
        <Link
          to="/vendor/dashboard"
          className={linkItemClasses(activePage === 'dashboard')}
        >
          <FaTachometerAlt className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>

        {activePage === 'profile' ? (
          <>
            <button
              onClick={() => onProfileTabChange?.('profile')}
              className={navItemClasses(activeProfileTab === 'profile')}
            >
              <FaEdit className="h-4 w-4" />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={() => onProfileTabChange?.('password')}
              className={navItemClasses(activeProfileTab === 'password')}
            >
              <FaLock className="h-4 w-4" />
              <span>Change Password</span>
            </button>
          </>
        ) : (
          <Link
            to="/vendor/profile"
            className={linkItemClasses(false)}
          >
            <FaEdit className="h-4 w-4" />
            <span>Edit Profile</span>
          </Link>
        )}

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-rose-600 rounded-xl hover:bg-rose-50 transition-colors text-sm font-semibold"
        >
          <FaSignOutAlt className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
};

export default VendorSidebar;