import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import sellerApi from "../../hooks/sellerApi";
import { ITEMS_PER_PAGE } from "../../components/utils/constants";
import {
  emptyForm,
  calculateStats,
  filterOffers,
  validateOfferDates,
  validateDiscountValue,
  getChangedFields
} from "../../components/utils/offerHelpers";
import { useAuth } from '../../context/AuthContext';

// Components
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Toast from "../../components/common/Toast";
import Pagination from "../../components/common/Pagination";
import SellerHeader from "../../components/seller/dashboard/SellerHeader";
import SellerTabs from "../../components/seller/dashboard/SellerTabs";
import StatsCards from "../../components/seller/dashboard/StatsCards";
import FilterBar from "../../components/seller/dashboard/FilterBar";
import ViewToggle from "../../components/seller/dashboard/ViewToggle";
import OfferGrid from "../../components/seller/offers/OfferGrid";
import OfferList from "../../components/seller/offers/OfferList";
import CreateEditOfferModal from "../../components/seller/offers/CreateEditOfferModal";
import OfferDetailModal from "../../components/seller/offers/OfferDetailModal";
import SellerProfile from "../../components/seller/profile/SellerProfile";

export default function StallOwnerDashboard() {
  const navigate = useNavigate();
  const { logoutSeller } = useAuth();
  const [activeTab, setActiveTab] = useState("offers");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [dealType, setDealType] = useState("all");

  const [allOffers, setAllOffers] = useState([]);
  const [allFlashDeals, setAllFlashDeals] = useState([]);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [toast, setToast] = useState(null);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [profile, setProfile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [stats, setStats] = useState({
    all: 0,
    active: 0,
    scheduled: 0,
    expired: 0,
    disabled: 0,
    flash: 0
  });

  // ─── Auth Check ───────────────────────────────
  useEffect(() => {
    const checkAuth = () => {
      if (!sellerApi.isAuthenticated()) {
        navigate('/stall-owner/login');
        return;
      }
      setAuthChecked(true);
      setInitialLoading(false);
    };
    checkAuth();
  }, [navigate]);

  // ─── Fetch Initial Data ───────────────────────
  useEffect(() => {
    if (authChecked) {
      fetchProfile();
      fetchAllData();
    }
  }, [authChecked]);

  // Reset to page 1 whenever filter or search changes
  useEffect(() => {
    setPage(1);
  }, [filter, search, dealType]);

  // ─── Get Shop ID ──────────────────────────────
  const getShopId = async () => {
    if (profile?.data?.shopId) return profile.data.shopId;
    if (profile?.data?.sellerId) return profile.data.sellerId;

    const stored = localStorage.getItem('shopId') || localStorage.getItem('sellerId');
    if (stored && stored !== 'undefined' && stored !== 'null') return stored;

    try {
      const res = await sellerApi.getSellerStallProfile();
      if (res.success && res.data) {
        const id = res.data.shopId || res.data.sellerId || res.data._id;
        if (id) {
          localStorage.setItem('shopId', id);
          return id;
        }
      }
    } catch (err) {
      console.error('Could not fetch shopId from profile:', err);
    }

    return null;
  };

  // ─── Fetch Profile ────────────────────────────
  const fetchProfile = async () => {
      try {
        const response = await sellerApi.getSellerStallProfile();

        if (response.success && response.data) {
          setProfile(response);
          const shopId = response.data.shopId || response.data.sellerId || response.data._id;
          if (shopId) localStorage.setItem('shopId', shopId);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        // Don't call handleAuthError for profile fetch - let fetchAllData handle it
        // Just set profile to null so the UI doesn't break
        setProfile(null);
      }
  };

  // ─── Fetch All Data (Offers + Flash Deals) ────
  const fetchAllData = async () => {
      setLoading(true);
      try {
        // Fetch regular offers
        const offersResponse = await sellerApi.getCreatedOffers();
        
        // Always fetch all flash deals
        const flashDealsResponse = await sellerApi.getSellerFlashDeals();

        // Process regular offers
        let offersList = [];
        if (offersResponse.success && offersResponse.data) {
          offersList = offersResponse.data.offers || [];
          setAllOffers(offersList);
        } else {
          setAllOffers([]);
        }

        // Process flash deals
        let flashList = [];
        if (flashDealsResponse.success && flashDealsResponse.data) {
          flashList = flashDealsResponse.data || [];
          setAllFlashDeals(flashList);
        } else {
          setAllFlashDeals([]);
        }

        // Calculate combined stats
        const transformedFlashDeals = flashList.map(deal => ({
          ...deal,
          offerStatus: deal.status,
          isEnabled: deal.isEnabled !== false,
          offerTitle: deal.title,
          offerType: deal.dealType,
          offerValue: deal.dealValue
        }));

        const allItems = [...offersList, ...transformedFlashDeals];
        
        setStats({
          all: allItems.length,
          active: allItems.filter(item => 
            item.offerStatus === 'active' || item.status === 'active'
          ).length,
          scheduled: allItems.filter(item => 
            item.offerStatus === 'scheduled' || item.status === 'scheduled'
          ).length,
          expired: allItems.filter(item => 
            item.offerStatus === 'expired' || item.status === 'expired'
          ).length,
          disabled: allItems.filter(item => !item.isEnabled).length,
          flash: flashList.length
        });

      } catch (error) {
        console.error('Failed to fetch data:', error);
        // ✅ Only handle auth errors, not network errors
        const msg = error?.message || '';
        const status = error?.status;
        
        if (
          status === 401 || status === 403 ||
          msg.toLowerCase().includes('unauthorized') ||
          msg.toLowerCase().includes('session expired') ||
          msg.toLowerCase().includes('permission') ||
          msg.toLowerCase().includes('access denied') ||
          msg.toLowerCase().includes('forbidden')
        ) {
          handleAuthError(error);
        } else {
          showToast('Failed to load data. Please try again.', 'error');
        }
      } finally {
        setLoading(false);
      }
  };

  const fetchAllOffers = fetchAllData;

  // ─── Auth Error Handler ───────────────────────
  const handleAuthError = (error, fallbackMsg) => {
      const msg = error?.message || '';
      const status = error?.status;
      
      // Check for ANY auth-related error
      const isAuthError = 
        status === 401 ||
        status === 403 ||
        msg.toLowerCase().includes('unauthorized') ||
        msg.toLowerCase().includes('401') ||
        msg.toLowerCase().includes('403') ||
        msg.toLowerCase().includes('session expired') ||
        msg.toLowerCase().includes('permission') ||
        msg.toLowerCase().includes('access denied') ||
        msg.toLowerCase().includes('forbidden') ||
        msg.toLowerCase().includes('login again');
      
      if (isAuthError) {
        console.log('Auth error detected, clearing session and redirecting...');
        sellerApi.clearAuthData();
        
        // Show a toast message briefly before redirecting
        showToast('Session expired. Please login again.', 'error');
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/stall-owner/login', { 
            replace: true,
            state: { message: 'Your session has expired. Please login again.' }
          });
        }, 1500);
      } else if (fallbackMsg) {
        showToast(fallbackMsg, 'error');
      }
  };

  // ─── Toast ────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Get Combined Items for Display ───────────
  const getCombinedItems = () => {
    let items = [];
    
    if (filter === 'flash') {
      // Only show flash deals
      items = allFlashDeals.map(deal => ({
        ...deal,
        _id: deal._id,
        offerId: deal._id,
        offerTitle: deal.title,
        offerDescription: deal.description,
        offerType: deal.dealType,
        offerValue: deal.dealValue,
        offerStatus: deal.status,
        offerStartDate: deal.startTime,
        offerEndDate: deal.endTime,
        offerImages: deal.banners,
        offerTermsAndConditions: deal.termsAndConditions,
        isFlashDeal: true,
        isEnabled: deal.isEnabled !== false,
        flashDealStartTime: deal.startTime,
        flashDealEndTime: deal.endTime,
        flashDealTitle: deal.title,
        flashDealDescription: deal.description,
        flashDealType: deal.dealType,
        flashDealValue: deal.dealValue,
        flashDealTermsAndConditions: deal.termsAndConditions,
        timezone: deal.timezone
      }));
      
      // Apply deal type filter for flash deals
      if (dealType !== 'all') {
        items = items.filter(item => item.dealType === dealType);
      }
    } else {
      // Transform regular offers
      const regularItems = allOffers.map(offer => ({
        ...offer,
        isFlashDeal: false
      }));
      
      // Transform flash deals to match offer structure
      const flashItems = allFlashDeals.map(deal => ({
        ...deal,
        _id: deal._id,
        offerId: deal._id,
        offerTitle: deal.title,
        offerDescription: deal.description,
        offerType: deal.dealType,
        offerValue: deal.dealValue,
        offerStatus: deal.status,
        offerStartDate: deal.startTime,
        offerEndDate: deal.endTime,
        offerImages: deal.banners,
        offerTermsAndConditions: deal.termsAndConditions,
        isFlashDeal: true,
        isEnabled: deal.isEnabled !== false,
        flashDealStartTime: deal.startTime,
        flashDealEndTime: deal.endTime,
        flashDealTitle: deal.title,
        flashDealDescription: deal.description,
        flashDealType: deal.dealType,
        flashDealValue: deal.dealValue,
        flashDealTermsAndConditions: deal.termsAndConditions,
        timezone: deal.timezone
      }));
      
      // Combine both
      items = [...regularItems, ...flashItems];
      
      // Apply status filter
      if (filter !== 'all') {
        items = items.filter(item => {
          const status = item.offerStatus || item.status;
          return status === filter;
        });
      }
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      items = items.filter(item => {
        const title = item.offerTitle || item.title || '';
        const description = item.offerDescription || item.description || '';
        return title.toLowerCase().includes(searchLower) ||
               description.toLowerCase().includes(searchLower);
      });
    }

    return items;
  };

  const combinedItems = getCombinedItems();
  const totalPages = Math.max(1, Math.ceil(combinedItems.length / ITEMS_PER_PAGE));
  const paged = combinedItems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const openCreate = async () => {
    try {
      const shopId = await getShopId();

      if (!shopId) {
        showToast('Shop ID not found. Please refresh or login again.', 'error');
        return;
      }

      setEditing(null);
      setForm({
        shopId,
        offerTitle: "",
        offerDescription: "",
        offerType: "percentage",
        offerValue: "",
        offerStartDate: new Date().toISOString().split("T")[0],
        offerEndDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        offerTermsAndConditions: "",
        flashDealTitle: "",
        flashDealDescription: "",
        flashDealType: "percentage",
        flashDealValue: "",
        flashDealStartTime: "",
        flashDealEndTime: "",
        flashDealTermsAndConditions: "",
        timezone: "Asia/Dubai", // Set default to Dubai
        offerCategory: "regular"
      });
      setImageFiles([]);
      setImagePreviews([]);
      setModal(true);
    } catch (error) {
      console.error('Error in openCreate:', error);
      showToast('Error preparing offer creation', 'error');
    }
  };
  // ─── Open Edit Modal ──────────────────────────
  const openEdit = async (offer) => {
    try {
      const shopId = await getShopId();

      setEditing(offer);
      const isFlashDeal = offer.isFlashDeal || !!offer.flashDealTitle;
      
      setForm({
        shopId: shopId || "",
        offerTitle: offer.offerTitle || "",
        offerDescription: offer.offerDescription || "",
        offerType: offer.offerType || "percentage",
        offerValue: offer.offerValue || "",
        offerStartDate: offer.offerStartDate?.split('T')[0] || "",
        offerEndDate: offer.offerEndDate?.split('T')[0] || "",
        offerTermsAndConditions: offer.offerTermsAndConditions || "",
        flashDealTitle: offer.flashDealTitle || offer.title || "",
        flashDealDescription: offer.flashDealDescription || offer.description || "",
        flashDealType: offer.flashDealType || offer.dealType || "percentage",
        flashDealValue: offer.flashDealValue || offer.dealValue || "",
        flashDealStartTime: offer.flashDealStartTime?.slice(0, 16) || offer.startTime?.slice(0, 16) || "",
        flashDealEndTime: offer.flashDealEndTime?.slice(0, 16) || offer.endTime?.slice(0, 16) || "",
        flashDealTermsAndConditions: offer.flashDealTermsAndConditions || offer.termsAndConditions || "",
        timezone: offer.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        offerCategory: isFlashDeal ? "flash" : "regular"
      });
      setImageFiles([]);
      setImagePreviews(
        offer.offerImages?.length
          ? offer.offerImages.map(img => img.url || img)
          : (offer.banners?.length ? offer.banners.map(b => b.url) : [])
      );
      setModal(true);
    } catch (error) {
      console.error('Error in openEdit:', error);
      showToast('Error preparing offer edit', 'error');
    }
  };

  // ─── Image Change ─────────────────────────────
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const maxImages = form.offerCategory === 'flash' ? 3 : 4;

    if (files.length > maxImages) {
      showToast(`Maximum ${maxImages} images allowed`, 'error');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (files.some(f => !validTypes.includes(f.type))) {
      showToast('Only JPEG, PNG and WEBP images are allowed', 'error');
      return;
    }

    setImageFiles(files);
    setImagePreviews(files.map(f => URL.createObjectURL(f)));
  };

