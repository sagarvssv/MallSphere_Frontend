import React, { useMemo } from 'react';
import { 
  FaBarcode, 
  FaSearch, 
  FaFilter, 
  FaTimes, 
  FaSpinner, 
  FaSyncAlt,
  FaExclamationTriangle,
  FaFileInvoice,
  FaPlus,
  FaArrowLeft,
  FaArrowRight,
  FaCalendarAlt
} from 'react-icons/fa';

const LicensesTab = ({
  licenses,
  licensesLoading,
  licensesError,
  licenseFilters,
  setLicenseFilters,
  showLicenseFilters,
  setShowLicenseFilters,
  licenseSearchTerm,
  setLicenseSearchTerm,
  licenseItemsPerPage,
  setLicenseItemsPerPage,
  licenseCurrentPage,
  setLicenseCurrentPage,
  clearLicenseFilters,
  onRefresh,
  onAssignLicense,
  approvedStalls
}) => {
  // Filter Functions
  const filterLicenses = (licenses) => {
    if (!licenses) return [];
    
    return licenses.filter(license => {
      if (licenseFilters.status) {
        if (licenseFilters.status === 'used' && !license.isUsed) return false;
        if (licenseFilters.status === 'available' && license.isUsed) return false;
      }
      
      if (licenseFilters.category && license.category !== licenseFilters.category) {
        return false;
      }
      
      if (licenseFilters.expiryStatus) {
        const today = new Date();
        const expiryDate = new Date(license.expiresAt);
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
        
        switch(licenseFilters.expiryStatus) {
          case 'valid':
            if (expiryDate < today) return false;
            break;
          case 'expired':
            if (expiryDate >= today) return false;
            break;
          case 'expiringSoon':
            if (expiryDate < today || daysUntilExpiry > 30) return false;
            break;
          default:
            break;
        }
      }
      
      if (licenseFilters.dateRange) {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        switch(licenseFilters.dateRange) {
          case 'thisMonth':
            const expiryDate = new Date(license.expiresAt);
            if (expiryDate.getMonth() !== currentMonth || expiryDate.getFullYear() !== currentYear) {
              return false;
            }
            break;
          case 'nextMonth':
            const nextMonthExpiry = new Date(license.expiresAt);
            const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
            const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
            if (nextMonthExpiry.getMonth() !== nextMonth || nextMonthExpiry.getFullYear() !== nextMonthYear) {
              return false;
            }
            break;
          case 'lastMonth':
            if (license.isUsed) {
              const usedDate = new Date(license.usedAt);
              const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
              const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
              if (usedDate.getMonth() !== lastMonth || usedDate.getFullYear() !== lastMonthYear) {
                return false;
              }
            } else {
              return false;
            }
            break;
          default:
            break;
        }
      }
      
      if (licenseFilters.shopId) {
        const searchShopId = licenseFilters.shopId.toLowerCase();
        if (!license.usedForShopId?.toLowerCase().includes(searchShopId)) {
          return false;
        }
      }
      
      if (licenseSearchTerm) {
        const search = licenseSearchTerm.toLowerCase();
        return (
          license.category?.toLowerCase().includes(search) ||
          license.licenseId?.toLowerCase().includes(search) ||
          license.usedForShopId?.toLowerCase().includes(search)
        );
      }
      
      return true;
    });
  };

  const sortLicenses = (licenses) => {
    if (!licenses || !licenseFilters.sortBy) return licenses;
    
    return [...licenses].sort((a, b) => {
      switch(licenseFilters.sortBy) {
        case 'expiryAsc':
          return new Date(a.expiresAt) - new Date(b.expiresAt);
        case 'expiryDesc':
          return new Date(b.expiresAt) - new Date(a.expiresAt);
        case 'usedDateDesc':
          if (!a.usedAt) return 1;
          if (!b.usedAt) return -1;
          return new Date(b.usedAt) - new Date(a.usedAt);
        case 'categoryAsc':
          return (a.category || '').localeCompare(b.category || '');
        case 'categoryDesc':
          return (b.category || '').localeCompare(a.category || '');
        default:
          return 0;
      }
    });
  };

  const filteredLicenses = useMemo(() => {
    let filtered = filterLicenses(licenses);
    filtered = sortLicenses(filtered);
    return filtered;
  }, [licenses, licenseFilters, licenseSearchTerm]);

  const paginatedLicenses = useMemo(() => {
    const startIndex = (licenseCurrentPage - 1) * licenseItemsPerPage;
    return filteredLicenses.slice(startIndex, startIndex + licenseItemsPerPage);
  }, [filteredLicenses, licenseCurrentPage, licenseItemsPerPage]);

  const licenseTotalPages = Math.ceil(filteredLicenses.length / licenseItemsPerPage);

  if (licensesLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 text-center py-16">
        <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
          <FaSpinner className="animate-spin h-6 w-6 text-indigo-600" />
        </div>
        <p className="text-gray-500 text-sm font-medium">Loading your licenses...</p>
      </div>
    );
  }

  if (licensesError) {
    return (
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 text-center py-16">
        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaExclamationTriangle className="h-8 w-8 text-rose-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">Error Loading Licenses</h3>
        <p className="text-gray-500 text-sm mb-6">{licensesError}</p>
        <button
          onClick={onRefresh}
          className="px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium text-sm inline-flex items-center transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (filteredLicenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 text-center py-16">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FaFileInvoice className="h-8 w-8 text-indigo-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2">No Licenses Found</h3>
        <p className="text-gray-500 text-sm mb-6">
          {Object.keys(licenseFilters).length > 0 || licenseSearchTerm
            ? "No licenses match your filter criteria. Try adjusting your filters."
            : "You don't have any stall licenses yet."}
        </p>
        {(Object.keys(licenseFilters).length > 0 || licenseSearchTerm) && (
          <button
            onClick={clearLicenseFilters}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium text-sm transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
      <div className="px-6 py-5 bg-gradient-to-r from-indigo-50/70 via-white to-white border-b border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-wider uppercase text-indigo-500 mb-1">Vendor passes</p>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2.5">
              <span className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                <FaBarcode className="h-4 w-4" />
              </span>
              Your Stall Licenses
            </h2>
            <p className="text-sm text-gray-500 mt-1.5">
              {licenses.length} {licenses.length === 1 ? 'license' : 'licenses'} to manage and track
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
              <input
                type="text"
                placeholder="Search licenses..."
                value={licenseSearchTerm}
                onChange={(e) => setLicenseSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 w-full md:w-64 transition-all"
              />
            </div>
            
            <button
              onClick={() => setShowLicenseFilters(!showLicenseFilters)}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center transition-colors ${
                showLicenseFilters || Object.keys(licenseFilters).length > 0
                  ? 'bg-indigo-50 ring-1 ring-indigo-300 text-indigo-700'
                  : 'ring-1 ring-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FaFilter className="mr-2 h-3.5 w-3.5" />
              Filters
              {Object.keys(licenseFilters).length > 0 && (
                <span className="ml-2 bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {Object.keys(licenseFilters).length}
                </span>
              )}
            </button>
            
            {Object.keys(licenseFilters).length > 0 && (
              <button
                onClick={clearLicenseFilters}
                className="px-3 py-2.5 text-gray-500 hover:text-gray-800 font-medium text-sm flex items-center transition-colors"
              >
                <FaTimes className="mr-1.5 h-3.5 w-3.5" />
                Clear
              </button>
            )}
            
            <button
              onClick={onRefresh}
              className="px-4 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 ring-1 ring-gray-200 font-medium text-sm flex items-center transition-colors duration-200"
            >
              <FaSyncAlt className="h-3.5 w-3.5 mr-2" />
              Refresh
            </button>
          </div>
        </div>
        
        {showLicenseFilters && (
          <div className="mt-5 p-5 bg-gray-50/60 rounded-xl ring-1 ring-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-semibold tracking-wide uppercase text-gray-500 mb-2">Status</label>
                <select
                  value={licenseFilters.status || ''}
                  onChange={(e) => setLicenseFilters({...licenseFilters, status: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
                >
                  <option value="">All Statuses</option>
                  <option value="used">Used</option>
                  <option value="available">Available</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold tracking-wide uppercase text-gray-500 mb-2">Category</label>
                <select
                  value={licenseFilters.category || ''}
                  onChange={(e) => setLicenseFilters({...licenseFilters, category: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
                >
                  <option value="">All Categories</option>
                  {[...new Set(licenses.map(l => l.category))].map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold tracking-wide uppercase text-gray-500 mb-2">Expiry Status</label>
                <select
                  value={licenseFilters.expiryStatus || ''}
                  onChange={(e) => setLicenseFilters({...licenseFilters, expiryStatus: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
                >
                  <option value="">All</option>
                  <option value="valid">Valid (Not Expired)</option>
                  <option value="expired">Expired</option>
                  <option value="expiringSoon">Expiring Soon (30 days)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold tracking-wide uppercase text-gray-500 mb-2">Date Range</label>
                <select
                  value={licenseFilters.dateRange || ''}
                  onChange={(e) => setLicenseFilters({...licenseFilters, dateRange: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
                >
                  <option value="">All Dates</option>
                  <option value="thisMonth">Expires This Month</option>
                  <option value="nextMonth">Expires Next Month</option>
                  <option value="lastMonth">Used Last Month</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-[11px] font-semibold tracking-wide uppercase text-gray-500 mb-2">Sort By</label>
                <select
                  value={licenseFilters.sortBy || 'expiryAsc'}
                  onChange={(e) => setLicenseFilters({...licenseFilters, sortBy: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
                >
                  <option value="expiryAsc">Expiry Date (Earliest First)</option>
                  <option value="expiryDesc">Expiry Date (Latest First)</option>
                  <option value="usedDateDesc">Used Date (Newest First)</option>
                  <option value="categoryAsc">Category (A-Z)</option>
                  <option value="categoryDesc">Category (Z-A)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold tracking-wide uppercase text-gray-500 mb-2">Shop ID Search</label>
                <input
                  type="text"
                  placeholder="Search by shop ID..."
                  value={licenseFilters.shopId || ''}
                  onChange={(e) => setLicenseFilters({...licenseFilters, shopId: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold tracking-wide uppercase text-gray-500 mb-2">Items Per Page</label>
                <select
                  value={licenseItemsPerPage}
                  onChange={(e) => {
                    setLicenseItemsPerPage(Number(e.target.value));
                    setLicenseCurrentPage(1);
                  }}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400"
                >
                  <option value={6}>6 per page</option>
                  <option value={12}>12 per page</option>
                  <option value={24}>24 per page</option>
                  <option value={48}>48 per page</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-6">
        <div className="mb-5 text-xs font-medium text-gray-500">
          Showing <span className="text-gray-900 font-semibold">{paginatedLicenses.length}</span> of{' '}
          <span className="text-gray-900 font-semibold">{filteredLicenses.length}</span> licenses
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {paginatedLicenses.map((license) => {
            const isExpired = license.isUsed && license.expiresAt && new Date(license.expiresAt) < new Date();
            const isExpiringSoon = license.isUsed && license.expiresAt &&
              new Date(license.expiresAt) > new Date() &&
              (new Date(license.expiresAt) - new Date()) < 30 * 24 * 60 * 60 * 1000;

            return (
              <div
                key={license.licenseId}
                className="group flex flex-col rounded-2xl overflow-hidden ring-1 ring-gray-100 hover:shadow-lg transition-all duration-300"
              >
                {/* Pass header — signature membership-card treatment */}
                <div className="relative p-5 bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white overflow-hidden">
                  <div className="pointer-events-none absolute -left-10 top-0 h-full w-16 bg-white/10 -skew-x-12" />
                  <div className="relative flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-white/15 backdrop-blur-sm">
                        <FaBarcode className="h-4 w-4 text-amber-300" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm leading-tight">{license.category}</h3>
                        <p className="text-[11px] font-mono text-indigo-100 tracking-wide mt-0.5">{license.licenseId}</p>
                      </div>
                    </div>
                    <span className={`relative px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${
                      license.isUsed
                        ? 'bg-white/15 text-indigo-50 ring-1 ring-white/30'
                        : 'bg-amber-300 text-indigo-950'
                    }`}>
                      {license.isUsed ? 'Used' : 'Available'}
                    </span>
                  </div>
                </div>

                {/* Details body */}
                <div className="flex-1 flex flex-col p-5 bg-white">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold tracking-wide uppercase text-gray-400">Expires On</span>
                      <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                        <FaCalendarAlt className="h-3 w-3 text-gray-400" />
                        {license.isUsed && license.expiresAt
                          ? new Date(license.expiresAt).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })
                          : 'Not Used'}
                      </span>
                    </div>

                    {license.isUsed && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold tracking-wide uppercase text-gray-400">Used On</span>
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(license.usedAt).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold tracking-wide uppercase text-gray-400">Used For Shop</span>
                          <span className="text-sm font-semibold text-indigo-600 font-mono">
                            {license.usedForShopId}
                          </span>
                        </div>
                      </>
                    )}

                    {isExpired && (
                      <div className="flex items-center gap-2 p-2.5 bg-rose-50 rounded-lg ring-1 ring-rose-100">
                        <FaExclamationTriangle className="h-3 w-3 text-rose-500 shrink-0" />
                        <p className="text-xs font-semibold text-rose-600">License Expired</p>
                      </div>
                    )}

                    {isExpiringSoon && (
                      <div className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-lg ring-1 ring-amber-100">
                        <FaExclamationTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                        <p className="text-xs font-semibold text-amber-600">Expiring soon</p>
                      </div>
                    )}
                  </div>

                  {!license.isUsed && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => onAssignLicense(license)}
                        className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium text-sm flex items-center justify-center transition-colors shadow-sm shadow-indigo-600/20"
                      >
                        <FaPlus className="mr-2 h-3 w-3" />
                        Assign to Stall
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {licenseTotalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-500">
              Page <span className="text-gray-900 font-semibold">{licenseCurrentPage}</span> of{' '}
              <span className="text-gray-900 font-semibold">{licenseTotalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setLicenseCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={licenseCurrentPage === 1}
                className="p-2.5 ring-1 ring-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <FaArrowLeft className="h-3.5 w-3.5 text-gray-600" />
              </button>
              <button
                onClick={() => setLicenseCurrentPage(prev => Math.min(prev + 1, licenseTotalPages))}
                disabled={licenseCurrentPage === licenseTotalPages}
                className="p-2.5 ring-1 ring-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <FaArrowRight className="h-3.5 w-3.5 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LicensesTab;