// components/tabs/ApplicationsTab.jsx
import React, { useState, useEffect } from 'react';
import { Filter, Download, Clock, MapPin, CheckCircle, XCircle, Eye, Loader2, RefreshCw, AlertCircle, Building, Phone, Mail, Calendar, FileText, Store, User, Shield, FileCheck, X } from 'lucide-react';
import { superAdminAuth } from '../../hooks/superAdminAuth';

const ApplicationsTab = () => {
  const [allVendors, setAllVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all vendors using superAdminAuth module
  const fetchAllVendors = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('🔄 Fetching all vendors using superAdminAuth...');
      
      // Use the superAdminAuth module to fetch all vendors
      const response = await superAdminAuth.getAllVendors();
      
      console.log('All vendors response:', response);
      
      if (response.success) {
        // Process the vendor data
        let vendors = [];
        
        // Handle different possible response formats
        if (Array.isArray(response.vendors)) {
          vendors = response.vendors;
        } else if (Array.isArray(response.data)) {
          vendors = response.data;
        } else if (response.data && Array.isArray(response.data.vendors)) {
          vendors = response.data.vendors;
        } else if (Array.isArray(response)) {
          vendors = response;
        }
        
        // Transform API data to match our component structure
        const transformedVendors = vendors.map(vendor => ({
          id: vendor.vendorId || vendor._id,
          name: vendor.name || vendor.vendorName || 'N/A',
          email: vendor.email || vendor.vendorEmail || 'N/A',
          phone: vendor.phone || vendor.phoneNumber || vendor.mobile || 'N/A',
          businessName: vendor.shopName || vendor.businessName || vendor.companyName || 'N/A',
          businessType: vendor.businessType || vendor.category || 'General',
          address: vendor.address || vendor.shopAddress || vendor.location || 'N/A',
          city: vendor.city || 'N/A',
          state: vendor.state || 'N/A',
          pincode: vendor.pincode || vendor.postalCode || 'N/A',
          gstNumber: vendor.gstNumber || vendor.gst || 'Not Provided',
          aadharNumber: vendor.aadharNumber || vendor.aadhar || 'Not Provided',
          panNumber: vendor.panNumber || vendor.pan || 'Not Provided',
          licenseNumber: vendor.vendorLicenseNumber || vendor.licenseNumber || 'Not Provided',
          shopFloors: vendor.vendorShopNumberOfFloors || vendor.shopFloors || 0,
          shopStalls: vendor.vendorShopNumberOfStalls || vendor.shopStalls || 0,
          openingTime: vendor.vendorShopOpeningTime || vendor.openingTime || 'N/A',
          closingTime: vendor.vendorShopClosingTime || vendor.closingTime || 'N/A',
          description: vendor.vendorShopDescription || vendor.description || 'N/A',
          status: vendor.vendorAdminApproval || vendor.status || vendor.approvalStatus || 'pending',
          createdAt: vendor.createdAt ? new Date(vendor.createdAt) : new Date(),
          updatedAt: vendor.updatedAt ? new Date(vendor.updatedAt) : new Date(),
          documents: vendor.documents || [],
          profileImage: vendor.profile || vendor.profileImage || vendor.vendorProfileImage || null,
          shopImages: vendor.vendorShopImages || vendor.shopImages || [],
          isActive: vendor.isActive !== false,
          shopCount: vendor.shopCount || 0,
          estimatedRevenue: vendor.estimatedRevenue || 0,
          registrationDate: vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : 'N/A'
        }));
        
        setAllVendors(transformedVendors);
        setFilteredVendors(transformedVendors);
        
        // Calculate stats
        const total = transformedVendors.length;
        const pending = transformedVendors.filter(v => v.status === 'pending').length;
        const approved = transformedVendors.filter(v => v.status === 'approved').length;
        const rejected = transformedVendors.filter(v => v.status === 'rejected').length;
        
        setStats({
          total,
          pending,
          approved,
          rejected
        });
        
        console.log(`✅ Loaded ${transformedVendors.length} vendors`);
        console.log(`📊 Stats: ${pending} pending, ${approved} approved, ${rejected} rejected`);
        
        if (transformedVendors.length === 0) {
          setSuccess('No vendor applications found.');
        }
      } else if (response.message === 'No vendors found') {
        setAllVendors([]);
        setFilteredVendors([]);
        setSuccess('No vendor applications found.');
      } else {
        throw new Error(response.message || 'Failed to fetch vendors');
      }
    } catch (err) {
      console.error('❌ Error fetching vendors:', err);
      
      // Handle specific error types
      if (err.message.includes('Session expired') || 
          err.message.includes('401') || 
          err.message.includes('Unauthorized') ||
          err.message.includes('Not authenticated')) {
        setError('Session expired. Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/superadmin/login';
        }, 2000);
      } else if (err.message.includes('timeout') || err.name === 'AbortError') {
        setError('Request timeout. Please try again.');
      } else if (err.message.includes('Network error') || err.name === 'TypeError') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.message || 'Failed to load vendor applications');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAllVendors();
  }, []);

  // Apply filters whenever statusFilter, searchTerm, or allVendors changes
  useEffect(() => {
    let filtered = [...allVendors];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(vendor => vendor.status === statusFilter);
    }
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(vendor => 
        vendor.businessName?.toLowerCase().includes(term) ||
        vendor.name?.toLowerCase().includes(term) ||
        vendor.email?.toLowerCase().includes(term) ||
        vendor.phone?.toLowerCase().includes(term) ||
        vendor.city?.toLowerCase().includes(term) ||
        vendor.businessType?.toLowerCase().includes(term)
      );
    }
    
    setFilteredVendors(filtered);
  }, [statusFilter, searchTerm, allVendors]);

  const handleApproveVendor = async (vendorId) => {
    setApprovingId(vendorId);
    setError('');
    setSuccess('');

    try {
      console.log('✅ Approving vendor:', vendorId);
      const response = await superAdminAuth.approveVendor(vendorId);
      console.log('Approve response:', response);

      if (response.success) {
        // Update local state
        setAllVendors(prev => prev.map(vendor =>
          vendor.id === vendorId
            ? { ...vendor, status: 'approved', updatedAt: new Date() }
            : vendor
        ));
        setStats(prev => ({
          total: prev.total,
          pending: prev.pending - 1,
          approved: prev.approved + 1,
          rejected: prev.rejected
        }));
        setSuccess('✅ Vendor approved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error(response.message || 'Failed to approve vendor');
      }
    } catch (err) {
      console.error('Error approving vendor:', err);

      // 1. Handle session expiry / auth errors
      if (
        err.message.includes('Session expired') ||
        err.message.includes('401') ||
        err.message.includes('Unauthorized')
      ) {
        setError('Session expired. Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/superadmin/login';
        }, 2000);
      }
      // 2. Handle 500 / Server Error – the vendor may have been approved anyway
      else if (err.message.includes('Server Error') || err.message.includes('500')) {
        // Refresh all vendors to get the latest status
        try {
          await fetchAllVendors(); // This will reload allVendors and stats
          // Check if the vendor's status is now approved after refresh
          // (We can't directly check the updated state, but we can trust the refresh)
          setSuccess('Vendor may have been approved – list updated. Please verify.');
          setTimeout(() => setSuccess(''), 5000);
        } catch (refreshErr) {
          setError('Approval failed and unable to refresh list. Please try again.');
        }
      }
      // 3. Handle "already approved" (400)
      else if (err.message.includes('already approved') || err.message.includes('400')) {
        // Refresh list to reflect the already-approved status
        await fetchAllVendors();
        setSuccess('Vendor was already approved.');
        setTimeout(() => setSuccess(''), 3000);
      }
      // 4. Any other error
      else {
        setError(err.message || 'Failed to approve vendor');
      }
    } finally {
      setApprovingId(null);
    }
  };

  // Handle reject vendor using superAdminAuth
  const handleRejectVendor = async (vendorId, reason) => {
    setRejectingId(vendorId);
    setError('');
    setSuccess('');
    
    try {
      console.log('❌ Rejecting vendor:', vendorId);
      
      const response = await superAdminAuth.rejectVendor(vendorId, reason);
      
      console.log('Reject response:', response);
      
      if (response.success) {
        // Update vendor status in the local state
        setAllVendors(prev => prev.map(vendor => 
          vendor.id === vendorId 
            ? { ...vendor, status: 'rejected', updatedAt: new Date() }
            : vendor
        ));
        
        // Update stats
        setStats(prev => ({
          total: prev.total,
          pending: prev.pending - 1,
          approved: prev.approved,
          rejected: prev.rejected + 1
        }));
        
        setSuccess('✅ Vendor rejected successfully!');
        setTimeout(() => setSuccess(''), 3000);
        
        // Close modal and reset
        setShowRejectModal(false);
        setRejectReason('');
        setSelectedVendor(null);
      } else {
        throw new Error(response.message || 'Failed to reject vendor');
      }
    } catch (err) {
      console.error('Error rejecting vendor:', err);
      
      // Handle session expiration
      if (err.message.includes('Session expired') || 
          err.message.includes('401') || 
          err.message.includes('Unauthorized')) {
        setError('Session expired. Redirecting to login...');
        setTimeout(() => {
          window.location.href = '/superadmin/login';
        }, 2000);
      } else {
        setError(err.message || 'Failed to reject vendor');
      }
    } finally {
      setRejectingId(null);
    }
  };

  // Show vendor details
  const showVendorDetails = (vendor) => {
    setSelectedVendor(vendor);
    setShowDetailsModal(true);
  };

  // Open reject modal
  const openRejectModal = (vendor) => {
    setSelectedVendor(vendor);
    setShowRejectModal(true);
  };

  // Format date nicely
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time
  const formatTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get business type color
  const getBusinessTypeColor = (type) => {
    const colors = {
      'Retail': 'bg-blue-500/10 text-blue-400',
      'Food': 'bg-amber-500/10 text-amber-400',
      'Entertainment': 'bg-purple-500/10 text-purple-400',
      'Services': 'bg-emerald-500/10 text-emerald-400',
      'Fashion': 'bg-pink-500/10 text-pink-400',
      'Electronics': 'bg-cyan-500/10 text-cyan-400',
      'General': 'bg-slate-500/10 text-slate-400'
    };
    return colors[type] || colors['General'];
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return 'bg-amber-500/10 text-amber-400';
      case 'approved':
        return 'bg-emerald-500/10 text-emerald-400';
      case 'rejected':
        return 'bg-red-500/10 text-red-400';
      default:
        return 'bg-slate-500/10 text-slate-400';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch(status) {
      case 'pending':
        return 'Pending Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  // Download vendors as CSV
  const downloadVendorsCSV = () => {
    const headers = [
      'Business Name',
      'Owner Name',
      'Email',
      'Phone',
      'Business Type',
      'City',
      'State',
      'Status',
      'Registration Date',
      'GST Number',
      'PAN Number'
    ];
    
    const csvData = filteredVendors.map(vendor => [
      `"${vendor.businessName}"`,
      `"${vendor.name}"`,
      `"${vendor.email}"`,
      `"${vendor.phone}"`,
      `"${vendor.businessType}"`,
      `"${vendor.city}"`,
      `"${vendor.state}"`,
      `"${getStatusText(vendor.status)}"`,
      `"${formatDate(vendor.createdAt)}"`,
      `"${vendor.gstNumber}"`,
      `"${vendor.panNumber}"`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendor-applications-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    setSuccess('✅ Vendors list downloaded as CSV');
    setTimeout(() => setSuccess(''), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-slate-300">Loading vendor applications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Vendor Applications</h2>
          <p className="text-slate-400 mt-1">Manage all vendor registration applications</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={downloadVendorsCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={fetchAllVendors}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Applications</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Pending Review</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{stats.pending}</p>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Approved</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.approved}</p>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Rejected</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{stats.rejected}</p>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search vendors by name, business, email, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Vendors</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
          <span>Showing {filteredVendors.length} of {allVendors.length} vendors</span>
          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="text-blue-400 hover:text-blue-300"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-900/30 border border-red-700 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-400">{error}</p>
          </div>
          <button onClick={() => setError('')} className="p-1 hover:bg-red-800/30 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-emerald-900/30 border border-emerald-700 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-emerald-400">{success}</p>
          </div>
          <button onClick={() => setSuccess('')} className="p-1 hover:bg-emerald-800/30 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* No Vendors Message */}
      {allVendors.length === 0 && !loading && (
        <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700">
          <Building className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-300 mb-2">No Vendor Applications</h3>
          <p className="text-slate-500 mb-4">There are no vendor applications in the system yet.</p>
          <button
            onClick={fetchAllVendors}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      )}

      {/* Vendors Table */}
      {filteredVendors.length > 0 && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-300">Business Info</th>
                  <th className="text-left p-4 font-semibold text-slate-300">Owner</th>
                  <th className="text-left p-4 font-semibold text-slate-300">Contact</th>
                  <th className="text-left p-4 font-semibold text-slate-300">Location</th>
                  <th className="text-left p-4 font-semibold text-slate-300">Type</th>
                  <th className="text-left p-4 font-semibold text-slate-300">Status</th>
                  <th className="text-left p-4 font-semibold text-slate-300">Registered</th>
                  <th className="text-left p-4 font-semibold text-slate-300">Documents</th>
                  <th className="text-left p-4 font-semibold text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="border-t border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-white">{vendor.businessName}</div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        GST: {vendor.gstNumber}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{vendor.name}</div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        PAN: {vendor.panNumber}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-400 mb-1 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {vendor.email}
                      </div>
                      <div className="text-slate-400 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {vendor.phone}
                      </div>
                    </td>
                    <td className="p-4 text-slate-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <div>
                          <div>{vendor.city}, {vendor.state}</div>
                          <div className="text-xs">{vendor.pincode}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getBusinessTypeColor(vendor.businessType)}`}>
                        {vendor.businessType}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(vendor.status)}`}>
                        {getStatusText(vendor.status)}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">
                      <div className="text-sm">{formatDate(vendor.createdAt)}</div>
                      <div className="text-xs mt-1">{formatTime(vendor.createdAt)}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {vendor.documents && vendor.documents.length > 0 ? (
                          <>
                            <FileCheck className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs text-emerald-400">{vendor.documents.length} docs</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4 text-amber-400" />
                            <span className="text-xs text-amber-400">No docs</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {vendor.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveVendor(vendor.id)}
                              disabled={approvingId === vendor.id}
                              className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors disabled:opacity-50"
                              title="Approve Vendor"
                            >
                              {approvingId === vendor.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => openRejectModal(vendor)}
                              disabled={rejectingId === vendor.id}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                              title="Reject Vendor"
                            >
                              {rejectingId === vendor.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                        {vendor.status === 'approved' && (
                          <span className="text-xs text-emerald-400 px-3 py-1 rounded-full bg-emerald-500/10">
                            Approved
                          </span>
                        )}
                        {vendor.status === 'rejected' && (
                          <span className="text-xs text-red-400 px-3 py-1 rounded-full bg-red-500/10">
                            Rejected
                          </span>
                        )}
                        <button
                          onClick={() => showVendorDetails(vendor)}
                          className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vendor Details Modal */}
      {showDetailsModal && selectedVendor && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Vendor Application Details</h3>
                  <p className="text-slate-400 mt-1">Application ID: {selectedVendor.id}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ... (rest of the modal content remains the same) ... */}
            </div>
          </div>
        </div>
      )}

      {/* Reject Vendor Modal */}
      {showRejectModal && selectedVendor && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Reject Vendor Application</h3>
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectReason('');
                  }}
                  className="p-2 hover:bg-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-red-400 mb-1">Rejection Confirmation</h4>
                      <p className="text-sm text-red-300">
                        You are about to reject <span className="font-semibold">{selectedVendor.businessName}</span> owned by {selectedVendor.name}. 
                        This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Reason for Rejection (Optional)
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full h-32 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Provide a reason for rejection (will be sent to the vendor)..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectReason('');
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRejectVendor(selectedVendor.id, rejectReason)}
                    disabled={rejectingId === selectedVendor.id}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50"
                  >
                    {rejectingId === selectedVendor.id ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Rejecting...
                      </span>
                    ) : (
                      'Confirm Rejection'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsTab; 