// sellerApi.js
import { compressImages } from '../../src/components/utils/compressImage.js'; // adjust path to match your project

const API_BASE_URL = 'https://mallsphere.ae/api';
const SELLER_URL = `${API_BASE_URL}/seller`;

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
};

const safeParseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let body;
  try {
    body = isJson ? await response.json() : await response.text();
  } catch {
    if (!response.ok) {
      const err = new Error(`Request failed with status ${response.status}`);
      err.status = response.status;
      throw err;
    }
    return {};
  }

  if (!response.ok) {
    const message = isJson
      ? (body?.message || body?.error || `Request failed with status ${response.status}`)
      : (body || `Request failed with status ${response.status}`);
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  return isJson ? body : { message: body };
};

const handleApiError = (error, context = '') => {
  console.error(`API Error ${context}:`, error);

  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    throw new Error('Network error. Please check your internet connection.');
  }

  if (error.status) {
    switch (error.status) {
      case 401:
        throw new Error('Your session has expired. Please login again.');
      case 403:
        if (
          error.message?.toLowerCase().includes('approv') ||
          error.message?.toLowerCase().includes('pending')
        ) {
          throw new Error('Your account is pending approval. Please wait for vendor verification.');
        }
        throw new Error('You do not have permission to perform this action.');
      case 404:
        throw new Error('The requested resource was not found.');
      case 413:
        throw new Error('Upload too large. Please use smaller images (under 1MB each).');
      case 429:
        throw new Error(error.message || 'Too many requests. Please try again later.');
      case 500:
      case 502:
      case 503:
        throw new Error('Server error. Please try again later.');
      default:
        throw new Error(error.message || `Request failed with status ${error.status}`);
    }
  }

  if (error instanceof Error) throw error;
  throw new Error(error?.message || 'An unexpected error occurred');
};

const authenticatedFetch = async (url, options = {}) => {
  const buildOptions = (opts) => {
    const built = { ...opts, credentials: 'include', headers: { ...(opts.headers || {}) } };
    if (opts.body instanceof FormData) {
      delete built.headers['Content-Type'];
    } else if (!built.headers['Content-Type']) {
      built.headers['Content-Type'] = 'application/json';
    }
    return built;
  };

  const defaultOptions = buildOptions(options);

  let response;
  try {
    response = await fetch(url, defaultOptions);
  } catch {
    throw { status: 0, message: 'Network error. Please check your connection.' };
  }

  if (response.status === 401) {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() =>
        fetch(url, defaultOptions).then(async (retryRes) => {
          if (!retryRes.ok) {
            const errData = await retryRes.json().catch(() => ({}));
            throw { status: retryRes.status, message: errData.message || `Request failed with status ${retryRes.status}` };
          }
          return retryRes;
        })
      );
    }

    isRefreshing = true;
    try {
      await sellerApi.refreshToken();
      processQueue();
      const retryResponse = await fetch(url, defaultOptions);
      if (retryResponse.status === 401) {
        sellerApi.clearAuthData();
        throw { status: 401, message: 'Session expired. Please login again.' };
      }
      if (!retryResponse.ok) {
        const errData = await retryResponse.json().catch(() => ({}));
        throw { status: retryResponse.status, message: errData.message || `Request failed with status ${retryResponse.status}` };
      }
      return retryResponse;
    } catch (refreshError) {
      processQueue(refreshError);
      sellerApi.clearAuthData();
      throw { status: 401, message: 'Session expired. Please login again.' };
    } finally {
      isRefreshing = false;
    }
  }

  if (response.status === 403) {
    let errorData = {};
    try { errorData = await response.json(); } catch { }
    if (
      errorData.message?.toLowerCase().includes('approv') ||
      errorData.message?.toLowerCase().includes('pending') ||
      errorData.message?.toLowerCase().includes('not approved')
    ) {
      throw { status: 403, message: 'Your account is pending approval. Please wait for vendor verification.', requiresApproval: true };
    }
    throw { status: 403, message: errorData.message || 'Access denied. You may not have permission to view this resource.' };
  }

  if (!response.ok) {
    let errorMessage;
    try {
      const ct = response.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const errData = await response.json();
        errorMessage = errData.message || errData.error;
      } else {
        errorMessage = await response.text();
      }
    } catch {
      errorMessage = response.statusText;
    }
    throw { status: response.status, message: errorMessage || `Request failed with status ${response.status}` };
  }

  return response;
};

