// hooks/vendorApi.js 

const API_BASE_URL = 'https://mallsphere.ae/api';
const AUTH_URL = `${API_BASE_URL}/vendor`;


let isRefreshing = false;
let failedQueue = [];

// Fixed: queue stores resolve/reject as a signal only.
// Each queued request retries fetch() itself after the signal fires.
const processQueue = (error = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
};

// ==================== CORE FETCH ====================

// Returns a raw Response — never consumes the body
const baseFetch = async (url, options = {}) => {
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...options.headers,
    },
  });
};

// Helper: safely parse response, works for both JSON and plain text
const safeParseResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'Request failed');
    }
    return data;
  } else {
    // Plain text response (e.g., "Too many attempts")
    const text = await response.text();
    if (!response.ok) {
      throw new Error(text || 'Request failed');
    }
    return { message: text }; // wrap in object for consistency
  }
};

// ==================== STANDALONE REFRESH ====================
// Calls the refresh endpoint directly (no auto-retry) to avoid infinite loops.
// Returns true on success, throws on failure.
const doRefresh = async () => {
  const response = await baseFetch(`${AUTH_URL}/vendor-refresh-token`, {
    method: 'POST',
  });

  // Consume body ONCE here
  let data = {};
  try {
    data = await response.json();
  } catch { /* no body is fine — cookie-only refresh */ }

  if (!response.ok) {
    throw new Error(data?.message || 'Token refresh failed');
  }

  // Persist any updated identity info the backend sends back
  if (data.vendorId) {
    localStorage.setItem('vendorId', String(data.vendorId));
  }
  localStorage.setItem('vendorAuthenticated', 'true');

  return true; // signal success without returning parsed body
};

// ==================== FETCH WITH AUTO REFRESH ====================
// Fixed:
//   1. Returns a raw Response so callers parse JSON once, in their own context
//   2. Queued requests retry fetch() after refresh rather than relying on
//      a resolved Promise value that was never set
//   3. doRefresh() and fetchWithTokenRefresh never both call .json() on
//      the same Response object

const fetchWithTokenRefresh = async (url, options = {}) => {
  // ── First attempt ──
  let response;
  try {
    response = await baseFetch(url, options);
  } catch (networkError) {
    throw new Error('Network error. Please check your connection.');
  }

  if (response.ok) return response; // ← return raw Response, caller parses

  // Consume error body ONCE
  let errorData = {};
  try {
    const ct = response.headers.get('content-type');
    if (ct && ct.includes('application/json')) {
      errorData = await response.json();
    } else {
      errorData = { message: await response.text() };
    }
  } catch { /* ignore */ }

  // Only attempt refresh for token-related errors
  const isTokenError =
    response.status === 401 ||
    (response.status === 403 &&
      (errorData?.message?.toLowerCase().includes('token') ||
        errorData?.message?.toLowerCase().includes('expired') ||
        errorData?.message?.toLowerCase().includes('unauthorized') ||
        errorData?.message?.toLowerCase().includes('login again')));

  if (!isTokenError) {
    // Real permission / not-found / server error — throw immediately
    throw new Error(
      errorData?.message || errorData?.error || `Request failed with status ${response.status}`
    );
  }

  // ── Token expired — refresh then retry ──

  if (isRefreshing) {
    // Another request already owns the refresh — queue and wait
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then(async () => {
      // Refresh completed — retry with fresh cookies
      let retryRes;
      try {
        retryRes = await baseFetch(url, options);
      } catch {
        throw new Error('Network error. Please check your connection.');
      }
      if (!retryRes.ok) {
        const errData = await retryRes.json().catch(() => ({}));
        throw new Error(
          errData?.message || errData?.error || `Retry failed with status ${retryRes.status}`
        );
      }
      return retryRes; // raw Response
    });
  }

  // ── This request owns the refresh ──
  isRefreshing = true;

  try {
    await doRefresh(); // throws on failure

    // Unblock all queued requests
    processQueue(null);

    // Retry the original request with fresh cookies
    let retryResponse;
    try {
      retryResponse = await baseFetch(url, options);
    } catch {
      throw new Error('Network error. Please check your connection.');
    }

    if (!retryResponse.ok) {
      const errData = await retryResponse.json().catch(() => ({}));

      if (retryResponse.status === 401 || retryResponse.status === 403) {
        clearAuthData();
        if (!window.location.pathname.includes('/vendor/login')) {
          window.location.href = '/vendor/login';
        }
        throw new Error('Session expired. Please login again.');
      }

      throw new Error(
        errData?.message || errData?.error || `Retry failed with status ${retryResponse.status}`
      );
    }

    return retryResponse; // raw Response

  } catch (refreshError) {
    processQueue(refreshError);
    clearAuthData();
    if (!window.location.pathname.includes('/vendor/login')) {
      window.location.href = '/vendor/login';
    }
    throw refreshError;

  } finally {
    isRefreshing = false;
  }
};

