import React, { useState, useEffect } from 'react';
import { 
  FaStore, 
  FaSearch, 
  FaEye,
  FaSyncAlt,
  FaSpinner,
  FaChevronUp,
  FaMapMarkerAlt,
  FaExclamationCircle
} from 'react-icons/fa';
import Pagination from '../../../common/Pagination';
import StatusBadge from '../../../common/StatusBadge';

const statusStyles = {
  approved: {
    iconBg: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100',
    border: 'hover:border-emerald-200',
    dot: 'bg-emerald-500',
  },
  rejected: {
    iconBg: 'bg-rose-50 text-rose-600 group-hover:bg-rose-100',
    border: 'hover:border-rose-200',
    dot: 'bg-rose-400',
  },
  pending: {
    iconBg: 'bg-amber-50 text-amber-600 group-hover:bg-amber-100',
    border: 'hover:border-amber-200',
    dot: 'bg-amber-500',
  },
};

const getStatusKey = (stall) => {
  const s = stall.status || stall.approvalStatus || 'pending';
  return statusStyles[s] ? s : 'pending';
};

const AllStallsTab = ({
  allStalls,
  searchTerm,
  setSearchTerm,
  pagination,
  onPageChange,
  onViewDetails,
  getFilteredStalls,
  getPaginatedItems,
  onRefresh,
  actionLoading = {}
}) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

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

  const filteredStalls = getFilteredStalls(allStalls);
  const paginatedStalls = getPaginatedItems(filteredStalls, pagination.page, pagination.limit);

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
      {/* Fixed Header with Refresh Button */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-50/70 via-white to-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-indigo-500 mb-1">Full directory</p>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                  <FaStore className="h-4 w-4" />
                </span>
                All Your Stalls
              </h2>
              <p className="text-sm text-gray-500 mt-1.5">
                {allStalls.length} {allStalls.length === 1 ? 'stall' : 'stalls'} registered across every status
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
            <span className="text-gray-900 font-semibold">{filteredStalls.length}</span> stalls
          </div>
          <div className="text-xs text-gray-400 tabular-nums">
            Updated {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {allStalls.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaStore className="h-8 w-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Stalls Found</h3>
            <p className="text-gray-500 text-sm mb-6">You don't have any stalls registered yet.</p>
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
            <div className="space-y-4">
              {paginatedStalls.map((stall) => {
                const id = stall._id || stall.shopId;
                const statusKey = getStatusKey(stall);
                const styles = statusStyles[statusKey];
                return (
                  <div
                    key={id}
                    className={`group border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all duration-300 ${styles.border}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl shrink-0 transition-colors ${styles.iconBg}`}>
                            <FaStore className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2 mb-3">
                              <h3 className="text-base font-bold text-gray-900 truncate">{stall.shopName || 'Unnamed Stall'}</h3>
                              <StatusBadge status={statusKey} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                              <div>
                                <p className="text-[11px] font-semibold tracking-wide uppercase text-gray-400 mb-0.5">Shop ID</p>
                                <p className="font-mono text-sm text-gray-900">{stall.shopId || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold tracking-wide uppercase text-gray-400 mb-0.5">Location</p>
                                <p className="text-sm text-gray-900 flex items-center gap-1.5">
                                  <FaMapMarkerAlt className="h-3 w-3 text-gray-400 shrink-0" />
                                  {stall.location || 'Not specified'}
                                </p>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold tracking-wide uppercase text-gray-400 mb-0.5">Active</p>
                                <p className={`text-sm font-semibold flex items-center gap-1.5 ${stall.isActive ? 'text-emerald-600' : 'text-gray-500'}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${stall.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                  {stall.isActive ? 'Yes' : 'No'}
                                </p>
                              </div>
                            </div>

                            {stall.rejectedReason && (
                              <div className="mt-3 flex items-start gap-2 p-3 bg-rose-50 rounded-lg ring-1 ring-rose-100">
                                <FaExclamationCircle className="h-3.5 w-3.5 text-rose-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-rose-600">
                                  <span className="font-semibold">Reason:</span> {stall.rejectedReason}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 md:ml-4 shrink-0">
                        <button
                          onClick={() => onViewDetails(id)}
                          disabled={actionLoading[id] === 'loading'}
                          className="px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 font-medium text-sm flex items-center transition-colors duration-200 disabled:opacity-60"
                        >
                          {actionLoading[id] === 'loading' ? (
                            <FaSpinner className="animate-spin h-3.5 w-3.5 mr-2" />
                          ) : (
                            <FaEye className="h-3.5 w-3.5 mr-2" />
                          )}
                          Details
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

export default AllStallsTab;