const getSellerId = () => localStorage.getItem('sellerId');
const getShopId = () => localStorage.getItem('shopId');

const storeAuthData = (data) => {
  if (data.sellerId) localStorage.setItem('sellerId', data.sellerId);
  const shopId = data.shopId || data.data?.shopId || data.seller?.shopId || data.sellerData?.shopId || data.sellerId;
  if (shopId) localStorage.setItem('shopId', shopId);
  else console.warn('No shopId found in login response:', data);
  localStorage.setItem('sellerAuthenticated', 'true');
  if (data.email) localStorage.setItem('sellerEmail', data.email);
  if (data.seller) {
    localStorage.setItem('sellerData', JSON.stringify(data.seller));
    if (data.seller.vendorApprovalStatus) localStorage.setItem('vendorApprovalStatus', data.seller.vendorApprovalStatus);
  }
  if (data.accessTokenValue) localStorage.setItem('accessToken', data.accessTokenValue);
  if (data.refreshTokenValue) localStorage.setItem('refreshToken', data.refreshTokenValue);
};

const clearAuthData = () => {
  ['sellerId','sellerAuthenticated','sellerEmail','sellerData','shopId','accessToken','refreshToken','vendorApprovalStatus']
    .forEach((key) => localStorage.removeItem(key));
};

const isAuthenticated = () =>
  localStorage.getItem('sellerAuthenticated') === 'true' && !!localStorage.getItem('sellerId');

const ensureShopId = async () => {
  let shopId = localStorage.getItem('shopId');
  if (!shopId || shopId === 'undefined' || shopId === 'null') {
    try {
      const profile = await sellerApi.getSellerStallProfile();
      shopId = profile.shopId || profile.data?.shopId || profile.seller?.shopId || profile.data?.sellerId;
      if (shopId) localStorage.setItem('shopId', shopId);
      else { shopId = localStorage.getItem('sellerId'); if (shopId) localStorage.setItem('shopId', shopId); }
    } catch (error) {
      shopId = localStorage.getItem('sellerId');
      if (shopId) localStorage.setItem('shopId', shopId);
    }
  }
  return shopId;
};

const getErrorSuggestion = (error) => {
  if (error.status === 403) {
    if (error.message?.toLowerCase().includes('approv') || error.requiresApproval) return 'Your account needs approval from the vendor admin. Please contact support.';
    return 'You do not have permission to perform this action.';
  }
  if (error.status === 401) return 'Your session has expired. Please login again.';
  if (error.status === 404) return 'The requested resource was not found.';
  if (error.status >= 500) return 'Server error. Please try again later.';
  return 'An unexpected error occurred. Please try again.';
};

