const API_BASE_URL = 'https://mallsphere.ae/api/super-admin';

// ==================== TOKEN REFRESH MANAGEMENT ====================

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
};

// ==================== HELPER FUNCTIONS ====================

const getSuperAdminData = () => {
  const localData = localStorage.getItem('superAdminData');
  return localData ? JSON.parse(localData) : null;
};

const getSuperAdminId = () => {
  const data = getSuperAdminData();
  return data?.id || null;
};

const storeAuthData = (data) => {
  if (data.superAdmin) {
    localStorage.setItem('superAdminData', JSON.stringify(data.superAdmin));
    localStorage.setItem('isAuthenticated', 'true');
  }
};

const clearAuthData = () => {
  localStorage.removeItem('superAdminData');
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('pendingSuperAdminEmail');
  localStorage.removeItem('resetPasswordEmail');
};

const isAuthenticated = () => {
  return (
    localStorage.getItem('isAuthenticated') === 'true' &&
    !!getSuperAdminData()
  );
};

// ==================== STANDALONE REFRESH ====================
// Does NOT go through authFetch — avoids infinite loops.
// Returns true on success, throws on failure.
const doRefresh = async () => {
  const response = await fetch(`${API_BASE_URL}/super-admin-refresh-token`, {
    method: 'GET',
    credentials: 'include',
  });

  let data = {};
  try {
    data = await response.json();
  } catch { /* cookie-only response — no body needed */ }

  if (!response.ok) {
    throw new Error(data?.message || 'Token refresh failed');
  }

  return true;
};

// ==================== BASE FETCH (raw Response) ====================
const baseFetch = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        // Remove Content-Type for FormData so browser sets boundary
        ...(options.body instanceof FormData ? { 'Content-Type': undefined } : {}),
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please check your internet connection.');
    }
    if (error instanceof TypeError) {
      throw new Error('Network error. Please check your internet connection.');
    }
    throw error;
  }
};

// ==================== AUTH FETCH WITH AUTO REFRESH ====================
// Fixed:
//   1. On 401 → silently refreshes token then retries instead of logging out
//   2. Concurrent 401s queue up and wait for single refresh
//   3. Only clears auth and redirects if refresh itself fails
//   4. Returns raw Response — apiFetch parses JSON once