const resetForm = (shopId = form.shopId) => {
  setEditing(null);
  setForm({
    shopId,
    offerTitle: "",
    offerDescription: "",
    offerType: "percentage",
    offerValue: "",
    offerStartDate: new Date().toISOString().split("T")[0],
    offerEndDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    offerTermsAndConditions: "",
    flashDealTitle: "",
    flashDealDescription: "",
    flashDealType: "percentage",
    flashDealValue: "",
    flashDealStartTime: "",
    flashDealEndTime: "",
    flashDealTermsAndConditions: "",
    timezone: "Asia/Dubai",
    offerCategory: "regular"
  });
};

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const isFlashDeal = form.offerCategory === 'flash';

    if (isFlashDeal) {
      if (!form.flashDealTitle?.trim()) {
        showToast('Flash deal title is required', 'error');
        setLoading(false);
        return;
      }
      if (!form.flashDealDescription?.trim()) {
        showToast('Flash deal description is required', 'error');
        setLoading(false);
        return;
      }
      if (!form.flashDealValue || Number(form.flashDealValue) <= 0) {
        showToast('Valid discount value is required', 'error');
        setLoading(false);
        return;
      }
      if (!form.flashDealStartTime) {
        showToast('Start time is required', 'error');
        setLoading(false);
        return;
      }
      if (!form.flashDealEndTime) {
        showToast('End time is required', 'error');
        setLoading(false);
        return;
      }
      if (!form.timezone) {
        showToast('Timezone is required', 'error');
        setLoading(false);
        return;
      }

      const startTime = new Date(form.flashDealStartTime);
      const endTime = new Date(form.flashDealEndTime);

      if (endTime <= startTime) {
        showToast('Flash deal end time must be after start time', 'error');
        setLoading(false);
        return;
      }

      const durationHours = (endTime - startTime) / (1000 * 60 * 60);
      if (durationHours > 48) {
        showToast('Flash deal duration cannot exceed 48 hours', 'error');
        setLoading(false);
        return;
      }
      if (durationHours < 1) {
        showToast('Flash deal duration must be at least 1 hour', 'error');
        setLoading(false);
        return;
      }

      if (form.flashDealType === 'percentage') {
        const value = Number(form.flashDealValue);
        if (value <= 0 || value > 100) {
          showToast('Percentage discount must be between 1 and 100', 'error');
          setLoading(false);
          return;
        }
      }
    } else {
      if (!form.offerTitle?.trim()) {
        showToast('Offer title is required', 'error');
        setLoading(false);
        return;
      }
      if (!form.offerDescription?.trim()) {
        showToast('Offer description is required', 'error');
        setLoading(false);
        return;
      }
      if (!form.offerValue || Number(form.offerValue) <= 0) {
        showToast('Valid discount value is required', 'error');
        setLoading(false);
        return;
      }

      const dateValidation = validateOfferDates(form.offerStartDate, form.offerEndDate);
      if (!dateValidation.valid) {
        showToast(dateValidation.error, 'error');
        setLoading(false);
        return;
      }

      if (form.offerType === 'percentage') {
        const value = Number(form.offerValue);
        if (value <= 0 || value > 100) {
          showToast('Percentage discount must be between 1 and 100', 'error');
          setLoading(false);
          return;
        }
      }
    }

    const cleanupAndReset = (shopId) => {
      imagePreviews.forEach(p => {
        if (p.startsWith('blob:')) URL.revokeObjectURL(p);
      });
      setImageFiles([]);
      setImagePreviews([]);
      resetForm(shopId);  // ✅ resets form + editing state
      setModal(false);
    };

    if (editing) {
      const offerId = editing.offerId || editing._id;

      if (isFlashDeal) {
        const flashDealData = {
          flashDealTitle: form.flashDealTitle.trim(),
          flashDealDescription: form.flashDealDescription.trim(),
          flashDealStartTime: form.flashDealStartTime,
          flashDealEndTime: form.flashDealEndTime,
          flashDealTermsAndConditions: form.flashDealTermsAndConditions?.trim() || '',
          flashDealType: form.flashDealType,
          flashDealValue: Number(form.flashDealValue),
          timezone: form.timezone,
        };

        const response = await sellerApi.editFlashDeal(offerId, flashDealData, imageFiles);

        if (response.success) {
          showToast('Flash deal updated successfully!', 'success');
          await fetchAllData();
          cleanupAndReset(form.shopId);  // ✅
        } else {
          showToast(response.message || 'Failed to update flash deal', 'error');
        }

      } else {
        const shopId = await getShopId();
        if (!shopId) {
          showToast('Shop ID not found. Please refresh or login again.', 'error');
          setLoading(false);
          return;
        }

        const offerData = {
          shopId,
          offerTitle: form.offerTitle.trim(),
          offerDescription: form.offerDescription.trim(),
          offerStartDate: form.offerStartDate,
          offerEndDate: form.offerEndDate,
          offerTermsAndConditions: form.offerTermsAndConditions?.trim() || '',
          offerType: form.offerType,
          offerValue: Number(form.offerValue),
        };

        const updatedFields = getChangedFields(editing, offerData);

        if (Object.keys(updatedFields).length === 0 && imageFiles.length === 0) {
          showToast('No changes detected', 'info');
          setModal(false);
          setLoading(false);
          return;
        }

        const response = await sellerApi.editOffer(offerId, updatedFields, imageFiles);

        if (response.success) {
          showToast('Offer updated successfully!', 'success');
          await fetchAllData();
          cleanupAndReset(shopId);  // ✅
        } else {
          showToast(response.message || 'Failed to update offer', 'error');
        }
      }

    } else {
      if (!imageFiles || imageFiles.length === 0) {
        showToast(`Please upload at least one ${isFlashDeal ? 'flash deal' : 'offer'} image`, 'error');
        setLoading(false);
        return;
      }

      if (isFlashDeal) {
        const flashDealData = {
          flashDealTitle: form.flashDealTitle.trim(),
          flashDealDescription: form.flashDealDescription.trim(),
          flashDealStartTime: form.flashDealStartTime,
          flashDealEndTime: form.flashDealEndTime,
          flashDealTermsAndConditions: form.flashDealTermsAndConditions?.trim() || '',
          flashDealType: form.flashDealType,
          flashDealValue: Number(form.flashDealValue),
          timezone: form.timezone,
        };

        console.log('Creating flash deal with data:', flashDealData);

        const response = await sellerApi.createFlashDeal(flashDealData, imageFiles);

        if (response.success) {
          showToast('Flash deal created successfully!', 'success');
          await fetchAllData();
          cleanupAndReset(form.shopId);  // ✅
        } else {
          showToast(response.message || 'Failed to create flash deal', 'error');
        }

      } else {
        const shopId = await getShopId();
        if (!shopId) {
          showToast('Shop ID not found. Please refresh or login again.', 'error');
          setLoading(false);
          return;
        }

        const offerData = {
          shopId,
          offerTitle: form.offerTitle.trim(),
          offerDescription: form.offerDescription.trim(),
          offerStartDate: form.offerStartDate,
          offerEndDate: form.offerEndDate,
          offerTermsAndConditions: form.offerTermsAndConditions?.trim() || '',
          offerType: form.offerType,
          offerValue: Number(form.offerValue),
        };

        const response = await sellerApi.createOffer(offerData, imageFiles);

        if (response.success) {
          showToast('Offer created successfully!', 'success');
          await fetchAllData();
          cleanupAndReset(shopId);  // ✅
        } else {
          showToast(response.message || 'Failed to create offer', 'error');
        }
      }
    }

  } catch (error) {
    console.error('Failed to save:', error);
    showToast(error.message || 'Failed to save', 'error');
  } finally {
    setLoading(false);
  }
};
  // ─── Delete Offer / Flash Deal ────────────────
  const deleteOffer = async (id, isFlashDeal = false) => {
    const itemType = isFlashDeal ? 'flash deal' : 'offer';
    if (!window.confirm(`Are you sure you want to delete this ${itemType}?`)) return;
    
    try {
      let response;
      if (isFlashDeal) {
        response = await sellerApi.deleteFlashDeal(id);
      } else {
        response = await sellerApi.deleteOffer(id);
      }
      
      if (response.success) {
        showToast(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} removed successfully`);
        await fetchAllData();
      } else {
        showToast(response.message || `Failed to delete ${itemType}`, 'error');
      }
    } catch (error) {
      console.error(`Failed to delete ${itemType}:`, error);
      showToast(`Failed to delete ${itemType}`, 'error');
    }
  };

  // ─── Toggle Offer Status ──────────────────────
  const toggleOfferStatus = async (offer) => {
    if (offer.isFlashDeal) {
      showToast('Flash deals cannot be disabled manually', 'info');
      return;
    }
    
    try {
      if (offer.isEnabled) {
        const response = await sellerApi.disableOffer(offer.offerId || offer._id);
        if (response.success) {
          showToast('Offer disabled successfully');
          await fetchAllData();
        }
      } else {
        const startDate = prompt(
          'Enter start date (YYYY-MM-DD):',
          new Date().toISOString().split('T')[0]
        );
        if (!startDate) return;

        const endDate = prompt(
          'Enter end date (YYYY-MM-DD):',
          new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
        );
        if (!endDate) return;

        const response = await sellerApi.enableOffer(
          offer.offerId || offer._id,
          startDate,
          endDate
        );
        if (response.success) {
          showToast('Offer enabled successfully');
          await fetchAllData();
        }
      }
    } catch (error) {
      console.error('Failed to toggle offer status:', error);
      showToast(error.message || 'Failed to update offer', 'error');
    }
  };

  // ─── View Offer Details ───────────────────────
  const viewOfferDetails = async (offerOrId) => {
    try {
      // Check auth state first
      const isAuth = sellerApi.isAuthenticated();
      const sellerId = localStorage.getItem('sellerId');
      console.log('Auth state - isAuthenticated:', isAuth, 'sellerId:', sellerId);
      
      if (!isAuth || !sellerId) {
        showToast('Please login again', 'error');
        navigate('/stall-owner/login');
        return;
      }
      
      let id;
      let isFlashDeal = false;
      
      if (typeof offerOrId === 'string') {
        id = offerOrId;
        const foundItem = combinedItems.find(item => 
          (item._id === id) || (item.offerId === id)
        );
        isFlashDeal = foundItem?.isFlashDeal || !!foundItem?.flashDealTitle;
      } else {
        id = offerOrId._id || offerOrId.offerId;
        isFlashDeal = offerOrId.isFlashDeal || !!offerOrId.flashDealTitle;
      }
      
      if (!id) {
        console.error('No valid ID found');
        showToast('Invalid offer ID', 'error');
        return;
      }
      
      console.log('Fetching details for ID:', id, 'isFlashDeal:', isFlashDeal);
      
      let response;
      if (isFlashDeal) {
        response = await sellerApi.getSingleFlashDeal(id);
      } else {
        response = await sellerApi.getSingleOffer(id);
      }
      
      console.log('API Response:', response);
      
      if (response.success) {
        setSelectedOffer({
          ...response.data,
          isFlashDeal: isFlashDeal
        });
      } else {
        showToast(response.message || 'Failed to load details', 'error');
      }
    } catch (error) {
      console.error('Failed to fetch details:', error);
      if (error.status === 401) {
        showToast('Session expired. Please login again.', 'error');
        navigate('/stall-owner/login');
      } else if (error.status === 404) {
        showToast('Offer not found. It may have been deleted.', 'error');
        // Refresh the list to remove stale data
        await fetchAllData();
      } else {
        showToast('Failed to load details', 'error');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await sellerApi.logoutSellerStall();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logoutSeller(); // ✅ clears sellerAuth state in context
      navigate('/stall-owner/login');
    }
  };

  if (initialLoading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  return (
    <div className="min-h-screen bg-stone-50 antialiased">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=Geist:wght@300;400;500;600&display=swap'); * { font-family: 'Geist', system-ui, sans-serif; } .df { font-family: 'Lora', Georgia, serif; }`}</style>

      <SellerHeader
        profile={profile}
        onLogout={handleLogout}
        onTabChange={setActiveTab}
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <SellerTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === "offers" && (
          <div>
            <div className="mb-7 flex items-center justify-between">
              <div>
                <h1 className="df text-3xl font-semibold text-stone-900 tracking-tight">
                  Offers Management
                </h1>
                <p className="text-stone-500 text-sm mt-1">
                  Create, track and manage all your stall promotions
                </p>
              </div>
              <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            </div>

            <StatsCards stats={stats} />

            <div className="flex items-center justify-between mb-5">
              <FilterBar
                filter={filter}
                onFilterChange={setFilter}
                search={search}
                onSearchChange={setSearch}
                stats={stats}
                dealType={dealType}
                onDealTypeChange={setDealType}
              />

              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg shadow-stone-900/20"
              >
                <Plus className="w-4 h-4" /> Create New Promotion
              </button>
            </div>

            {loading && (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
              </div>
            )}

            {!loading && viewMode === "grid" && (
              <OfferGrid
                offers={paged}
                onView={viewOfferDetails}
                onToggle={toggleOfferStatus}
                onEdit={openEdit}
                onDelete={(id) => {
                  const item = paged.find(o => (o.offerId || o._id) === id);
                  deleteOffer(id, item?.isFlashDeal);
                }}
              />
            )}

            {!loading && viewMode === "list" && (
              <OfferList
                offers={paged}
                onView={viewOfferDetails}
                onToggle={toggleOfferStatus}
                onEdit={openEdit}
                onDelete={(id) => {
                  const item = paged.find(o => (o.offerId || o._id) === id);
                  deleteOffer(id, item?.isFlashDeal);
                }}
              />
            )}

            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                totalItems={combinedItems.length}
                pageSize={ITEMS_PER_PAGE}
              />
            )}
          </div>
        )}

        {activeTab === "profile" && <SellerProfile profile={profile} />}
      </div>

      <OfferDetailModal
        offer={selectedOffer}
        onClose={() => setSelectedOffer(null)}
        onEdit={openEdit}
        onDelete={(id) => {
          deleteOffer(id, selectedOffer?.isFlashDeal);
          setSelectedOffer(null);
        }}
      />

      <CreateEditOfferModal
        isOpen={modal}
        onClose={() => {
          setModal(false);
          imagePreviews.forEach(p => { if (p.startsWith('blob:')) URL.revokeObjectURL(p); });
          setImageFiles([]);
          setImagePreviews([]);
        }}
        form={form}
        setForm={setForm}
        editing={!!editing}
        imageFiles={imageFiles}
        imagePreviews={imagePreviews}
        onImageChange={handleImageChange}
        onSubmit={handleSubmit}
        loading={loading}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}