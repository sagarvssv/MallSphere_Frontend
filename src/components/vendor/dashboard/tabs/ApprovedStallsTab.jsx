import React, { useState, useEffect } from 'react';
import { 
  FaCheckCircle, 
  FaSearch, 
  FaSpinner, 
  FaEye, 
  FaStore,
  FaMapMarkerAlt,
  FaSyncAlt,
  FaChevronUp
} from 'react-icons/fa';
import StatusBadge from '../../../common/StatusBadge';
import Pagination from '../../../common/Pagination';

const ApprovedStallsTab = ({
  approvedStalls,
  actionLoading,
  searchTerm,
  setSearchTerm,
  pagination,
  onPageChange,
  onViewDetails,
  getFilteredStalls,
  getPaginatedItems,
  getRatingStars,
  onRefresh
}) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (actionLoading.approved) {
    return (
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 text-center py-16">
        <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
          <FaSpinner className="animate-spin h-6 w-6 text-indigo-600" />
        </div>
        <p className="text-gray-500 text-sm font-medium">Loading approved stalls...</p>
      </div>
    );
  }

  const filteredStalls = getFilteredStalls(approvedStalls);
  const paginatedStalls = getPaginatedItems(filteredStalls, pagination.page, pagination.limit);

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
      {/* Fixed Header with Refresh Button */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-50/70 via-white to-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-emerald-500 mb-1">Live on the floor</p>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                  <FaCheckCircle className="h-4 w-4" />
                </span>
                Approved Stalls
              </h2>
              <p className="text-sm text-gray-500 mt-1.5">
                {approvedStalls.length} {approvedStalls.length === 1 ? 'stall' : 'stalls'} active in your portfolio
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                <input
                  type="text"
                  placeholder="Search stalls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 w-full md:w-64 transition-all"
                />
              </div>

              <button
                onClick={onRefresh}
                disabled={actionLoading.refreshing}
                className="px-4 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 ring-1 ring-gray-200 font-medium text-sm flex items-center whitespace-nowrap transition-colors duration-200 disabled:opacity-60"
              >
                {actionLoading.refreshing ? (
                  <>
                    <FaSpinner className="animate-spin h-3.5 w-3.5 mr-2" />
                    Refreshing
                  </>
                ) : (
                  <>
                    <FaSyncAlt className="h-3.5 w-3.5 mr-2" />
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-6 py-2.5 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs font-medium text-gray-500">
            Showing <span className="text-gray-900 font-semibold">{paginatedStalls.length}</span> of{' '}
            <span className="text-gray-900 font-semibold">{filteredStalls.length}</span> approved stalls
          </div>
          <div className="text-xs text-gray-400 tabular-nums">
            Updated {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {approvedStalls.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCheckCircle className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Approved Stalls Yet</h3>
            <p className="text-gray-500 text-sm mb-6">Once a stall is approved, it'll show up here.</p>
            <button
              onClick={onRefresh}
              disabled={actionLoading.refreshing}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium text-sm inline-flex items-center transition-colors disabled:opacity-60"
            >
              {actionLoading.refreshing ? (
                <FaSpinner className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <FaSyncAlt className="h-4 w-4 mr-2" />
              )}
              Refresh
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {paginatedStalls.map((stall) => {
                const id = stall._id || stall.shopId;
                return (
                  <div
                    key={id}
                    className="group relative border border-gray-100 rounded-2xl p-5 hover:border-emerald-200 hover:shadow-md transition-all duration-300 overflow-hidden"
                  >
                    {/* corner accent */}
                    <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <div className="relative flex items-start justify-between mb-4">
                      <div className="flex items-center min-w-0">
                        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 mr-4 shrink-0 group-hover:bg-emerald-100 transition-colors">
                          <FaStore className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">{stall.shopName || 'Unnamed Stall'}</h3>
                          <p className="text-xs font-mono text-gray-500">{stall.shopId}</p>
                        </div>
                      </div>
                      <StatusBadge status="approved" />
                    </div>

                    <div className="relative space-y-3">
                      <div className="flex items-center text-sm">
                        <FaMapMarkerAlt className="h-3.5 w-3.5 text-gray-400 mr-2 shrink-0" />
                        <span className="text-gray-600 truncate">{stall.location || 'Location not specified'}</span>
                      </div>

                      {stall.rating && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center text-amber-400">
                            {getRatingStars(stall.rating)}
                          </div>
                          <span className="text-sm font-semibold text-gray-700 tabular-nums">{stall.rating}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 text-sm">
                          <span className={`h-1.5 w-1.5 rounded-full ${stall.isActive ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                          <span className="text-gray-500">Active:</span>
                          <span className={`font-semibold ${stall.isActive ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {stall.isActive ? 'Yes' : 'No'}
                          </span>
                        </div>
                        <button
                          onClick={() => onViewDetails(id)}
                          disabled={actionLoading[id] === 'loading'}
                          className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 font-medium text-sm flex items-center transition-colors duration-200 disabled:opacity-60"
                        >
                          {actionLoading[id] === 'loading' ? (
                            <FaSpinner className="animate-spin h-3.5 w-3.5 mr-2" />
                          ) : (
                            <FaEye className="h-3.5 w-3.5 mr-2" />
                          )}
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredStalls.length > pagination.limit && (
              <div className="mt-6">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  onPageChange={onPageChange}
                  totalItems={filteredStalls.length}
                  pageSize={pagination.limit}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-indigo-600 text-white p-3.5 rounded-full shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all duration-300 z-50"
          aria-label="Scroll to top"
        >
          <FaChevronUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default ApprovedStallsTab;