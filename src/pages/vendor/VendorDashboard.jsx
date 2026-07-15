// pages/VendorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendorApi } from '../../hooks/vendorApi';
import DashboardHeader from '../../components/vendor/dashboard/DashboardHeader';
import DashboardTabs from '../../components/vendor/dashboard/DashboardTabs';
import VendorSidebar from '../../components/vendor/dashboard/components/VendorSidebar';
import ErrorBanner from '../../components/common/ErrorBanner';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatsOverview from '../../components/vendor/dashboard/StatsOverview';
import { FaBars, FaTimes } from 'react-icons/fa';

// Tab Components
import PendingStallsTab from '../../components/vendor/dashboard/tabs/PendingStallsTab';
import ApprovedStallsTab from '../../components/vendor/dashboard/tabs/ApprovedStallsTab';
import RejectedStallsTab from '../../components/vendor/dashboard/tabs/RejectedStallsTab';
import AllStallsTab from '../../components/vendor/dashboard/tabs/AllStallsTab';
import LicensesTab from '../../components/vendor/dashboard/tabs/LicensesTab';
import EventsTab from '../../components/vendor/dashboard/tabs/EventsTab';
import ActiveOffersTab from '../../components/vendor/dashboard/tabs/ActiveOffersTab';
import OverviewTab from '../../components/vendor/dashboard/tabs/OverviewTab';

// Modals
import CreateEventModal from '../../components/vendor/dashboard/modals/CreateEventModal';
import EventDetailsModal from '../../components/vendor/dashboard/modals/EventDetailsModal';
import RejectModal from '../../components/vendor/dashboard/modals/RejectModal';
import AssignLicenseModal from '../../components/vendor/dashboard/modals/AssignLicensesModal';
import StallDetailsModal from '../../components/vendor/dashboard/modals/StallsDetailsModal';

import { useAuth } from '../../context/AuthContext';

