import React, { useState, useEffect } from 'react';
import { 
  FaHourglassHalf, 
  FaSearch, 
  FaSpinner, 
  FaEye, 
  FaThumbsUp, 
  FaThumbsDown,
  FaStore,
  FaSyncAlt,
  FaChevronUp,
  FaMapMarkerAlt,
  FaFileAlt
} from 'react-icons/fa';
import StatusBadge from '../../../common/StatusBadge';
import Pagination from '../../../common/Pagination';

const PendingStallsTab = ({
  pendingStalls,
  actionLoading,
  searchTerm,
  setSearchTerm,
  pagination,
  onPageChange,
  onViewDetails,
  onApprove,
  onReject,
  getFilteredStalls,
  getPaginatedItems,
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

  if (actionLoading.pending) {
    return (
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 text-center py-16">
        <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
          <FaSpinner className="animate-spin h-6 w-6 text-indigo-600" />
        </div>
        <p className="text-gray-500 text-sm font-medium">Loading pending stalls...</p>
      </div>
    );
  }

  const filteredStalls = getFilteredStalls(pendingStalls);
  const paginatedStalls = getPaginatedItems(filteredStalls, pagination.page, pagination.limit);

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
      {/* Fixed Header with Refresh Button */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="px-6 py-5 bg-gradient-to-r from-amber-50/70 via-white to-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-amber-500 mb-1">Action needed</p>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-amber-100 text-amber-600">
                  <FaHourglassHalf className="h-4 w-4" />
                </span>
                Pending Stalls
              </h2>
              <p className="text-sm text-gray-500 mt-1.5">
                {pendingStalls.length} {pendingStalls.length === 1 ? 'stall' : 'stalls'} awaiting your approval
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
            <span className="text-gray-900 font-semibold">{filteredStalls.length}</span> pending stalls
          </div>
          <div className="text-xs text-gray-400 tabular-nums">
            Updated {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6">
        {pendingStalls.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaHourglassHalf className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">All caught up</h3>
            <p className="text-gray-500 text-sm mb-6">Every stall has been processed. Nothing waiting on you right now.</p>
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
                return (
                  <div
                    key={id}
                    className="group border border-gray-100 rounded-2xl p-5 hover:border-amber-200 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 shrink-0 group-hover:bg-amber-100 transition-colors">
                            <FaStore className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center flex-wrap gap-2 mb-3">
                              <h3 className="text-base font-bold text-gray-900 truncate">{stall.shopName || 'Unnamed Stall'}</h3>
                              <StatusBadge status={stall.approvalStatus || 'pending'} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
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
                                <p className="text-[11px] font-semibold tracking-wide uppercase text-gray-400 mb-0.5">Status</p>
                                <p className={`text-sm font-semibold flex items-center gap-1.5 ${stall.isActive ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${stall.isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                  {stall.isActive ? 'Active' : 'Inactive'}
                                </p>
                              </div>
                            </div>

                            {stall.documents && stall.documents.length > 0 && (
                              <div>
                                <p className="text-[11px] font-semibold tracking-wide uppercase text-gray-400 mb-2">Documents</p>
                                <div className="flex flex-wrap gap-2">
                                  {stall.documents.map((doc, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 ring-1 ring-gray-200 rounded-lg text-xs font-medium text-gray-600"
                                    >
                                      <FaFileAlt className="h-3 w-3 text-gray-400" />
                                      {typeof doc === 'string' ? doc : doc.name || 'Document'}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2.5 lg:flex-col lg:w-40 shrink-0">
                        <button
                          onClick={() => onViewDetails(id)}
                          disabled={actionLoading[id] === 'loading'}
                          className="flex-1 lg:flex-none px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 font-medium text-sm flex items-center justify-center transition-colors duration-200 disabled:opacity-60"
                        >
                          {actionLoading[id] === 'loading' ? (
                            <FaSpinner className="animate-spin h-3.5 w-3.5 mr-2" />
                          ) : (
                            <FaEye className="h-3.5 w-3.5 mr-2" />
                          )}
                          View Details
                        </button>
                        <button
                          onClick={() => onApprove(stall.shopId || stall._id)}
                          disabled={actionLoading[stall.shopId || stall._id] === 'approving'}
                          className="flex-1 lg:flex-none px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium text-sm flex items-center justify-center transition-colors duration-200 disabled:opacity-60 shadow-sm shadow-emerald-600/20"
                        >
                          {actionLoading[stall.shopId || stall._id] === 'approving' ? (
                            <FaSpinner className="animate-spin h-3.5 w-3.5 mr-2" />
                          ) : (
                            <FaThumbsUp className="h-3.5 w-3.5 mr-2" />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => onReject(stall)}
                          disabled={actionLoading[stall.shopId || stall._id] === 'rejecting'}
                          className="flex-1 lg:flex-none px-4 py-2.5 bg-white text-rose-600 rounded-xl hover:bg-rose-50 ring-1 ring-rose-200 font-medium text-sm flex items-center justify-center transition-colors duration-200 disabled:opacity-60"
                        >
                          {actionLoading[stall.shopId || stall._id] === 'rejecting' ? (
                            <FaSpinner className="animate-spin h-3.5 w-3.5 mr-2" />
                          ) : (
                            <FaThumbsDown className="h-3.5 w-3.5 mr-2" />
                          )}
                          Reject
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

export default PendingStallsTab;