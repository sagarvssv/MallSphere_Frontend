import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaHourglassHalf,
  FaCheckCircle,
  FaTimesCircle,
  FaStore,
  FaBarcode,
  FaEdit,
  FaSignOutAlt,
  FaArrowRight
} from 'react-icons/fa';

const OverviewTab = ({
  pendingStalls,
  approvedStalls,
  rejectedStalls,
  licenses,
  vendorData,
  onTabChange,
  getPaginatedItems,
  onLogout
}) => {
  const availableLicenses = licenses.filter(l => !l.isUsed).length;
  const usedLicenses = licenses.filter(l => l.isUsed).length;
  const expiringSoon = licenses.filter(l => !l.isUsed && new Date(l.expiresAt) > new Date() &&
    (new Date(l.expiresAt) - new Date()) < 30 * 24 * 60 * 60 * 1000).length;

  const statCards = [
    {
      key: 'pending',
      label: 'Pending Approval',
      value: pendingStalls.length,
      icon: FaHourglassHalf,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      ring: 'group-hover:ring-amber-200',
    },
    {
      key: 'approved',
      label: 'Approved',
      value: approvedStalls.length,
      icon: FaCheckCircle,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      ring: 'group-hover:ring-emerald-200',
    },
    {
      key: 'rejected',
      label: 'Rejected',
      value: rejectedStalls.length,
      icon: FaTimesCircle,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      ring: 'group-hover:ring-rose-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column */}
      <div className="lg:col-span-2 space-y-8">

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map(({ key, label, value, icon: Icon, iconBg, iconColor, ring }) => (
            <div
              key={key}
              className={`group relative bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 hover:shadow-lg hover:-translate-y-0.5 ${ring} transition-all duration-300 p-6 overflow-hidden`}
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center">
                <div className={`p-3 rounded-xl ${iconBg} ${iconColor} mr-4 shadow-sm`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold tracking-wider uppercase text-gray-400">{label}</p>
                  <p className="text-3xl font-bold text-gray-900 tabular-nums tracking-tight">{value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Pending Stalls */}
        {pendingStalls.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[11px] font-semibold tracking-wider uppercase text-amber-500 mb-1">Awaiting review</p>
                <h3 className="text-lg font-bold text-gray-900">Recent Pending Stalls</h3>
              </div>
              <button
                onClick={() => onTabChange('pending')}
                className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-semibold text-sm transition-colors"
              >
                View All <FaArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-3">
              {getPaginatedItems(pendingStalls, 1, 3).map((stall) => (
                <div
                  key={stall._id || stall.shopId}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-indigo-50/40 rounded-xl border border-transparent hover:border-indigo-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white shadow-sm text-indigo-500">
                      <FaStore className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{stall.shopName || 'Unnamed Stall'}</div>
                      <div className="text-xs text-gray-500 font-mono">{stall.shopId}</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 ring-1 ring-amber-200 rounded-full text-xs font-semibold">
                    Pending
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Approved Stalls */}
        {approvedStalls.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[11px] font-semibold tracking-wider uppercase text-emerald-500 mb-1">Live on the floor</p>
                <h3 className="text-lg font-bold text-gray-900">Recent Approved Stalls</h3>
              </div>
              <button
                onClick={() => onTabChange('approved')}
                className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-semibold text-sm transition-colors"
              >
                View All <FaArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-3">
              {getPaginatedItems(approvedStalls, 1, 3).map((stall) => (
                <div
                  key={stall._id || stall.shopId}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-indigo-50/40 rounded-xl border border-transparent hover:border-indigo-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white shadow-sm text-indigo-500">
                      <FaStore className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{stall.shopName || 'Unnamed Stall'}</div>
                      <div className="text-xs text-gray-500 font-mono">{stall.shopId}</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 rounded-full text-xs font-semibold">
                    Approved
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Licenses — signature "membership card" treatment */}
        {licenses.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <p className="text-[11px] font-semibold tracking-wider uppercase text-indigo-500 mb-1">Vendor passes</p>
                <h3 className="text-lg font-bold text-gray-900">Recent Licenses</h3>
              </div>
              <button
                onClick={() => onTabChange('licenses')}
                className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-semibold text-sm transition-colors"
              >
                View All <FaArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-3">
              {getPaginatedItems(licenses, 1, 3).map((license) => (
                <div
                  key={license.licenseId}
                  className="relative flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white overflow-hidden shadow-md"
                >
                  {/* sheen */}
                  <div className="pointer-events-none absolute -left-10 top-0 h-full w-16 bg-white/10 -skew-x-12" />
                  {/* perforation divider */}
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 rounded-lg bg-white/15 backdrop-blur-sm">
                      <FaBarcode className="h-4 w-4 text-amber-300" />
                    </div>
                    <div className="border-l border-dashed border-white/30 pl-4">
                      <div className="font-semibold text-sm">{license.category}</div>
                      <div className="text-[11px] font-mono text-indigo-100 tracking-wide">{license.licenseId}</div>
                    </div>
                  </div>
                  <span className={`relative px-3 py-1 rounded-full text-xs font-semibold ${
                    license.isUsed
                      ? 'bg-white/15 text-indigo-50 ring-1 ring-white/30'
                      : 'bg-amber-300 text-indigo-950'
                  }`}>
                    {license.isUsed ? 'Used' : 'Available'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar */}
      <div className="space-y-8">

        {/* Quick Actions Card */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
          <h3 className="text-[11px] font-semibold tracking-wider uppercase text-gray-400 mb-1">Manage</h3>
          <p className="text-lg font-bold text-gray-900 mb-5">Quick Actions</p>
          <div className="space-y-2.5">
            <Link
              to="/vendor/profile"
              className="group w-full flex items-center p-3 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-all"
            >
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 mr-3 group-hover:scale-105 transition-transform">
                <FaEdit className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm">Update Profile</div>
                <div className="text-xs text-gray-500">Edit your information</div>
              </div>
            </Link>

            {pendingStalls.length > 0 && (
              <button
                onClick={() => onTabChange('pending')}
                className="group w-full flex items-center p-3 text-left rounded-xl border border-gray-100 hover:border-amber-200 hover:bg-amber-50/40 transition-all"
              >
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600 mr-3 group-hover:scale-105 transition-transform">
                  <FaHourglassHalf className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Review Pending</div>
                  <div className="text-xs text-gray-500">{pendingStalls.length} stalls waiting</div>
                </div>
              </button>
            )}

            {availableLicenses > 0 && (
              <button
                onClick={() => onTabChange('licenses')}
                className="group w-full flex items-center p-3 text-left rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/40 transition-all"
              >
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600 mr-3 group-hover:scale-105 transition-transform">
                  <FaBarcode className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">Available Licenses</div>
                  <div className="text-xs text-gray-500">{availableLicenses} ready to use</div>
                </div>
              </button>
            )}

            <button
              onClick={onLogout}
              className="group w-full flex items-center p-3 text-left rounded-xl border border-rose-100 hover:border-rose-300 hover:bg-rose-50/50 transition-all"
            >
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 mr-3 group-hover:scale-105 transition-transform">
                <FaSignOutAlt className="h-4 w-4" />
              </div>
              <div>
                <div className="font-semibold text-rose-700 text-sm">Logout</div>
                <div className="text-xs text-rose-500">Sign out from dashboard</div>
              </div>
            </button>
          </div>
        </div>

        {/* Vendor Info Card */}
        <div className="relative bg-gradient-to-br from-[#1E1B4B] to-[#312E81] rounded-2xl shadow-lg p-6 text-white overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/5" />
          <h3 className="text-[11px] font-semibold tracking-wider uppercase text-indigo-300 mb-4">Vendor Information</h3>
          <div className="relative space-y-4">
            <div>
              <p className="text-[11px] text-indigo-300">Name</p>
              <p className="font-semibold text-white">{vendorData?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[11px] text-indigo-300">Email</p>
              <p className="font-semibold text-white text-sm break-all">{vendorData?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[11px] text-indigo-300">Phone</p>
              <p className="font-semibold text-white">{vendorData?.Phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[11px] text-indigo-300">Mall Name</p>
              <p className="font-semibold text-white">{vendorData?.mallName || 'N/A'}</p>
            </div>
            <div className="pt-3 border-t border-white/10">
              <p className="text-[11px] text-indigo-300">Address</p>
              <p className="font-medium text-indigo-100 text-sm">{vendorData?.Address || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* License Summary Card */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6">
          <h3 className="text-[11px] font-semibold tracking-wider uppercase text-gray-400 mb-1">Overview</h3>
          <p className="text-lg font-bold text-gray-900 mb-5">License Summary</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-500">Total Licenses</span>
              <span className="font-bold text-gray-900 tabular-nums">{licenses.length}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-500">Available</span>
              <span className="font-bold text-emerald-600 tabular-nums">{availableLicenses}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-gray-500">Used</span>
              <span className="font-bold text-indigo-600 tabular-nums">{usedLicenses}</span>
            </div>
            <div className="flex justify-between items-center pt-3 mt-1 border-t border-gray-100">
              <span className="text-sm text-gray-500">Expiring Soon</span>
              <span className={`font-bold tabular-nums ${expiringSoon > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                {expiringSoon}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;