// ==================== CONVENIENCE WRAPPER ====================
// Calls fetchWithTokenRefresh and parses JSON in one step.
// Use this for all API methods so they get { data } back directly.
const apiFetch = async (url, options = {}) => {
  const response = await fetchWithTokenRefresh(url, options);
  try {
    return await response.json();
  } catch {
    return {}; // empty body (e.g. 204 No Content)
  }
};

// ==================== HELPER FUNCTIONS ====================

const getVendorId = () => localStorage.getItem('vendorId');

const storeAuthData = (data) => {
  console.log('Storing auth data:', data);
  const vendorId =
    data.vendorId ||
    data.data?.vendorId ||
    data.data?.vendor?._id ||
    data.data?._id;

  if (vendorId) {
    localStorage.setItem('vendorId', String(vendorId));
    console.log('Stored vendorId:', vendorId);
  }

  localStorage.setItem('vendorAuthenticated', 'true');

  const vendorData = data.data?.vendor || data.vendor || data.data || null;
  if (vendorData && typeof vendorData === 'object') {
    localStorage.setItem('vendorData', JSON.stringify(vendorData));
  }
};

const clearAuthData = () => {
  ['vendorId', 'vendorAuthenticated', 'vendorData', 'vendorProfile'].forEach((k) =>
    localStorage.removeItem(k)
  );
};

const isAuthenticated = () =>
  localStorage.getItem('vendorAuthenticated') === 'true' &&
  !!localStorage.getItem('vendorId');

// ==================== VENDOR API ====================