const VendorDashboard = () => {
  const navigate = useNavigate();
  const [vendorData, setVendorData] = useState(null);
  const { logoutVendor } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Stalls data
  const [pendingStalls, setPendingStalls] = useState([]);
  const [approvedStalls, setApprovedStalls] = useState([]);
  const [rejectedStalls, setRejectedStalls] = useState([]);
  const [allStalls, setAllStalls] = useState([]);

  // Licenses data
  const [licenses, setLicenses] = useState([]);
  const [licensesLoading, setLicensesLoading] = useState(false);
  const [licensesError, setLicensesError] = useState('');

  // Active Offers & Flash Deals data
  const [activeOffers, setActiveOffers] = useState([]);
  const [activeFlashDeals, setActiveFlashDeals] = useState([]);
  const [activeItemsLoading, setActiveItemsLoading] = useState(false);
  const [activeItemsError, setActiveItemsError] = useState('');
  
  // Combined pagination for offers and flash deals
  const [activeItemsPagination, setActiveItemsPagination] = useState({
    offers: { page: 1, limit: 6, total: 0, totalPages: 1 },
    flashdeals: { page: 1, limit: 6, total: 0, totalPages: 1 }
  });

  // Events data
  const [vendorEvents, setVendorEvents] = useState([]);
  const [vendorEventsLoading, setVendorEventsLoading] = useState(false);
  const [vendorEventsError, setVendorEventsError] = useState('');

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // User role state
  const [userRole, setUserRole] = useState('user');
  const [canEditItems, setCanEditItems] = useState(false);

  // Pagination state
  const [pagination, setPagination] = useState({
    pending: { page: 1, limit: 10, total: 0, totalPages: 1 },
    approved: { page: 1, limit: 10, total: 0, totalPages: 1 },
    rejected: { page: 1, limit: 10, total: 0, totalPages: 1 },
    all: { page: 1, limit: 10, total: 0, totalPages: 1 },
    licenses: { page: 1, limit: 12, total: 0, totalPages: 1 }
  });

  // Action loading states
  const [actionLoading, setActionLoading] = useState({});
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedStall, setSelectedStall] = useState(null);
  const [stallDetails, setStallDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // License assignment states
  const [showAssignLicenseModal, setShowAssignLicenseModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [selectedStallForLicense, setSelectedStallForLicense] = useState('');
  const [assigningLicense, setAssigningLicense] = useState(false);

  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [itemsPerPage, setItemsPerPage] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);

  // License Filter States
  const [showLicenseFilters, setShowLicenseFilters] = useState(false);
  const [licenseFilters, setLicenseFilters] = useState({});
  const [licenseSearchTerm, setLicenseSearchTerm] = useState('');
  const [licenseItemsPerPage, setLicenseItemsPerPage] = useState(6);
  const [licenseCurrentPage, setLicenseCurrentPage] = useState(1);

  useEffect(() => {
    const getUserRole = async () => {
      try {
        const response = await vendorApi.getVendorProfile();
        
        console.log('Vendor profile loaded:', response);
        
        if (response?.success && response?.data) {
          const role = response.data.role || response.data.userType;
          
          console.log('User role detected:', role);
          
          if (role === 'vendor' || role === 'seller') {
            setUserRole(role);
            setCanEditItems(true);
            console.log('Edit items enabled:', true);
          } else {
            setUserRole('user');
            setCanEditItems(false);
            console.log('Edit items disabled');
          }
        } else {
          const storedVendorData = localStorage.getItem('vendorData');
          if (storedVendorData) {
            try {
              const parsedData = JSON.parse(storedVendorData);
              const role = parsedData.role || parsedData.userType;
              if (role === 'vendor' || role === 'seller') {
                setUserRole(role);
                setCanEditItems(true);
                console.log('Role from localStorage:', role);
              }
            } catch (e) {
              console.error('Error parsing vendorData:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error getting user role:', error);
        setUserRole('user');
        setCanEditItems(false);
      }
    };

    getUserRole();
  }, []);

  // ==================== SINGLE AUTH + BOOT useEffect ====================
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      // Check if authenticated in localStorage first
      if (!vendorApi.isAuthenticated()) {
        navigate('/vendor/login', { replace: true });
        return;
      }

      try {
        setLoading(true);
        const profile = await vendorApi.getVendorProfile();

        if (profile && (profile.success || profile.data || profile.vendor)) {
          await loadVendorData();
          await Promise.allSettled([
            loadActiveOffersAndFlashDeals(),
            loadVendorEvents(),
          ]);
        } else {
          // Profile response indicates not authenticated
          vendorApi.clearAuthData();
          navigate('/vendor/login', { 
            replace: true,
            state: { message: 'Please login to continue.' }
          });
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        
        // ✅ Check for ANY auth-related error (403, 401, permission, access denied)
        const isAuthError = 
          err.message?.includes('401') ||
          err.message?.includes('403') ||
          err.message?.includes('expired') ||
          err.message?.includes('permission') ||
          err.message?.includes('Access denied') ||
          err.message?.includes('authentication') ||
          err.message?.includes('Unauthorized') ||
          err.message?.includes('session') ||
          err.status === 401 ||
          err.status === 403;

        if (isAuthError) {
          // Try token refresh first
          try {
            console.log('Attempting token refresh...');
            await vendorApi.refreshToken();
            console.log('Token refresh successful, retrying data load...');
            
            // Retry loading data
            await loadVendorData();
            await Promise.allSettled([
              loadActiveOffersAndFlashDeals(),
              loadVendorEvents(),
            ]);
            return; // Success - don't redirect
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            // Refresh failed - clear and redirect
          }
        }

        // Clear auth and redirect
        vendorApi.clearAuthData();
        setError('Your session has expired. Please login again.');
        
        // Short delay so user sees the message
        setTimeout(() => {
          navigate('/vendor/login', { 
            replace: true,
            state: { message: 'Your session has expired. Please login again.' }
          });
        }, 1500);
        
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [navigate]);

  // ==================== API DATA LOADING FUNCTIONS ====================

  const loadVendorData = async () => {
    try {
      setLoading(true);
      setError('');

      await loadVendorProfile();
      await Promise.all([
        loadPendingStalls(1),
        loadApprovedStalls(1),
        loadRejectedStalls(1),
        loadVendorLicenses()
      ]);

    } catch (error) {
      console.error('Failed to load vendor data:', error);
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const loadVendorProfile = async () => {
    try {
      const profile = await vendorApi.getVendorProfile();
      const vendor = profile?.data?.vendor || profile?.data || profile?.vendor || profile || {};
      setVendorData(vendor);
      if (vendor && Object.keys(vendor).length > 0) {
        localStorage.setItem('vendorData', JSON.stringify(vendor));
        console.log(vendor);
      }
      console.log('Vendor profile loaded:', profile);
    } catch (error) {
      console.error('Error loading vendor profile:', error);
      const savedData = localStorage.getItem('vendorData');
      if (savedData) {
        try {
          setVendorData(JSON.parse(savedData));
        } catch (_) {}
      }
    }
  };

// Replace the loadActiveOffersAndFlashDeals function
  const loadActiveOffersAndFlashDeals = async () => {
    try {
      setActiveItemsLoading(true);
      setActiveItemsError('');
      
      // Fetch offers and flash deals
      const [offersResponse, flashDealsResponse] = await Promise.allSettled([
        vendorApi.getMallActiveOffers(),
        vendorApi.getMallActiveFlashDeals() // Use getVendorFlashDeals instead
      ]);
      
      // Debug logs
      console.log('=== FLASH DEALS RAW RESPONSE ===');
      console.log('Flash deals response status:', flashDealsResponse.status);
      if (flashDealsResponse.status === 'fulfilled') {
        console.log('Flash deals response value:', flashDealsResponse.value);
      }
      
      // Process offers
      let offers = [];
      if (offersResponse.status === 'fulfilled' && offersResponse.value) {
        const response = offersResponse.value;
        if (response?.success && response?.offers && Array.isArray(response.offers)) {
          offers = response.offers;
        } else if (response?.data && Array.isArray(response.data)) {
          offers = response.data;
        } else if (Array.isArray(response)) {
          offers = response;
        }
      }
      setActiveOffers(offers);
      
      // Process flash deals - try multiple possible response structures
      let flashDeals = [];
      if (flashDealsResponse.status === 'fulfilled' && flashDealsResponse.value) {
        const response = flashDealsResponse.value;
        
        // Try different response structures
        if (response?.success && response?.flashDeals && Array.isArray(response.flashDeals)) {
          flashDeals = response.flashDeals;
        } 
        else if (response?.success && response?.data && Array.isArray(response.data)) {
          flashDeals = response.data;
        }
        else if (response?.flashDeals && Array.isArray(response.flashDeals)) {
          flashDeals = response.flashDeals;
        }
        else if (Array.isArray(response)) {
          flashDeals = response;
        }
        
        // If still empty, check if the response itself has flash deals data
        if (flashDeals.length === 0 && response && typeof response === 'object') {
          // Check for any array property that might contain flash deals
          for (let key in response) {
            if (Array.isArray(response[key]) && response[key].length > 0) {
              console.log(`Found flash deals in property: ${key}`, response[key]);
              flashDeals = response[key];
              break;
            }
          }
        }
        
        console.log('Extracted flash deals:', flashDeals);
        console.log('Number of flash deals:', flashDeals.length);
        
        // Transform flash deals to ensure consistent field names
        if (flashDeals.length > 0) {
          flashDeals = flashDeals.map(deal => ({
            ...deal,
            _id: deal._id || deal.id,
            title: deal.title || deal.flashDealTitle || deal.name,
            description: deal.description || deal.flashDealDescription,
            discountValue: deal.discountValue || deal.discount,
            discountType: deal.discountType || deal.type,
            startDate: deal.startDate || deal.flashDealStartTime,
            endDate: deal.endDate || deal.flashDealEndTime,
            flashDealImages: deal.flashDealImages || deal.images,
            status: deal.status || (new Date(deal.endDate) > new Date() ? 'active' : 'expired')
          }));
        }
      }
      
      setActiveFlashDeals(flashDeals);
      
      // Update pagination for both
      updatePaginationForTab('offers', offers);
      updatePaginationForTab('flashdeals', flashDeals);
      
      console.log('Loaded offers:', offers.length);
      console.log('Loaded flash deals:', flashDeals.length);
      
    } catch (error) {
      console.error('Error loading active items:', error);
      setActiveItemsError(error.message || 'Failed to load active items');
      setActiveOffers([]);
      setActiveFlashDeals([]);
    } finally {
      setActiveItemsLoading(false);
    }
  };

  // Update pagination for a specific tab
  const updatePaginationForTab = (tab, data) => {
    const limit = activeItemsPagination[tab].limit;
    const total = data.length;
    const totalPages = Math.ceil(total / limit) || 1;
    
    setActiveItemsPagination(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        total,
        totalPages,
        page: Math.min(prev[tab].page, totalPages)
      }
    }));
  };

  // Refresh handlers for each tab
  const handleRefreshPendingStalls = async () => {
    setActionLoading(prev => ({ ...prev, refreshing: true }));
    try {
      await loadPendingStalls(pagination.pending.page);
    } catch (error) {
      console.error('Error refreshing pending stalls:', error);
      setError('Failed to refresh pending stalls');
    } finally {
      setActionLoading(prev => ({ ...prev, refreshing: false }));
    }
  };

  const handleRefreshApprovedStalls = async () => {
    setActionLoading(prev => ({ ...prev, refreshing: true }));
    try {
      await loadApprovedStalls(pagination.approved.page);
    } catch (error) {
      console.error('Error refreshing approved stalls:', error);
      setError('Failed to refresh approved stalls');
    } finally {
      setActionLoading(prev => ({ ...prev, refreshing: false }));
    }
  };

  const handleRefreshRejectedStalls = async () => {
    setActionLoading(prev => ({ ...prev, refreshing: true }));
    try {
      await loadRejectedStalls(pagination.rejected.page);
    } catch (error) {
      console.error('Error refreshing rejected stalls:', error);
      setError('Failed to refresh rejected stalls');
    } finally {
      setActionLoading(prev => ({ ...prev, refreshing: false }));
    }
  };

  const handleRefreshAllStalls = async () => {
    setActionLoading(prev => ({ ...prev, refreshing: true }));
    try {
      await Promise.all([
        loadPendingStalls(pagination.pending.page),
        loadApprovedStalls(pagination.approved.page),
        loadRejectedStalls(pagination.rejected.page)
      ]);
    } catch (error) {
      console.error('Error refreshing all stalls:', error);
      setError('Failed to refresh stalls');
    } finally {
      setActionLoading(prev => ({ ...prev, refreshing: false }));
    }
  };

  const handleRefreshActiveItems = async () => {
    setActionLoading(prev => ({ ...prev, refreshing: true }));
    try {
      await loadActiveOffersAndFlashDeals();
    } catch (error) {
      console.error('Error refreshing active items:', error);
      setError('Failed to refresh active items');
    } finally {
      setActionLoading(prev => ({ ...prev, refreshing: false }));
    }
  };

  const loadVendorLicenses = async () => {
    try {
      setLicensesLoading(true);
      setLicensesError('');
      const response = await vendorApi.getVendorStallLicenses();

      if (response?.success && response?.data) {
        setLicenses(response.data);
        setPagination(prev => ({
          ...prev,
          licenses: {
            ...prev.licenses,
            total: response.data.length,
            totalPages: Math.ceil(response.data.length / prev.licenses.limit) || 1
          }
        }));
      } else if (Array.isArray(response)) {
        setLicenses(response);
        setPagination(prev => ({
          ...prev,
          licenses: {
            ...prev.licenses,
            total: response.length,
            totalPages: Math.ceil(response.length / prev.licenses.limit) || 1
          }
        }));
      } else {
        setLicenses([]);
      }
    } catch (error) {
      console.error('Error loading licenses:', error);
      setLicensesError(error.message || 'Failed to load licenses');
    } finally {
      setLicensesLoading(false);
    }
  };

  // FIXED: backend returns { success, stalls, pagination } — was checking response.pendingStalls
  const loadPendingStalls = async (page = 1) => {
    try {
      setActionLoading(prev => ({ ...prev, pending: true }));
      const response = await vendorApi.getVendorPendingStalls();

      let stalls = [];
      if (response?.success && Array.isArray(response.stalls)) {
        stalls = response.stalls;
      }

      setPendingStalls(stalls);
      setPagination(prev => ({
        ...prev,
        pending: {
          ...prev.pending,
          page,
          total: stalls.length,
          totalPages: Math.ceil(stalls.length / prev.pending.limit) || 1
        }
      }));
    } catch (error) {
      console.error('Error loading pending stalls:', error);
      setPendingStalls([]);
    } finally {
      setActionLoading(prev => ({ ...prev, pending: false }));
    }
  };

  // FIXED: backend returns { success, stalls, pagination } — was checking response.pendingStalls (copy-paste bug)
  const loadApprovedStalls = async (page = 1) => {
    try {
      setActionLoading(prev => ({ ...prev, approved: true }));
      const response = await vendorApi.getVendorApprovedStalls();

      let stalls = [];
      if (response?.success && Array.isArray(response.stalls)) {
        stalls = response.stalls;
      }

      setApprovedStalls(stalls);
      setPagination(prev => ({
        ...prev,
        approved: {
          ...prev.approved,
          page,
          total: stalls.length,
          totalPages: Math.ceil(stalls.length / prev.approved.limit) || 1
        }
      }));
    } catch (error) {
      console.error('Error loading approved stalls:', error);
      setApprovedStalls([]);
    } finally {
      setActionLoading(prev => ({ ...prev, approved: false }));
    }
  };

  // FIXED: backend returns { success, stalls, pagination } — was checking response.rejectedStalls
  const loadRejectedStalls = async (page = 1) => {
    try {
      setActionLoading(prev => ({ ...prev, rejected: true }));
      const response = await vendorApi.getVendorRejectedStalls();

      let stalls = [];
      if (response?.success && Array.isArray(response.stalls)) {
        stalls = response.stalls;
      }

      setRejectedStalls(stalls);
      setPagination(prev => ({
        ...prev,
        rejected: {
          ...prev.rejected,
          page,
          total: stalls.length,
          totalPages: Math.ceil(stalls.length / prev.rejected.limit) || 1
        }
      }));
    } catch (error) {
      console.error('Error loading rejected stalls:', error);
      setRejectedStalls([]);
    } finally {
      setActionLoading(prev => ({ ...prev, rejected: false }));
    }
  };

  const updateAllStalls = () => {
    const allStallsList = [
      ...pendingStalls.map(s => ({ ...s, status: 'pending' })),
      ...approvedStalls.map(s => ({ ...s, status: 'approved' })),
      ...rejectedStalls.map(s => ({ ...s, status: 'rejected' }))
    ];

    setAllStalls(allStallsList);
    setPagination(prev => ({
      ...prev,
      all: {
        ...prev.all,
        total: allStallsList.length,
        totalPages: Math.ceil(allStallsList.length / prev.all.limit) || 1
      }
    }));
  };

  useEffect(() => {
    updateAllStalls();
  }, [pendingStalls, approvedStalls, rejectedStalls]);

  const loadStallDetails = async (stallId) => {
    try {
      setActionLoading(prev => ({ ...prev, [stallId]: 'loading' }));
      const stall = allStalls.find(s => s._id === stallId || s.shopId === stallId);
      if (stall) {
        setStallDetails(stall);
        setShowDetailsModal(true);
      } else {
        setError('Stall details not found');
      }
    } catch (error) {
      console.error('Error loading stall details:', error);
      setError('Failed to load stall details');
    } finally {
      setActionLoading(prev => ({ ...prev, [stallId]: false }));
    }
  };

  const handleApproveStall = async (shopId) => {
    if (!window.confirm('Are you sure you want to approve this stall?')) return;

    try {
      setActionLoading(prev => ({ ...prev, [shopId]: 'approving' }));
      const response = await vendorApi.approveStall(shopId);

      if (response.success) {
        alert('Stall approved successfully!');
        await Promise.all([
          loadPendingStalls(pagination.pending.page),
          loadApprovedStalls(pagination.approved.page),
          loadRejectedStalls(pagination.rejected.page)
        ]);
      }
    } catch (error) {
      console.error('Error approving stall:', error);
      alert(error.message || 'Failed to approve stall');
    } finally {
      setActionLoading(prev => ({ ...prev, [shopId]: false }));
    }
  };

  const handleRejectStall = async () => {
    if (!selectedStall || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(prev => ({ ...prev, [selectedStall.shopId || selectedStall._id]: 'rejecting' }));
      const response = await vendorApi.rejectStall(selectedStall.shopId || selectedStall._id, rejectionReason);

      if (response.success) {
        alert('Stall rejected successfully!');
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedStall(null);

        await Promise.all([
          loadPendingStalls(pagination.pending.page),
          loadApprovedStalls(pagination.approved.page),
          loadRejectedStalls(pagination.rejected.page)
        ]);
      }
    } catch (error) {
      console.error('Error rejecting stall:', error);
      alert(error.message || 'Failed to reject stall');
    } finally {
      setActionLoading(prev => ({ ...prev, [selectedStall?.shopId || selectedStall?._id]: false }));
    }
  };

  const handleAssignLicense = async () => {
    if (!selectedLicense || !selectedStallForLicense) {
      alert('Please select a stall');
      return;
    }

    try {
      setAssigningLicense(true);
      // Add your license assignment API call here
      alert('License assigned successfully!');
      setShowAssignLicenseModal(false);
      setSelectedLicense(null);
      setSelectedStallForLicense('');
      await loadVendorLicenses();
    } catch (error) {
      console.error('Error assigning license:', error);
      alert(error.message || 'Failed to assign license');
    } finally {
      setAssigningLicense(false);
    }
  };

  const handleLogout = async () => {
    try {
      await vendorApi.logoutVendor();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logoutVendor(); // ✅ clears vendorAuth state in context
      navigate('/vendor/login');
    }
  };

  const loadVendorEvents = async () => {
    try {
      setVendorEventsLoading(true);
      setVendorEventsError('');
      const response = await vendorApi.getVendorEvents();

      const events = (response?.success && response?.data) ? response.data :
        Array.isArray(response) ? response : response?.data ? response.data : [];

      const safeEvents = events.filter(event => {
        if (!event.eventStartDate) return false;
        return !isNaN(new Date(event.eventStartDate).getTime());
      });

      setVendorEvents(safeEvents);
    } catch (error) {
      console.error('Error loading vendor events:', error);
      setVendorEventsError(error.message || 'Failed to load events');
      setVendorEvents([]);
    } finally {
      setVendorEventsLoading(false);
    }
  };

  const loadSingleEvent = async (eventId) => {
    try {
      setActionLoading(prev => ({ ...prev, [`event-${eventId}`]: true }));
      const response = await vendorApi.getSingleVendorEvent(eventId);

      if (response?.success && response?.data) {
        setSelectedEvent(response.data);
      } else if (response?.data) {
        setSelectedEvent(response.data);
      } else {
        setSelectedEvent(response);
      }
      setShowEventModal(true);
    } catch (error) {
      console.error('Error loading event details:', error);
      alert(error.message || 'Failed to load event details');
    } finally {
      setActionLoading(prev => ({ ...prev, [`event-${eventId}`]: false }));
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      setActionLoading(prev => ({ ...prev, [`delete-${eventId}`]: true }));
      const response = await vendorApi.deleteEvent(eventId);

      if (response.success) {
        alert('Event deleted successfully!');
        await loadVendorEvents();
        if (selectedEvent?._id === eventId) {
          setShowEventModal(false);
          setSelectedEvent(null);
        }
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert(error.message || 'Failed to delete event');
    } finally {
      setActionLoading(prev => ({ ...prev, [`delete-${eventId}`]: false }));
    }
  };

  const handleAuthError = (error) => {
    if (
      error.message.includes('No vendor ID found') ||
      error.message.includes('Unauthorized') ||
      error.message.includes('authentication')
    ) {
      vendorApi.clearAuthData();
      setError('Session expired. Please login again.');
      setTimeout(() => {
        navigate('/vendor/login', {
          state: { message: 'Your session has expired. Please login again.' }
        });
      }, 2000);
    } else {
      setError('Failed to load dashboard. ' + error.message);
    }
  };

  // ==================== PAGINATION HANDLERS ====================

  const handlePendingPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pending.totalPages) {
      setPagination(prev => ({
        ...prev,
        pending: { ...prev.pending, page: newPage }
      }));
    }
  };

  const handleApprovedPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.approved.totalPages) {
      setPagination(prev => ({
        ...prev,
        approved: { ...prev.approved, page: newPage }
      }));
    }
  };

  const handleRejectedPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.rejected.totalPages) {
      setPagination(prev => ({
        ...prev,
        rejected: { ...prev.rejected, page: newPage }
      }));
    }
  };

  const handleAllStallsPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.all.totalPages) {
      setPagination(prev => ({
        ...prev,
        all: { ...prev.all, page: newPage }
      }));
    }
  };

  // Combined pagination handler for offers and flash deals
  const handleActiveItemsPageChange = (tab, newPage, newLimit = null) => {
    if (newLimit && newLimit !== activeItemsPagination[tab].limit) {
      // Limit changed, recalculate total pages
      const items = tab === 'offers' ? activeOffers : activeFlashDeals;
      const totalPages = Math.ceil(items.length / newLimit);
      setActiveItemsPagination(prev => ({
        ...prev,
        [tab]: {
          ...prev[tab],
          limit: newLimit,
          totalPages: totalPages || 1,
          page: 1
        }
      }));
    } else if (newPage >= 1 && newPage <= activeItemsPagination[tab].totalPages) {
      setActiveItemsPagination(prev => ({
        ...prev,
        [tab]: {
          ...prev[tab],
          page: newPage
        }
      }));
    }
  };

  // Get paginated items for a specific tab
  const getPaginatedActiveItems = (tab) => {
    const items = tab === 'offers' ? activeOffers : activeFlashDeals;
    const { page, limit } = activeItemsPagination[tab];
    const start = (page - 1) * limit;
    const end = start + limit;
    return items.slice(start, end);
  };

  const getFilteredStalls = (stalls) => {
    if (!searchTerm) return stalls;
    return stalls.filter(stall =>
      (stall.shopName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (stall.shopId?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (stall.location?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const getPaginatedItems = (items, page, limit) => {
    const start = (page - 1) * limit;
    const end = start + limit;
    return items.slice(start, end);
  };

  // Debug log to see if edit is enabled
  console.log('canEditItems in dashboard:', canEditItems);
  console.log('userRole:', userRole);
  console.log('Active Offers count:', activeOffers.length);
  console.log('Active Flash Deals count:', activeFlashDeals.length);

  if (loading) {
    return <LoadingSpinner message="Preparing your dashboard..." />;
  }

  // Get total count for the offers tab
  const totalOffersCount = activeOffers.length + activeFlashDeals.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white/95 backdrop-blur-sm shadow-sm ring-1 ring-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl hover:bg-gray-50 text-gray-600"
        >
          {sidebarOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
        </button>
        <h1 className="text-lg font-bold text-gray-900">Vendor Dashboard</h1>
        <div className="w-9"></div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`
          fixed lg:static inset-y-0 left-0 transform
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 transition duration-200 ease-in-out
          z-40 w-64 bg-white ring-1 ring-gray-100 shadow-sm h-screen overflow-y-auto shrink-0
        `}>
          <VendorSidebar
            vendorData={vendorData}
            profilePreview={vendorData?.profile || vendorData?.profileImage}
            activePage="dashboard"
            onLogout={handleLogout}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <DashboardHeader
            vendorData={vendorData}
            pendingStallsCount={pendingStalls.length}
            onLogout={handleLogout}
          />

          <DashboardTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            pendingCount={pendingStalls.length}
            approvedCount={approvedStalls.length}
            rejectedCount={rejectedStalls.length}
            allStallsCount={allStalls.length}
            licensesCount={licenses.length}
            eventsCount={vendorEvents.length}
            offersCount={totalOffersCount}
          />

          {error && (
            <ErrorBanner error={error} onDismiss={() => setError('')} />
          )}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <StatsOverview
              pendingStalls={pendingStalls.length}
              approvedStalls={approvedStalls.length}
              rejectedStalls={rejectedStalls.length}
              allStalls={allStalls.length}
              licenses={licenses.length}
            />

            <div className="space-y-8">
              {activeTab === 'pending' && (
                <PendingStallsTab
                  pendingStalls={pendingStalls}
                  actionLoading={actionLoading}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  pagination={pagination.pending}
                  onPageChange={handlePendingPageChange}
                  onViewDetails={loadStallDetails}
                  onApprove={handleApproveStall}
                  onReject={(stall) => {
                    setSelectedStall(stall);
                    setShowRejectModal(true);
                  }}
                  getFilteredStalls={getFilteredStalls}
                  getPaginatedItems={getPaginatedItems}
                  onRefresh={handleRefreshPendingStalls}
                />
              )}

              {activeTab === 'approved' && (
                <ApprovedStallsTab
                  approvedStalls={approvedStalls}
                  actionLoading={actionLoading}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  pagination={pagination.approved}
                  onPageChange={handleApprovedPageChange}
                  onViewDetails={loadStallDetails}
                  getFilteredStalls={getFilteredStalls}
                  getPaginatedItems={getPaginatedItems}
                  getRatingStars={(rating) => {
                    return '⭐'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
                  }}
                  onRefresh={handleRefreshApprovedStalls}
                />
              )}

              {activeTab === 'rejected' && (
                <RejectedStallsTab
                  rejectedStalls={rejectedStalls}
                  actionLoading={actionLoading}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  pagination={pagination.rejected}
                  onPageChange={handleRejectedPageChange}
                  onViewDetails={loadStallDetails}
                  getFilteredStalls={getFilteredStalls}
                  getPaginatedItems={getPaginatedItems}
                  onRefresh={handleRefreshRejectedStalls}
                />
              )}

              {activeTab === 'all-stalls' && (
                <AllStallsTab
                  allStalls={allStalls}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  pagination={pagination.all}
                  onPageChange={handleAllStallsPageChange}
                  onViewDetails={loadStallDetails}
                  getFilteredStalls={getFilteredStalls}
                  getPaginatedItems={getPaginatedItems}
                  onRefresh={handleRefreshAllStalls}
                  actionLoading={actionLoading}
                />
              )}

              {activeTab === 'licenses' && (
                <LicensesTab
                  licenses={licenses}
                  licensesLoading={licensesLoading}
                  licensesError={licensesError}
                  licenseFilters={licenseFilters}
                  setLicenseFilters={setLicenseFilters}
                  showLicenseFilters={showLicenseFilters}
                  setShowLicenseFilters={setShowLicenseFilters}
                  licenseSearchTerm={licenseSearchTerm}
                  setLicenseSearchTerm={setLicenseSearchTerm}
                  licenseItemsPerPage={licenseItemsPerPage}
                  setLicenseItemsPerPage={setLicenseItemsPerPage}
                  licenseCurrentPage={licenseCurrentPage}
                  setLicenseCurrentPage={setLicenseCurrentPage}
                  clearLicenseFilters={() => {
                    setLicenseFilters({});
                    setLicenseSearchTerm('');
                    setLicenseCurrentPage(1);
                  }}
                  onRefresh={loadVendorLicenses}
                  onAssignLicense={(license) => {
                    setSelectedLicense(license);
                    setShowAssignLicenseModal(true);
                  }}
                  approvedStalls={approvedStalls}
                />
              )}

              {activeTab === 'events' && (
                <EventsTab
                  vendorEvents={vendorEvents}
                  vendorEventsLoading={vendorEventsLoading}
                  vendorEventsError={vendorEventsError}
                  activeFilters={activeFilters}
                  setActiveFilters={setActiveFilters}
                  showFilters={showFilters}
                  setShowFilters={setShowFilters}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  itemsPerPage={itemsPerPage}
                  setItemsPerPage={setItemsPerPage}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  clearAllFilters={() => {
                    setActiveFilters({});
                    setSearchTerm('');
                    setCurrentPage(1);
                  }}
                  onCreateEvent={() => {
                    setShowCreateEventModal(true);
                  }}
                  onViewEvent={loadSingleEvent}
                  onEditEvent={(event) => {
                    setSelectedEvent(event);
                    setShowEventModal(true);
                  }}
                  onDeleteEvent={handleDeleteEvent}
                  actionLoading={actionLoading}
                />
              )}

              {activeTab === 'offers' && (
                <ActiveOffersTab
                  activeOffers={activeOffers}
                  activeFlashDeals={activeFlashDeals}
                  loading={activeItemsLoading}
                  error={activeItemsError}
                  pagination={activeItemsPagination}
                  onPageChange={handleActiveItemsPageChange}
                  onRefresh={handleRefreshActiveItems}
                  getPaginatedItems={getPaginatedActiveItems}
                  canEdit={canEditItems}
                  onItemUpdated={(updatedItem, type) => {
                    console.log(`${type} updated:`, updatedItem);
                    loadActiveOffersAndFlashDeals(); // Refresh all items after update
                  }}
                />
              )}

              {activeTab === 'overview' && (
                <OverviewTab
                  pendingStalls={pendingStalls}
                  approvedStalls={approvedStalls}
                  rejectedStalls={rejectedStalls}
                  licenses={licenses}
                  vendorData={vendorData}
                  onTabChange={setActiveTab}
                  getPaginatedItems={getPaginatedItems}
                  onLogout={handleLogout}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Modals */}
      <CreateEventModal
        isOpen={showCreateEventModal}
        onClose={() => {
          setShowCreateEventModal(false);
        }}
        onEventCreated={() => {
          loadVendorEvents();
        }}
        actionLoading={actionLoading}
        setActionLoading={setActionLoading}
      />

      <EventDetailsModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
        }}
        event={selectedEvent}
        onEventUpdated={() => {
          loadVendorEvents();
        }}
        onEventDeleted={handleDeleteEvent}
        actionLoading={actionLoading}
        setActionLoading={setActionLoading}
      />

      <RejectModal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedStall(null);
          setRejectionReason('');
        }}
        stall={selectedStall}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        onReject={handleRejectStall}
        actionLoading={actionLoading}
      />

      <AssignLicenseModal
        isOpen={showAssignLicenseModal}
        onClose={() => {
          setShowAssignLicenseModal(false);
          setSelectedLicense(null);
          setSelectedStallForLicense('');
        }}
        license={selectedLicense}
        approvedStalls={approvedStalls}
        selectedStallForLicense={selectedStallForLicense}
        setSelectedStallForLicense={setSelectedStallForLicense}
        onAssign={handleAssignLicense}
        assigningLicense={assigningLicense}
      />

      <StallDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setStallDetails(null);
        }}
        stall={stallDetails}
        onApprove={handleApproveStall}
        onReject={(stall) => {
          setShowDetailsModal(false);
          setSelectedStall(stall);
          setShowRejectModal(true);
        }}
      />
    </div>
  );
};

export default VendorDashboard;