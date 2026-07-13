// pages/VendorProfile.jsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FormInput from '../../components/FormInput';
import VendorSidebar from '../../components/vendor/dashboard/components/VendorSidebar'
import { vendorApi } from '../../hooks/vendorApi';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaBuilding,
  FaClock,
  FaSave,
  FaArrowLeft,
  FaCamera,
  FaKey,
  FaCheckCircle,
  FaIdCard,
  FaBars,
  FaTimes,
  FaExclamationTriangle,
  FaShieldAlt
} from 'react-icons/fa';

const VendorProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendorData, setVendorData] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    location: '',
    mallName: '',
    shopAddress: '',
    vendorShopDescription: '',
    vendorShopOpeningTime: '',
    vendorShopClosingTime: '',
    vendorShopNumberOfFloors: '',
    vendorShopNumberOfStalls: '',
    vendorLicenseNumber: '',
    profile: '',
    role: '',
    plan: ''
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  

  useEffect(() => {
    checkAuthAndLoadProfile();
  }, [navigate]);

  const checkAuthAndLoadProfile = async () => {
    try {
      setLoading(true);
      
      // First check if authenticated
      if (!vendorApi.isAuthenticated()) {
        console.log('Not authenticated, redirecting to login');
        navigate('/vendor/login');
        return;
      }

      // Try to load profile using unified method
      await loadVendorProfile();
      
    } catch (error) {
      console.error('Auth check failed:', error);
      
      // If we get a 401/403, clear auth and redirect
      if (error.message?.includes('401') || 
          error.message?.includes('403') || 
          error.message?.includes('Unauthorized') ||
          error.message?.includes('Access denied')) {
        
        console.log('Auth error, clearing data and redirecting');
        vendorApi.clearAuthData();
        navigate('/vendor/login');
      } else {
        setErrors({ general: error.message || 'Failed to load profile' });
      }
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  };

  const loadVendorProfile = async () => {
    try {
      console.log('Loading vendor profile...');
      
      // Use the unified method that handles both admin and regular profiles
      const response = await vendorApi.getVendorProfileUnified();
      console.log('Unified profile response:', response);
      
      // Extract vendor data from various possible response structures
      let vendor = {};
      
      if (response?.data?.data) {
        // Structure: { success: true, data: { data: {...} } }
        vendor = response.data.data;
      } else if (response?.data) {
        // Structure: { success: true, data: {...} }
        vendor = response.data;
      } else if (response?.vendor) {
        // Structure: { vendor: {...} }
        vendor = response.vendor;
      } else {
        // Direct vendor object
        vendor = response;
      }

      console.log('Extracted vendor data:', vendor);
      setVendorData(vendor);
      
      // Map backend field names to frontend field names with proper fallbacks
      const newFormData = {
        name: vendor.name || vendor.vendorName || '',
        email: vendor.email || '',
        phoneNumber: vendor.Phone || vendor.phoneNumber || vendor.contactNumber || vendor.vendorContactNumber || '',
        location: vendor.location || vendor.vendorLocation || '',
        mallName: vendor.mallName || vendor.shop?.name || vendor.shopName || '',
        shopAddress: vendor.Address || vendor.shopAddress || vendor.vendorShopAddress || vendor.shop?.address || '',
        vendorShopDescription: vendor.vendorShopDescription || vendor.shop?.description || vendor.description || '',
        vendorShopOpeningTime: vendor.vendorShopOpeningTime || vendor.shop?.openingTime || vendor.openingTime || '',
        vendorShopClosingTime: vendor.vendorShopClosingTime || vendor.shop?.closingTime || vendor.closingTime || '',
        vendorShopNumberOfFloors: vendor.vendorShopNumberOfFloors || vendor.shop?.numberOfFloors || vendor.Floors || '',
        vendorShopNumberOfStalls: vendor.vendorShopNumberOfStalls || vendor.shop?.numberOfStalls || vendor.Stalls || '',
        vendorLicenseNumber: vendor.vendorLicenseNumber || vendor.licenseNumber || '',
        profile: vendor.profile || vendor.profileImage || vendor.profilePicture || '',
        role: vendor.role || '',
        plan: vendor.plan || ''
      };

      console.log('Mapped form data:', newFormData);
      setFormData(newFormData);

      // Set profile preview if profile image exists
      if (newFormData.profile) {
        setProfilePreview(newFormData.profile);
      }

    } catch (error) {
      console.error('Failed to load profile:', error);
      
      // If it's a 403/401, rethrow to be caught by parent
      if (error.message?.includes('403') || 
          error.message?.includes('401') || 
          error.message?.includes('Access denied')) {
        throw error;
      }
      
      // Otherwise just set error message
      setErrors({ general: 'Failed to load profile: ' + (error.message || 'Unknown error') });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        return;
      }
      
      if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/jpg')) {
        alert('Only JPG, JPEG, and PNG files are allowed');
        return;
      }
      
      setProfileImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateProfile = () => {
    const newErrors = {};
    
    if (!formData.name?.trim()) newErrors.name = 'Name is required';
    if (!formData.email?.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.phoneNumber?.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.location?.trim()) newErrors.location = 'Location is required';
    if (!formData.mallName?.trim()) newErrors.mallName = 'Shop name is required';
    if (!formData.shopAddress?.trim()) newErrors.shopAddress = 'Shop address is required';
    
    return newErrors;
  };

  const validatePassword = () => {
    const newErrors = {};
    
    if (!passwordData.oldPassword) newErrors.oldPassword = 'Current password is required';
    if (!passwordData.newPassword) newErrors.newPassword = 'New password is required';
    else if (passwordData.newPassword.length < 8) newErrors.newPassword = 'Password must be at least 8 characters';
    if (!passwordData.confirmPassword) newErrors.confirmPassword = 'Please confirm password';
    else if (passwordData.newPassword !== passwordData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    return newErrors;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    
    const validationErrors = validateProfile();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setUpdating(true);

    try {
      // Prepare data for API - map frontend fields to backend expected fields
      const updateData = {
        name: formData.name,
        email: formData.email,
        Phone: formData.phoneNumber, // Backend expects "Phone" with capital P
        location: formData.location,
        mallName: formData.mallName,
        Address: formData.shopAddress, // Backend expects "Address" with capital A
        vendorShopDescription: formData.vendorShopDescription,
        vendorShopOpeningTime: formData.vendorShopOpeningTime,
        vendorShopClosingTime: formData.vendorShopClosingTime,
        vendorShopNumberOfFloors: parseInt(formData.vendorShopNumberOfFloors) || 0,
        vendorShopNumberOfStalls: parseInt(formData.vendorShopNumberOfStalls) || 0
      };

      console.log('Updating profile with:', updateData);
      
      const response = await vendorApi.updateVendorProfile(updateData);
      console.log('Profile update response:', response);
      
      setSuccessMessage('Profile updated successfully!');
      setErrors({});
      
      // Reload profile after update
      setTimeout(() => {
        loadVendorProfile();
      }, 1000);
      
    } catch (error) {
      console.error('Profile update failed:', error);
      setErrors({ general: error.message || 'Failed to update profile' });
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    
    const validationErrors = validatePassword();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setUpdating(true);

    try {
      const response = await vendorApi.changePassword(
        passwordData.oldPassword,
        passwordData.newPassword,
        passwordData.confirmPassword
      );
      
      console.log('Password change response:', response);
      
      setSuccessMessage('Password changed successfully!');
      
      setPasswordData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setErrors({});
      
    } catch (error) {
      console.error('Password change failed:', error);
      setErrors({ general: error.message || 'Failed to change password' });
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await vendorApi.logoutVendor();
      navigate('/vendor/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <div className="w-7 h-7 border-[3px] border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-500 text-sm font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white/95 backdrop-blur-sm shadow-sm ring-1 ring-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl hover:bg-gray-50 text-gray-600"
        >
          {sidebarOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
        </button>
        <h1 className="text-lg font-bold text-gray-900">Vendor Profile</h1>
        <div className="w-9"></div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`
          fixed lg:static inset-y-0 left-0 transform 
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 transition duration-200 ease-in-out
          z-30 w-64 bg-white ring-1 ring-gray-100 shadow-sm h-screen overflow-y-auto
        `}>
          <VendorSidebar
            vendorData={formData}
            profilePreview={profilePreview}
            activePage="profile"
            activeProfileTab={activeTab}
            onProfileTabChange={setActiveTab}
            onLogout={handleLogout}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 p-4 lg:p-8 max-w-5xl">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <p className="text-[11px] font-semibold tracking-wider uppercase text-indigo-500 mb-1">Account</p>
                <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                <p className="text-gray-500 text-sm mt-1">Manage your vendor account and shop information</p>
              </div>
              <Link
                to="/vendor/dashboard"
                className="hidden lg:flex items-center px-4 py-2.5 ring-1 ring-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-sm transition-colors shrink-0"
              >
                <FaArrowLeft className="h-3.5 w-3.5 mr-2" />
                Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="bg-emerald-50 ring-1 ring-emerald-200 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <FaCheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-sm font-medium text-emerald-800">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errors.general && (
            <div className="bg-rose-50 ring-1 ring-rose-200 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <FaExclamationTriangle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                <p className="text-sm font-medium text-rose-700">{errors.general}</p>
              </div>
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 px-6 py-4 bg-gradient-to-r from-indigo-50/70 via-white to-white">
              <h2 className="text-lg font-bold text-gray-900">
                {activeTab === 'profile' ? 'Profile Information' : 'Change Password'}
              </h2>
            </div>

            <div className="p-6">
              {activeTab === 'profile' ? (
                <form onSubmit={handleUpdateProfile}>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Profile Image */}
                    <div className="lg:col-span-1">
                      <div className="text-center">
                        <div className="relative inline-block">
                          <div className="w-36 h-36 rounded-full ring-4 ring-indigo-50 overflow-hidden">
                            {profilePreview ? (
                              <img
                                src={profilePreview}
                                alt="Profile"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                                <FaUser className="w-16 h-16 text-indigo-300" />
                              </div>
                            )}
                          </div>
                          
                          <label
                            htmlFor="profile-image"
                            className="absolute bottom-1 right-1 bg-gradient-to-br from-[#4F46E5] to-[#6D28D9] text-white p-2.5 rounded-full cursor-pointer hover:opacity-90 shadow-md transition-opacity"
                          >
                            <FaCamera className="h-4 w-4" />
                          </label>
                          <input
                            id="profile-image"
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={handleProfileImageChange}
                            className="hidden"
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-4">
                          Click the camera to upload a photo
                        </p>
                        <p className="text-xs text-gray-400">
                          JPG, PNG • Max 5MB
                        </p>
                      </div>

                      {/* License Info */}
                      {formData.vendorLicenseNumber && (
                        <div className="mt-6 p-4 bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] rounded-2xl relative overflow-hidden">
                          <div className="pointer-events-none absolute -left-8 top-0 h-full w-14 bg-white/10 -skew-x-12" />
                          <div className="relative flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-white/15">
                              <FaIdCard className="h-3.5 w-3.5 text-amber-300" />
                            </div>
                            <h3 className="text-xs font-semibold tracking-wide uppercase text-indigo-100">License Number</h3>
                          </div>
                          <p className="relative text-sm text-white font-mono bg-white/10 p-2.5 rounded-lg ring-1 ring-white/20">
                            {formData.vendorLicenseNumber}
                          </p>
                        </div>
                      )}

                      {/* Shop Stats */}
                      <div className="mt-6 p-4 bg-gray-50 rounded-2xl ring-1 ring-gray-100">
                        <h3 className="text-[11px] font-semibold tracking-wide uppercase text-gray-400 mb-3">Shop Statistics</h3>
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Floors</span>
                            <span className="font-semibold text-gray-900 tabular-nums">{formData.vendorShopNumberOfFloors || 0}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Stalls</span>
                            <span className="font-semibold text-gray-900 tabular-nums">{formData.vendorShopNumberOfStalls || 0}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                            <span className="text-gray-500 flex items-center gap-1.5">
                              <FaClock className="h-3 w-3 text-gray-400" />
                              Hours
                            </span>
                            <span className="font-semibold text-gray-900 text-xs">
                              {formData.vendorShopOpeningTime || 'N/A'} – {formData.vendorShopClosingTime || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Form Fields */}
                    <div className="lg:col-span-2">
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormInput
                            label="Full Name *"
                            type="text"
                            name="name"
                            placeholder="Your full name"
                            value={formData.name}
                            onChange={handleChange}
                            error={errors.name}
                            icon={<FaUser className="text-gray-400" />}
                            required
                          />

                          <FormInput
                            label="Email Address *"
                            type="email"
                            name="email"
                            placeholder="vendor@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                            icon={<FaEnvelope className="text-gray-400" />}
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormInput
                            label="Phone Number *"
                            type="tel"
                            name="phoneNumber"
                            placeholder="9876543210"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            error={errors.phoneNumber}
                            icon={<FaPhone className="text-gray-400" />}
                            required
                          />

                          <FormInput
                            label="Location *"
                            type="text"
                            name="location"
                            placeholder="City, State"
                            value={formData.location}
                            onChange={handleChange}
                            error={errors.location}
                            icon={<FaMapMarkerAlt className="text-gray-400" />}
                            required
                          />
                        </div>

                        <FormInput
                          label="Shop Name *"
                          type="text"
                          name="mallName"
                          placeholder="Your shop/mall name"
                          value={formData.mallName}
                          onChange={handleChange}
                          error={errors.mallName}
                          icon={<FaBuilding className="text-gray-400" />}
                          required
                        />

                        <div>
                          <label className="block text-gray-700 text-sm font-semibold mb-2">
                            Shop Address *
                          </label>
                          <textarea
                            name="shopAddress"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 min-h-[100px] resize-none text-sm transition-all"
                            placeholder="Complete shop address..."
                            value={formData.shopAddress}
                            onChange={handleChange}
                            required
                          />
                          {errors.shopAddress && <p className="text-rose-500 text-xs mt-1.5 font-medium">{errors.shopAddress}</p>}
                        </div>

                        <div>
                          <label className="block text-gray-700 text-sm font-semibold mb-2">
                            Shop Description
                          </label>
                          <textarea
                            name="vendorShopDescription"
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 min-h-[120px] resize-none text-sm transition-all"
                            placeholder="Describe your shop/mall..."
                            value={formData.vendorShopDescription}
                            onChange={handleChange}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormInput
                            label="Number of Floors"
                            type="number"
                            name="vendorShopNumberOfFloors"
                            placeholder="2"
                            value={formData.vendorShopNumberOfFloors}
                            onChange={handleChange}
                            min="1"
                          />

                          <FormInput
                            label="Number of Stalls"
                            type="number"
                            name="vendorShopNumberOfStalls"
                            placeholder="10"
                            value={formData.vendorShopNumberOfStalls}
                            onChange={handleChange}
                            min="1"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormInput
                            label="Opening Time"
                            type="text"
                            name="vendorShopOpeningTime"
                            placeholder="09:00 AM"
                            value={formData.vendorShopOpeningTime}
                            onChange={handleChange}
                            icon={<FaClock className="text-gray-400" />}
                          />

                          <FormInput
                            label="Closing Time"
                            type="text"
                            name="vendorShopClosingTime"
                            placeholder="09:00 PM"
                            value={formData.vendorShopClosingTime}
                            onChange={handleChange}
                            icon={<FaClock className="text-gray-400" />}
                          />
                        </div>

                        <div className="pt-6 border-t border-gray-100">
                          <button
                            type="submit"
                            disabled={updating}
                            className="px-6 py-3 bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center shadow-sm shadow-indigo-600/25"
                          >
                            <FaSave className="h-4 w-4 mr-2" />
                            {updating ? 'Updating...' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                /* Password Change Form */
                <form onSubmit={handleChangePassword} className="max-w-lg mx-auto">
                  <div className="space-y-6">
                    <div className="bg-gray-50 ring-1 ring-gray-100 p-6 rounded-2xl">
                      <div className="flex items-center gap-2.5 mb-1">
                        <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                          <FaShieldAlt className="h-3.5 w-3.5" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900">Change Your Password</h3>
                      </div>
                      <p className="text-sm text-gray-500 mb-6 ml-10">
                        Choose a strong password that you don't use elsewhere
                      </p>
                      
                      <div className="space-y-4">
                        <FormInput
                          label="Current Password *"
                          type="password"
                          name="oldPassword"
                          placeholder="Enter current password"
                          value={passwordData.oldPassword}
                          onChange={handlePasswordChange}
                          error={errors.oldPassword}
                          icon={<FaKey className="text-gray-400" />}
                          required
                        />

                        <FormInput
                          label="New Password *"
                          type="password"
                          name="newPassword"
                          placeholder="At least 8 characters"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          error={errors.newPassword}
                          icon={<FaKey className="text-gray-400" />}
                          required
                        />

                        <FormInput
                          label="Confirm New Password *"
                          type="password"
                          name="confirmPassword"
                          placeholder="Confirm new password"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          error={errors.confirmPassword}
                          icon={<FaCheckCircle className="text-gray-400" />}
                          required
                        />
                      </div>

                      <div className="mt-6">
                        <button
                          type="submit"
                          disabled={updating}
                          className="w-full px-6 py-3 bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center shadow-sm shadow-indigo-600/25"
                        >
                          <FaKey className="h-4 w-4 mr-2" />
                          {updating ? 'Changing Password...' : 'Change Password'}
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-400 text-center leading-relaxed">
                      <p>Password must be at least 8 characters long</p>
                      <p>Use a mix of letters, numbers, and symbols for better security</p>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default VendorProfile;