const authFetch = async (url, options = {}) => {
  // ── First attempt ──
  let response = await baseFetch(url, options);

  if (response.ok) return response; // raw Response

  // Consume error body once
  let errorData = {};
  try {
    const ct = response.headers.get('content-type');
    if (ct && ct.includes('application/json')) {
      errorData = await response.json();
    } else {
      errorData = { message: await response.text() };
    }
  } catch { /* ignore */ }

  // Only attempt refresh on 401
  if (response.status !== 401) {
    throw new Error(
      errorData?.message || errorData?.error || `Request failed with status ${response.status}`
    );
  }

  // ── 401: refresh then retry ──

  if (isRefreshing) {
    // Queue this request until the in-progress refresh completes
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then(async () => {
      const retryRes = await baseFetch(url, options);
      if (!retryRes.ok) {
        const errData = await retryRes.json().catch(() => ({}));
        throw new Error(
          errData?.message || errData?.error || `Retry failed with status ${retryRes.status}`
        );
      }
      return retryRes;
    });
  }

  // ── This request owns the refresh ──
  isRefreshing = true;

  try {
    await doRefresh(); // throws on failure

    processQueue(null); // unblock all queued requests

    // Retry the original request with fresh cookies
    const retryResponse = await baseFetch(url, options);

    if (!retryResponse.ok) {
      const errData = await retryResponse.json().catch(() => ({}));

      if (retryResponse.status === 401) {
        // Refresh token itself expired — force logout
        clearAuthData();
        if (!window.location.pathname.includes('/super-admin/login')) {
          window.location.href = '/super-admin/login';
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
    if (!window.location.pathname.includes('/super-admin/login')) {
      window.location.href = '/super-admin/login';
    }
    throw refreshError;

  } finally {
    isRefreshing = false;
  }
};

// ==================== CONVENIENCE WRAPPER ====================
// Calls authFetch and parses JSON in one step.
const apiFetch = async (url, options = {}) => {
  const response = await authFetch(url, options);
  try {
    return await response.json();
  } catch {
    return {}; // 204 No Content or empty body
  }
};

// ==================== SUPER ADMIN AUTH ====================

export const superAdminAuth = {
  // Helpers
  isAuthenticated,
  getSuperAdminId,
  getSuperAdminData,
  clearAuthData,

  // ── Public Auth Endpoints (no token refresh needed) ──

  register: async (name, email, password) => {
    try {
      const response = await baseFetch(`${API_BASE_URL}/super-admin-register`, {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');
      if (data.success) localStorage.setItem('pendingSuperAdminEmail', email);
      return data;
    } catch (error) {
      console.error('Registration Error:', error);
      throw error;
    }
  },

  verifyOTP: async (email, otp) => {
    try {
      const response = await baseFetch(`${API_BASE_URL}/super-admin-verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'OTP verification failed');
      if (data.message?.includes('successfully')) {
        localStorage.removeItem('pendingSuperAdminEmail');
      }
      return data;
    } catch (error) {
      console.error('OTP Verification Error:', error);
      throw error;
    }
  },

  resendOTP: async (email) => {
    try {
      const response = await baseFetch(`${API_BASE_URL}/super-admin-resend-otp`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to resend OTP');
      return data;
    } catch (error) {
      console.error('Resend OTP Error:', error);
      throw error;
    }
  },

  login: async (email, password) => {
    try {
      clearAuthData();
      const response = await baseFetch(`${API_BASE_URL}/super-admin-login`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Login failed');
      if (data.success && data.superAdmin) storeAuthData(data);
      return data;
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await baseFetch(`${API_BASE_URL}/super-admin-logout`, { method: 'POST' });
      clearAuthData();
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout Error:', error);
      clearAuthData();
      return { success: true, message: 'Logged out locally' };
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await baseFetch(`${API_BASE_URL}/super-admin-forgot-password`, {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Request failed');
      if (data.message?.includes('successfully')) {
        localStorage.setItem('resetPasswordEmail', email);
      }
      return data;
    } catch (error) {
      console.error('Forgot Password Error:', error);
      throw error;
    }
  },

  verifyResetOTP: async (email, otp) => {
    try {
      const response = await baseFetch(`${API_BASE_URL}/super-admin-verify-forgot-password-otp`, {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'OTP verification failed');
      return data;
    } catch (error) {
      console.error('Password Reset OTP Verification Error:', error);
      throw error;
    }
  },

  resetPassword: async (email, otp, newPassword, confirmPassword) => {
    try {
      const response = await baseFetch(`${API_BASE_URL}/super-admin-reset-password`, {
        method: 'POST',
        body: JSON.stringify({ email, otp, newPassword, confirmPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Password reset failed');
      if (data.message?.includes('successful')) {
        localStorage.removeItem('resetPasswordEmail');
      }
      return data;
    } catch (error) {
      console.error('Reset Password Error:', error);
      throw error;
    }
  },

  // ── Protected Endpoints (auto-refresh on 401) ──

  refreshToken: async () => {
    try {
      return await doRefresh();
    } catch (error) {
      console.error('Refresh Token Error:', error);
      throw error;
    }
  },

  getProfile: async () => {
    try {
      const response = await apiFetch(`${API_BASE_URL}/super-admin-profile`, { method: 'GET' });
      if (response.success && response.superAdmin) {
        localStorage.setItem('superAdminData', JSON.stringify(response.superAdmin));
      }
      return response;
    } catch (error) {
      console.error('Get Profile Error:', error);
      throw error;
    }
  },

  changePassword: async (oldPassword, newPassword, confirmPassword) => {
    try {
      return await apiFetch(`${API_BASE_URL}/super-admin-change-password`, {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
      });
    } catch (error) {
      console.error('Change Password Error:', error);
      throw error;
    }
  },

  // ── Vendor Management (all protected) ──

  getPendingVendors: async () => {
    try {
      return await apiFetch(`${API_BASE_URL}/pending-vendors`, { method: 'GET' });
    } catch (error) {
      console.error('Get Pending Vendors Error:', error);
      throw error;
    }
  },

  getApprovedVendors: async () => {
    try {
      return await apiFetch(`${API_BASE_URL}/approved-vendors`, { method: 'GET' });
    } catch (error) {
      console.error('Get Approved Vendors Error:', error);
      throw error;
    }
  },

  getRejectedVendors: async () => {
    try {
      return await apiFetch(`${API_BASE_URL}/rejected-vendors`, { method: 'GET' });
    } catch (error) {
      console.error('Get Rejected Vendors Error:', error);
      throw error;
    }
  },

  getAllVendors: async () => {
    try {
      return await apiFetch(`${API_BASE_URL}/all-vendors`, { method: 'GET' });
    } catch (error) {
      console.error('Get All Vendors Error:', error);
      throw error;
    }
  },

  getSingleVendor: async (vendorId) => {
    try {
      return await apiFetch(`${API_BASE_URL}/single-vendor/${vendorId}`, { method: 'GET' });
    } catch (error) {
      console.error('Get Single Vendor Error:', error);
      throw error;
    }
  },

  approveVendor: async (vendorId) => {
    try {
      return await apiFetch(`${API_BASE_URL}/super-admin-approve-vendor/${vendorId}`, {
        method: 'PATCH',
      });
    } catch (error) {
      console.error('Approve Vendor Error:', error);
      throw error;
    }
  },

  rejectVendor: async (vendorId, reason = '') => {
    try {
      return await apiFetch(`${API_BASE_URL}/super-admin-reject-vendor/${vendorId}`, {
        method: 'PATCH',
        ...(reason ? { body: JSON.stringify({ reason }) } : {}),
      });
    } catch (error) {
      console.error('Reject Vendor Error:', error);
      throw error;
    }
  },

  // ── Utilities ──

  validatePassword(password) {
    const requirements = {
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password),
      hasMinLength: password.length >= 6,
    };
    const isValid = Object.values(requirements).every(Boolean);
    return {
      isValid,
      requirements,
      message: isValid
        ? 'Password is strong'
        : 'Password must contain uppercase, lowercase, number, special character, and be at least 6 characters long',
    };
  },

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  validateName(name) {
    return name.length >= 3;
  },

  debugAuth: () => {
    const data = getSuperAdminData();
    const isAuth = isAuthenticated();
    console.log('Is Authenticated:', isAuth);
    console.log('Cookies visible to JS:', document.cookie || 'None (HTTP-only cookies not visible)');
    console.log('Super Admin Data (local):', data);
    console.log('localStorage keys:', Object.keys(localStorage));
    return { isAuth, hasLocalData: !!data, cookies: document.cookie };
  },

  testConnection: async () => {
    try {
      const response = await fetch(API_BASE_URL, { method: 'GET', credentials: 'include' });
      return response.ok;
    } catch {
      return false;
    }
  },
};

export default superAdminAuth;