export const vendorApi = {
  isAuthenticated,
  getVendorId,
  storeAuthData,
  clearAuthData,

  // ── Authentication ──

  registerVendor: async (vendorData, profileImage, shopImages) => {
    try {
      const formData = new FormData();
      Object.keys(vendorData).forEach((key) => {
        if (vendorData[key] !== undefined && vendorData[key] !== null) {
          if (key === 'vendorShopNumberOfFloors' || key === 'vendorShopNumberOfStalls') {
            formData.append(key, parseInt(vendorData[key]));
          } else {
            formData.append(key, vendorData[key]);
          }
        }
      });
      if (!profileImage) throw new Error('Profile picture is required');
      formData.append('profile', profileImage);
      if (shopImages?.length > 0) {
        shopImages.forEach((img) => formData.append('vendorShopImages', img));
      }
      const response = await baseFetch(`${AUTH_URL}/vendor-register`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || data?.error || 'Registration failed');
      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  },

  verifyOtp: async (email, otp,  vendorLicenseNumber) => {
    const response = await baseFetch(`${AUTH_URL}/vendor-verify-otp`, {
      method: 'POST',
      body: JSON.stringify({ email, otp ,  vendorLicenseNumber}),
    });
    return safeParseResponse(response);
  },

  resendOtp: async (email) => {
    const response = await baseFetch(`${AUTH_URL}/vendor-resend-otp`, {
      method: 'POST',
      body: JSON.stringify({ email}),
    });
    return safeParseResponse(response);
  },

  loginVendor: async (credentials) => {
    try {
      const response = await baseFetch(`${AUTH_URL}/vendor-login`, {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.message || data?.error || 'Login failed');
      storeAuthData(data);
      return data;
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  },

  forgotPassword: async (email) => {
    const response = await baseFetch(`${AUTH_URL}/vendor-forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.message || data?.error || 'Failed to send reset OTP');
    return data;
  },

  resetPassword: async (email, otp, newPassword, confirmPassword) => {
    const response = await baseFetch(`${AUTH_URL}/vendor-reset-password`, {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword, confirmPassword }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.message || data?.error || 'Failed to reset password');
    return data;
  },

  changePassword: async (oldPassword, newPassword, confirmPassword) => {
    return apiFetch(`${AUTH_URL}/vendor-change-password`, {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
    });
  },

  logoutVendor: async () => {
    try {
      const response = await baseFetch(`${AUTH_URL}/vendor-logout`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      clearAuthData();
      return data?.message ? data : { success: true, message: 'Logged out successfully' };
    } catch {
      clearAuthData();
      return { success: true, message: 'Logged out locally' };
    }
  },

  refreshToken: async () => {
    return doRefresh();
  },

  // ── Profile Management ──

  getVendorProfile: async () => {
    try {
      return await apiFetch(`${AUTH_URL}/vendor-admin-profile`, { method: 'GET' });
    } catch (error) {
      const isPermissionError =
        error.message?.includes('Access denied') ||
        error.message?.includes('403') ||
        error.message?.includes('Forbidden') ||
        error.message?.includes('permission');

      if (isPermissionError) {
        console.log('Not an admin vendor — using cached profile data');
        const savedData = localStorage.getItem('vendorData');
        if (savedData) {
          try { return { success: true, data: JSON.parse(savedData) }; } catch { /* ignore */ }
        }
        return { success: true, data: {} };
      }

      console.error('Get Vendor Profile Error:', error);
      throw error;
    }
  },

  getVendorAdminProfile: async () => vendorApi.getVendorProfile(),
  getVendorProfileUnified: async () => vendorApi.getVendorProfile(),

  updateVendorProfile: async (profileData) => {
    return apiFetch(`${AUTH_URL}/vendor-update-profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  checkAuthStatus: async () => {
    try {
      const response = await vendorApi.getVendorProfile();

      if (response?.success || response?.data) {
        const vendorData = response.data || response;
        const vendorId =
          vendorData.vendorId ||
          vendorData._id ||
          vendorData.data?.vendorId ||
          vendorData.data?._id ||
          localStorage.getItem('vendorId');

        if (vendorId) {
          localStorage.setItem('vendorId', String(vendorId));
          localStorage.setItem('vendorAuthenticated', 'true');
          if (Object.keys(vendorData).length > 0) {
            localStorage.setItem('vendorData', JSON.stringify(vendorData));
          }
          return { authenticated: true, vendor: vendorData };
        }
      }

      clearAuthData();
      return { authenticated: false };
    } catch {
      clearAuthData();
      return { authenticated: false };
    }
  },

  // ── Stalls Management ──

  getPendingStalls: (page = 1, limit = 10) =>
    apiFetch(`${AUTH_URL}/get-pending-stalls?page=${page}&limit=${limit}`, { method: 'GET' }),

  getApprovedStalls: (page = 1, limit = 10) =>
    apiFetch(`${AUTH_URL}/get-approved-stalls?page=${page}&limit=${limit}`, { method: 'GET' }),

  getAllStalls: (page = 1, limit = 10) =>
    apiFetch(`${AUTH_URL}/get-all-stalls?page=${page}&limit=${limit}`, { method: 'GET' }),

  getSingleStall: async (stallId) => {
    if (!stallId) throw new Error('Stall ID is required');
    return apiFetch(`${AUTH_URL}/get-single-stall/${stallId}`, { method: 'GET' });
  },

  approveStall: async (shopId) => {
    if (!shopId) throw new Error('Shop ID is required');
    return apiFetch(`${AUTH_URL}/vendor-admin-approve-stall/${shopId}`, { method: 'PATCH' });
  },

  rejectStall: async (shopId, rejectedReason = 'Documents required, try again') => {
    if (!shopId) throw new Error('Shop ID is required');
    return apiFetch(`${AUTH_URL}/vendor-admin-reject-stall/${shopId}`, {
      method: 'PATCH',
      body: JSON.stringify({ rejectedReason }),
    });
  },

  getVendorPendingStalls: () =>
    apiFetch(`${AUTH_URL}/get-vendor-pending-stalls`, { method: 'GET' }),

  getVendorApprovedStalls: () =>
    apiFetch(`${AUTH_URL}/get-vendor-approved-stalls`, { method: 'GET' }),

  getVendorRejectedStalls: () =>
    apiFetch(`${AUTH_URL}/get-vendor-rejected-stalls`, { method: 'GET' }),

  getVendorStallLicenses: () =>
    apiFetch(`${AUTH_URL}/get-vendor-stall-licences`, { method: 'GET' }),

  // ── Mall Offers ──

  getMallActiveOffers: () =>
    apiFetch(`${AUTH_URL}/get-mall-active-offers`, { method: 'GET' }),

  // ── NEW OFFER MANAGEMENT METHODS ──

  // ── Flash Deal Management ──
  getMallActiveFlashDeals: async () => {
    try {
      const response = await apiFetch(`${AUTH_URL}/get-mall-active-flash-deals`, { 
        method: 'GET' 
      });
      console.log('Active flash deals response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching active flash deals:', error);
      return { success: true, flashDeals: [] };
    }
  },

  // Add this method to get ALL flash deals (including inactive/scheduled)
  getAllFlashDeals: async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/seller/get-all-flash-deals`, { 
        method: 'GET' 
      });
      console.log('All flash deals response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching all flash deals:', error);
      return { success: true, flashDeals: [] };
    }
  },

  // Keep this for vendor-specific flash deals
  getVendorFlashDeals: async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/seller/get-vendor-flash-deals`, { 
        method: 'GET' 
      });
      console.log('Vendor flash deals response:', response);
      return response;
    } catch (error) {
      console.error('Error fetching vendor flash deals:', error);
      return { success: true, flashDeals: [] };
    }
  },

    editFlashDeal: async (flashDealId, flashDealData, flashDealImages = []) => {
    if (!flashDealId) throw new Error('Flash Deal ID is required');
    
    const formData = new FormData();
    
    // Append all flash deal data
    Object.keys(flashDealData).forEach((key) => {
      const value = flashDealData[key];
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'discountValue' || key === 'discountType') {
          formData.append(key, value);
        } else if (key === 'startDate' || key === 'endDate') {
          formData.append(key, new Date(value).toISOString());
        } else if (key === 'stock' || key === 'maxPerUser') {
          formData.append(key, parseInt(value));
        } else {
          formData.append(key, value);
        }
      }
    });
    
    // Append new images if any
    if (flashDealImages?.length > 0) {
      flashDealImages.forEach((img) => {
        if (img) formData.append('flashDealImages', img);
      });
    }
    
    return apiFetch(`${API_BASE_URL}/seller/edit-flash-deal/${flashDealId}`, { 
      method: 'PUT', 
      body: formData 
    });
  },

  deleteFlashDeal: async (flashDealId) => {
    if (!flashDealId) throw new Error('Flash Deal ID is required');
    
    const response = await apiFetch(`${API_BASE_URL}/seller/delete-flash-deal/${flashDealId}`, { 
      method: 'DELETE' 
    });
    
    if (response?.success === true) {
      return { success: true, message: 'Flash deal deleted successfully' };
    }
    
    if (response?.message) {
      throw new Error(response.message);
    }
    
    throw new Error(response?.message || 'Failed to delete flash deal');
  },

  getVendorOffers: async () => {
    return apiFetch(`${AUTH_URL}/get-vendor-offers`, { method: 'GET' });
  },

  getSingleOffer: async (offerId) => {
    if (!offerId) throw new Error('Offer ID is required');
    return apiFetch(`${AUTH_URL}/get-single-offer/${offerId}`, { method: 'GET' });
  },

  createOffer: async (offerData, offerImages = []) => {
    try {
      const formData = new FormData();
      
      // Append all offer data
      Object.keys(offerData).forEach((key) => {
        const value = offerData[key];
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'offerValue' || key === 'offerType') {
            formData.append(key, value);
          } else if (key === 'offerStartDate' || key === 'offerEndDate') {
            formData.append(key, new Date(value).toISOString());
          } else {
            formData.append(key, value);
          }
        }
      });
      
      // Append images if any
      if (offerImages?.length > 0) {
        offerImages.forEach((img) => {
          if (img) formData.append('offerImages', img);
        });
      }
      
      return await apiFetch(`${API_BASE_URL}/seller/create-offer`, { 
        method: 'POST', 
        body: formData 
      });
    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  },

  editOffer: async (offerId, offerData, offerImages = []) => {
    if (!offerId) throw new Error('Offer ID is required');
    
    const formData = new FormData();
    
    // Append all offer data
    Object.keys(offerData).forEach((key) => {
      const value = offerData[key];
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'offerValue' || key === 'offerType') {
          formData.append(key, value);
        } else if (key === 'offerStartDate' || key === 'offerEndDate') {
          formData.append(key, new Date(value).toISOString());
        } else {
          formData.append(key, value);
        }
      }
    });
    
    // Append new images if any
    if (offerImages?.length > 0) {
      offerImages.forEach((img) => {
        if (img) formData.append('offerImages', img);
      });
    }
    
    return apiFetch(`${API_BASE_URL}/seller/edit-offer/${offerId}`, { 
      method: 'PUT', 
      body: formData 
    });
  },

  deleteOffer: async (offerId) => {
    if (!offerId) throw new Error('Offer ID is required');
    
    const response = await apiFetch(`${API_BASE_URL}/seller/delete-offer/${offerId}`, { 
      method: 'DELETE' 
    });
    
    // Check if response indicates success
    if (response?.success === true) {
      return { success: true, message: 'Offer deleted successfully' };
    }
    
    // If there's an error message, throw it
    if (response?.message) {
      throw new Error(response.message);
    }
    
    // If response status indicates failure (check for error codes)
    if (response?.status === 403 || response?.status === 401) {
      throw new Error(response.message || 'Access denied');
    }
    
    // Default error
    throw new Error(response?.message || 'Failed to delete offer');
  },

  // ── Event Management ──

  createEvent: async (eventData, eventImage, guestImages = []) => {
    try {
      const formData = new FormData();
      Object.keys(eventData).forEach((key) => {
        const value = eventData[key];
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'guests' && Array.isArray(value)) {
            formData.append('guests', JSON.stringify(value));
          } else if (key.includes('Date') && value) {
            formData.append(key, new Date(value).toISOString());
          } else if (typeof value === 'number') {
            formData.append(key, value.toString());
          } else {
            formData.append(key, value);
          }
        }
      });
      if (!eventImage) throw new Error('Event banner image is required');
      formData.append('eventImages', eventImage);
      if (guestImages?.length > 0) {
        guestImages.forEach((img) => { if (img) formData.append('guestImages', img); });
      }
      return await apiFetch(`${AUTH_URL}/create-events`, { method: 'POST', body: formData });
    } catch (error) {
      if (error.message.includes('Failed to fetch')) throw new Error('Network error. Please check your connection.');
      throw error;
    }
  },

  updateEvent: async (eventId, eventData, eventImage, guestImages = []) => {
    if (!eventId) throw new Error('Event ID is required');
    const formData = new FormData();
    Object.keys(eventData).forEach((key) => {
      const value = eventData[key];
      if (value !== undefined && value !== null && value !== '') {
        if (key === 'guests' && Array.isArray(value)) {
          formData.append('guests', JSON.stringify(value));
        } else if (key.includes('Date') && value) {
          formData.append(key, new Date(value).toISOString());
        } else if (typeof value === 'number') {
          formData.append(key, value.toString());
        } else {
          formData.append(key, value);
        }
      }
    });
    if (eventImage) formData.append('eventImages', eventImage);
    if (guestImages?.length > 0) {
      guestImages.forEach((img) => { if (img) formData.append('guestImages', img); });
    }
    return apiFetch(`${AUTH_URL}/update-events/${eventId}`, { method: 'PUT', body: formData });
  },

  deleteEvent: async (eventId) => {
    if (!eventId) throw new Error('Event ID is required');
    const response = await apiFetch(`${AUTH_URL}/delete-events/${eventId}`, { method: 'DELETE' });
    if (response?.success || response?.message?.includes('success')) {
      return { success: true, message: 'Event deleted successfully' };
    }
    return response;
  },

  getVendorEvents: async () => {
    try {
      const response = await apiFetch(`${AUTH_URL}/get-vendor-events`, { method: 'GET' });
      if (response?.success && response?.data) return response.data;
      if (Array.isArray(response)) return response;
      if (response?.data && Array.isArray(response.data)) return response.data;
      return [];
    } catch (error) {
      console.error('Get Vendor Events Error:', error);
      return [];
    }
  },

  getSingleVendorEvent: async (eventId) => {
    if (!eventId) throw new Error('Event ID is required');
    const response = await apiFetch(`${AUTH_URL}/get-single-vendor-event/${eventId}`, { method: 'GET' });
    return response?.data || response;
  },

  getVendorScheduledEvents: async () => {
    try {
      const response = await apiFetch(`${AUTH_URL}/get-vendor-scheduled-events`, { method: 'GET' });
      if (response?.success && response?.data) return response.data;
      if (Array.isArray(response)) return response;
      return [];
    } catch {
      return [];
    }
  },

  getVendorActiveEvents: async () => {
    try {
      const response = await apiFetch(`${AUTH_URL}/get-vendor-active-events`, { method: 'GET' });
      if (response?.success && response?.data) return response.data;
      if (Array.isArray(response)) return response;
      return [];
    } catch {
      return [];
    }
  },

  deleteVendor: async (vendorId) => {
    try {
      return await apiFetch(`${API_BASE_URL}/delete-vendor/${vendorId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Delete Vendor Error:', error);
      throw error;
    }
  },
};

export default vendorApi;