export const sellerApi = {
  isAuthenticated, getSellerId, getShopId, storeAuthData, clearAuthData, ensureShopId, getErrorSuggestion,

  checkAccountStatus: async () => {
    try {
      const profile = await sellerApi.getSellerStallProfile().catch(() => null);
      const sellerDataStr = localStorage.getItem('sellerData');
      const sellerData = sellerDataStr ? JSON.parse(sellerDataStr) : {};
      const approvalStatus = localStorage.getItem('vendorApprovalStatus') || sellerData?.vendorApprovalStatus || profile?.data?.vendorApprovalStatus || profile?.seller?.vendorApprovalStatus || 'unknown';
      return {
        isAuthenticated: isAuthenticated(),
        hasSellerId: !!localStorage.getItem('sellerId'),
        hasShopId: !!localStorage.getItem('shopId'),
        hasSellerData: !!sellerDataStr,
        vendorApprovalStatus: approvalStatus,
        isEmailVerified: sellerData?.isEmailVerified || profile?.data?.isEmailVerified || false,
        isActive: sellerData?.isActive || profile?.data?.isActive || false,
        profileFetchStatus: profile ? 'success' : 'failed',
        profileData: profile,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return { isAuthenticated: isAuthenticated(), error: error.message, errorStatus: error.status, hasLocalData: !!localStorage.getItem('sellerData'), suggestion: getErrorSuggestion(error), timestamp: new Date().toISOString() };
    }
  },

  registerSellerStall: async (sellerData, profilePicture, sellerShopImages) => {
    try {
      const formData = new FormData();
      formData.append('name', sellerData.name);
      formData.append('email', sellerData.email);
      formData.append('password', sellerData.password);
      formData.append('licenseId', sellerData.licenseId);
      formData.append('mallName', sellerData.mallName);
      formData.append('shopName', sellerData.shopName);
      formData.append('category', sellerData.category);
      formData.append('sellerShopAddress', sellerData.sellerShopAddress);
      formData.append('sellerContactNumber', sellerData.sellerContactNumber);
      formData.append('location', sellerData.location);
      formData.append('floorNumber', sellerData.floorNumber);

      if (!profilePicture) throw new Error('Profile picture is required');
      const [compressedProfile] = await compressImages([profilePicture], 400, 800);
      formData.append('profilePicture', compressedProfile);

      if (!sellerShopImages?.length) throw new Error('At least one shop image required');
      const compressedShopImages = await compressImages(sellerShopImages, 500, 1200);
      compressedShopImages.forEach((img) => formData.append('sellerShopImage', img));

      const response = await fetch(`${SELLER_URL}/seller-stall-register`, { method: 'POST', body: formData, credentials: 'include' });
      const data = await safeParseResponse(response);
      storeAuthData(data);
      return data;
    } catch (err) {
      return handleApiError(err, 'in registration');
    }
  },

  loginSellerStall: async (email, password) => {
    try {
      const response = await fetch(`${SELLER_URL}/seller-stall-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), credentials: 'include' });
      const data = await safeParseResponse(response);
      storeAuthData(data);
      return data;
    } catch (err) {
      return handleApiError(err, 'during login');
    }
  },

  logoutSellerStall: async () => {
    try { await fetch(`${SELLER_URL}/seller-stall-logout`, { method: 'POST', credentials: 'include' }); } catch { }
    clearAuthData();
    return { success: true, message: 'Logged out successfully' };
  },

  verifyOtp: async (email, otp) => {
    try {
      const response = await fetch(`${SELLER_URL}/seller-stall-verify-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp }), credentials: 'include' });
      return await safeParseResponse(response);
    } catch (error) { return handleApiError(error, 'during OTP verification'); }
  },

  resendOtp: async (email) => {
    try {
      const response = await fetch(`${SELLER_URL}/seller-stall-resend-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }), credentials: 'include' });
      return await safeParseResponse(response);
    } catch (error) { return handleApiError(error, 'while resending OTP'); }
  },

  forgotPassword: async (email) => {
    try {
      const response = await fetch(`${SELLER_URL}/seller-stall-forgot-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }), credentials: 'include' });
      return await safeParseResponse(response);
    } catch (error) { return handleApiError(error, 'during forgot password'); }
  },

  verifyForgotPasswordOtp: async (email, otp) => {
    try {
      const response = await fetch(`${SELLER_URL}/seller-verify-forgot-password-otp`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp }), credentials: 'include' });
      return await safeParseResponse(response);
    } catch (error) { return handleApiError(error, 'during OTP verification'); }
  },

  resetPassword: async (email, otp, newPassword, confirmPassword) => {
    try {
      const response = await fetch(`${SELLER_URL}/seller-stall-reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, otp, newPassword, confirmPassword }), credentials: 'include' });
      return await safeParseResponse(response);
    } catch (error) { return handleApiError(error, 'during password reset'); }
  },

  changePassword: async (oldPassword, newPassword, confirmPassword) => {
    try {
      const res = await authenticatedFetch(`${SELLER_URL}/seller-stall-change-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ oldPassword, newPassword, confirmPassword }) });
      return await safeParseResponse(res);
    } catch (error) { return handleApiError(error, 'while changing password'); }
  },

  refreshToken: async () => {
    try {
      const res = await fetch(`${SELLER_URL}/seller-stall-refresh-token`, { method: 'POST', credentials: 'include', headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } });
      if (!res.ok) {
        const ct = res.headers.get('content-type') || '';
        let msg = 'Refresh token failed';
        try { msg = ct.includes('application/json') ? (await res.json()).message || msg : (await res.text()) || msg; } catch { }
        throw { status: res.status, message: msg };
      }
      try {
        const ct = res.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const data = await res.json();
          if (data.accessTokenValue) localStorage.setItem('accessToken', data.accessTokenValue);
          if (data.refreshTokenValue) localStorage.setItem('refreshToken', data.refreshTokenValue);
        }
      } catch { }
      return true;
    } catch (err) {
      clearAuthData();
      throw { status: 401, message: 'Session expired. Please login again.' };
    }
  },

  getSellerStallProfile: async () => {
    try {
      const res = await authenticatedFetch(`${SELLER_URL}/seller-stall-profile`);
      const data = await safeParseResponse(res);
      const shopId = data.shopId || data.data?.shopId || data.seller?.shopId || data.data?.sellerId || data.sellerId;
      if (shopId) localStorage.setItem('shopId', shopId);
      const approvalStatus = data.vendorApprovalStatus || data.data?.vendorApprovalStatus || data.seller?.vendorApprovalStatus;
      if (approvalStatus) localStorage.setItem('vendorApprovalStatus', approvalStatus);
      return data;
    } catch (error) { return handleApiError(error, 'fetching profile'); }
  },

  createOffer: async (offerData, offerImages) => {
    try {
      let shopId = offerData.shopId;
      if (!shopId || shopId === 'undefined' || shopId === 'null') shopId = await ensureShopId();
      if (!shopId) throw new Error('No valid shop ID found. Please ensure you have a shop associated with your account.');
      if (!offerImages?.length) throw new Error('At least one offer image is required');
      if (offerImages.length > 4) throw new Error('Maximum 4 images allowed');

      const compressedImages = await compressImages(offerImages, 500, 1200);

      const formData = new FormData();
      formData.append('shopId', shopId);
      formData.append('offerTitle', offerData.offerTitle || '');
      formData.append('offerDescription', offerData.offerDescription || '');
      formData.append('offerStartDate', offerData.offerStartDate || '');
      formData.append('offerEndDate', offerData.offerEndDate || '');
      formData.append('offerTermsAndConditions', offerData.offerTermsAndConditions || '');
      formData.append('offerType', offerData.offerType || 'percentage');
      formData.append('offerValue', String(offerData.offerValue || 0));
      compressedImages.forEach((img) => formData.append('offerImages', img));

      const res = await authenticatedFetch(`${SELLER_URL}/offer-create`, { method: 'POST', body: formData });
      return await safeParseResponse(res);
    } catch (error) { return handleApiError(error, 'creating offer'); }
  },

  getCreatedOffers: async () => {
    try { const res = await authenticatedFetch(`${SELLER_URL}/get-created-offers`); return await safeParseResponse(res); }
    catch (error) { return handleApiError(error, 'fetching created offers'); }
  },

  deleteOffer: async (offerId) => {
    try { const res = await authenticatedFetch(`${SELLER_URL}/delete-offer/${offerId}`, { method: 'DELETE' }); return await safeParseResponse(res); }
    catch (error) { return handleApiError(error, 'deleting offer'); }
  },

  enableOffer: async (offerId, offerStartDate, offerEndDate) => {
    try { const res = await authenticatedFetch(`${SELLER_URL}/enable-offer/${offerId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ offerStartDate, offerEndDate }) }); return await safeParseResponse(res); }
    catch (error) { return handleApiError(error, 'enabling offer'); }
  },

  disableOffer: async (offerId) => {
    try { const res = await authenticatedFetch(`${SELLER_URL}/disable-offer/${offerId}`, { method: 'PUT' }); return await safeParseResponse(res); }
    catch (error) { return handleApiError(error, 'disabling offer'); }
  },

  getActiveOffers: async (page = 1, limit = 10) => {
    try { const res = await authenticatedFetch(`${SELLER_URL}/get-active-offers?page=${page}&limit=${limit}`); return await safeParseResponse(res); }
    catch (error) { return handleApiError(error, 'fetching active offers'); }
  },

  getScheduledOffers: async (page = 1, limit = 10) => {
    try { const res = await authenticatedFetch(`${SELLER_URL}/get-scheduled-offers?page=${page}&limit=${limit}`); return await safeParseResponse(res); }
    catch (error) { return handleApiError(error, 'fetching scheduled offers'); }
  },

  getExpiredOffers: async (page = 1, limit = 10) => {
    try { const res = await authenticatedFetch(`${SELLER_URL}/get-expired-offers?page=${page}&limit=${limit}`); return await safeParseResponse(res); }
    catch (error) { return handleApiError(error, 'fetching expired offers'); }
  },

  getDisabledOffers: async (page = 1, limit = 10) => {
    try { const res = await authenticatedFetch(`${SELLER_URL}/get-disabled-offers?page=${page}&limit=${limit}`); return await safeParseResponse(res); }
    catch (error) { return handleApiError(error, 'fetching disabled offers'); }
  },

  getSingleOffer: async (offerId) => {
    try {
      if (!offerId) throw new Error('Offer ID is required');
      const res = await authenticatedFetch(`${SELLER_URL}/get-single-offer/${offerId}`);
      return await safeParseResponse(res);
    } catch (error) { return handleApiError(error, 'fetching offer details'); }
  },

  editOffer: async (offerId, offerData, offerImages = []) => {
    try {
      if (!offerId) throw new Error('Offer ID is required');
      const hasNewImages = offerImages && offerImages.length > 0;
      if (hasNewImages) {
        if (offerImages.length > 4) throw new Error('Maximum 4 images allowed');
        const compressedImages = await compressImages(offerImages, 500, 1200);
        const formData = new FormData();
        Object.entries(offerData).forEach(([key, val]) => { if (val !== undefined && val !== null && val !== '') formData.append(key, key === 'offerValue' ? String(val) : val); });
        compressedImages.forEach((img) => formData.append('offerImages', img));
        const res = await authenticatedFetch(`${SELLER_URL}/edit-offer/${offerId}`, { method: 'PUT', body: formData });
        return await safeParseResponse(res);
      } else {
        const cleanData = Object.fromEntries(Object.entries(offerData).filter(([, v]) => v !== undefined && v !== null && v !== ''));
        const res = await authenticatedFetch(`${SELLER_URL}/edit-offer/${offerId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cleanData) });
        return await safeParseResponse(res);
      }
    } catch (error) { return handleApiError(error, 'editing offer'); }
  },

  createFlashDeal: async (flashDealData, flashDealImages = []) => {
    try {
      const sellerId = localStorage.getItem('sellerId');
      const isAuth = localStorage.getItem('sellerAuthenticated') === 'true';
      const approvalStatus = localStorage.getItem('vendorApprovalStatus');
      if (!sellerId || !isAuth) throw new Error('You are not logged in. Please login as a seller first.');
      if (approvalStatus && approvalStatus !== 'approved') throw new Error(`Your account is ${approvalStatus}. Please wait for vendor verification.`);

      const requiredFields = ['flashDealTitle','flashDealStartTime','flashDealEndTime','flashDealType','flashDealValue','timezone'];
      const missingFields = requiredFields.filter((f) => { const v = flashDealData[f]; return v === undefined || v === null || v === ''; });
      if (missingFields.length > 0) throw new Error(`Missing required fields: ${missingFields.join(', ')}`);

      if (flashDealData.flashDealType === 'percentage') {
        const v = Number(flashDealData.flashDealValue);
        if (v < 0 || v > 100) throw new Error('Percentage discount must be between 0 and 100');
      } else {
        if (Number(flashDealData.flashDealValue) < 0) throw new Error('Discount value cannot be negative');
      }

      if (!flashDealImages.length) throw new Error('At least one image is required for flash deal');
      if (flashDealImages.length > 3) throw new Error('Maximum 3 images allowed for flash deals');

      try { await sellerApi.refreshToken(); } catch { }

      const compressedImages = await compressImages(flashDealImages, 500, 1200);

      const formData = new FormData();
      formData.append('flashDealTitle', String(flashDealData.flashDealTitle || '').trim());
      formData.append('flashDealDescription', String(flashDealData.flashDealDescription || '').trim());
      formData.append('flashDealStartTime', String(flashDealData.flashDealStartTime || ''));
      formData.append('flashDealEndTime', String(flashDealData.flashDealEndTime || ''));
      formData.append('flashDealType', String(flashDealData.flashDealType || 'percentage'));
      formData.append('flashDealValue', String(flashDealData.flashDealValue || 0));
      formData.append('flashDealTermsAndConditions', String(flashDealData.flashDealTermsAndConditions || '').trim());
      formData.append('timezone', flashDealData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
      compressedImages.forEach((img) => formData.append('flashDealImages', img));

      const res = await authenticatedFetch(`${SELLER_URL}/create-flash-deal`, { method: 'POST', body: formData });
      return await safeParseResponse(res);
    } catch (error) {
      if (error.status === 401 || error.message?.includes('session expired')) {
        sellerApi.clearAuthData();
        window.location.href = '/seller/login';
        throw new Error('Your session has expired. Please login again.');
      }
      return handleApiError(error, 'creating flash deal');
    }
  },

  getActiveFlashDeals: async () => {
    try { const res = await authenticatedFetch(`${SELLER_URL}/get-active-flash-deals`); return await safeParseResponse(res); }
    catch (error) { return handleApiError(error, 'fetching active flash deals'); }
  },

  getExpiredFlashDeals: async () => {
    try { const res = await authenticatedFetch(`${SELLER_URL}/get-expired-flash-deals`); return await safeParseResponse(res); }
    catch (error) { return handleApiError(error, 'fetching expired flash deals'); }
  },

  getSellerFlashDeals: async () => {
    try { const res = await authenticatedFetch(`${SELLER_URL}/get-seller-flash-deals`); return await safeParseResponse(res); }
    catch (error) { return handleApiError(error, 'fetching seller flash deals'); }
  },

  getSellerActiveFlashDeals: async () => {
    try { const res = await authenticatedFetch(`${SELLER_URL}/get-seller-flash-deal-active`); return await safeParseResponse(res); }
    catch (error) { return handleApiError(error, 'fetching seller active flash deals'); }
  },

  getSellerExpiredFlashDeals: async () => {
    try { const res = await authenticatedFetch(`${SELLER_URL}/get-seller-flash-deal-expired`); return await safeParseResponse(res); }
    catch (error) { return handleApiError(error, 'fetching seller expired flash deals'); }
  },

  getSellerScheduledFlashDeals: async () => {
    try { const res = await authenticatedFetch(`${SELLER_URL}/get-seller-flash-deal-scheduled`); return await safeParseResponse(res); }
    catch (error) { return handleApiError(error, 'fetching seller scheduled flash deals'); }
  },

  getSingleFlashDeal: async (flashDealId) => {
    try {
      if (!flashDealId) throw new Error('Flash deal ID is required');
      const res = await authenticatedFetch(`${SELLER_URL}/get-single-flash-deal/${flashDealId}`);
      return await safeParseResponse(res);
    } catch (error) { return handleApiError(error, 'fetching flash deal details'); }
  },

  editFlashDeal: async (flashDealId, flashDealData, flashDealImages = []) => {
    try {
      if (!flashDealId) throw new Error('Flash deal ID is required');
      if (flashDealData.flashDealValue !== undefined) {
        const dealType = flashDealData.flashDealType || 'percentage';
        const value = Number(flashDealData.flashDealValue);
        if (dealType === 'percentage' && (value < 0 || value > 100)) throw new Error('Percentage discount must be between 0 and 100');
        if (dealType !== 'percentage' && value < 0) throw new Error('Discount value cannot be negative');
      }
      if (flashDealData.flashDealStartTime && flashDealData.flashDealEndTime) {
        if (new Date(flashDealData.flashDealEndTime) <= new Date(flashDealData.flashDealStartTime)) throw new Error('End time must be greater than start time');
      }
      const hasNewImages = flashDealImages && flashDealImages.length > 0;
      if (hasNewImages) {
        if (flashDealImages.length > 3) throw new Error('Maximum 3 images allowed for flash deals');
        const compressedImages = await compressImages(flashDealImages, 500, 1200);
        const formData = new FormData();
        Object.entries(flashDealData).forEach(([key, val]) => { if (val !== undefined && val !== null) formData.append(key, key === 'flashDealValue' ? String(val) : val); });
        compressedImages.forEach((img) => formData.append('flashDealBanners', img));
        const res = await authenticatedFetch(`${SELLER_URL}/edit-flash-deal/${flashDealId}`, { method: 'PUT', body: formData });
        return await safeParseResponse(res);
      } else {
        const cleanData = Object.fromEntries(Object.entries(flashDealData).filter(([, v]) => v !== undefined && v !== null));
        const res = await authenticatedFetch(`${SELLER_URL}/edit-flash-deal/${flashDealId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cleanData) });
        return await safeParseResponse(res);
      }
    } catch (error) { return handleApiError(error, 'editing flash deal'); }
  },

  deleteFlashDeal: async (flashDealId) => {
    try {
      if (!flashDealId) throw new Error('Flash deal ID is required');
      const res = await authenticatedFetch(`${SELLER_URL}/delete-flash-deal/${flashDealId}`, { method: 'DELETE' });
      return await safeParseResponse(res);
    } catch (error) { return handleApiError(error, 'deleting flash deal'); }
  },

  validateOfferDates: (startDate, endDate) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const start = new Date(startDate); const end = new Date(endDate);
    if (isNaN(start.getTime())) throw new Error('Invalid start date');
    if (isNaN(end.getTime())) throw new Error('Invalid end date');
    if (start < today) throw new Error('Start date cannot be in the past');
    if (end <= start) throw new Error('End date must be after start date');
    return true;
  },

  formatOfferData: (offer) => {
    if (!offer) return null;
    return { ...offer, formattedStartDate: offer.offerStartDate ? new Date(offer.offerStartDate).toLocaleDateString() : 'N/A', formattedEndDate: offer.offerEndDate ? new Date(offer.offerEndDate).toLocaleDateString() : 'N/A', isActive: offer.offerStatus === 'active' && offer.isEnabled, isScheduled: offer.offerStatus === 'scheduled' && offer.isEnabled, isExpired: offer.offerStatus === 'expired', isDisabled: !offer.isEnabled };
  },

  formatFlashDealData: (deal) => {
    if (!deal) return null;
    const startTime = deal.flashDealStartTime || deal.startTime;
    const endTime = deal.flashDealEndTime || deal.endTime;
    return { ...deal, formattedStartTime: startTime ? new Date(startTime).toLocaleString() : 'N/A', formattedEndTime: endTime ? new Date(endTime).toLocaleString() : 'N/A', isActive: deal.status === 'active', isScheduled: deal.status === 'scheduled', isExpired: deal.status === 'expired', discountDisplay: deal.dealType === 'percentage' ? `${deal.dealValue}% OFF` : `₹${deal.dealValue} OFF`, bannerUrls: deal.banners?.map((b) => b.url) || [] };
  },
};

export default sellerApi;