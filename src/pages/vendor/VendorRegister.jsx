import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import FormInput from '../../components/FormInput';
import { vendorApi } from '../../hooks/vendorApi';
import { 
  FaBuilding, 
  FaEnvelope,
  FaUser, 
  FaMapMarkerAlt, 
  FaPhone,
  FaLock,
  FaCheck,
  FaClock,
  FaAlignLeft,
  FaCamera,
  FaUpload,
  FaImages,
  FaTrash,
  FaEye,
  FaEyeSlash,
  FaHeadset
} from 'react-icons/fa';

const VendorRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: '',
    mallName: '',
    shopAddress: '',
    phoneNumber: '',
    vendorLicenseNumber: '',
    vendorShopOpeningTime: '09:00 AM',
    vendorShopClosingTime: '09:00 PM',
    vendorShopDescription: '',
    vendorShopNumberOfFloors: '',
    vendorShopNumberOfStalls: '',
  });
  
  const [profileImage, setProfileImage] = useState(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [shopImages, setShopImages] = useState([]);
  const [shopImagePreviews, setShopImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [apiError, setApiError] = useState('');
  const totalSteps = 3;
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError('');
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profileImage: 'File size should be less than 5MB' }));
        return;
      }
      
      // Check file type
      if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/jpg')) {
        setErrors(prev => ({ ...prev, profileImage: 'Only JPG, JPEG, and PNG files are allowed' }));
        return;
      }
      
      setProfileImage(file);
      setErrors(prev => ({ ...prev, profileImage: '' }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShopImagesChange = (e) => {
    const files = Array.from(e.target.files);
    let validFiles = [];
    let invalidFiles = [];
    
    files.forEach(file => {
      // Check file size (max 5MB per image)
      if (file.size > 5 * 1024 * 1024) {
        invalidFiles.push(`${file.name} - File too large (max 5MB)`);
        return;
      }
      
      // Check file type
      if (!file.type.match('image/jpeg') && !file.type.match('image/png') && !file.type.match('image/jpg')) {
        invalidFiles.push(`${file.name} - Invalid file type (only JPG, JPEG, PNG)`);
        return;
      }
      
      validFiles.push(file);
    });
    
    if (invalidFiles.length > 0) {
      setErrors(prev => ({ 
        ...prev, 
        shopImages: `Invalid files: ${invalidFiles.join(', ')}` 
      }));
    }
    
    if (validFiles.length > 0) {
      const updatedShopImages = [...shopImages, ...validFiles].slice(0, 10); // Limit to 10 images
      setShopImages(updatedShopImages);
      setErrors(prev => ({ ...prev, shopImages: '' }));
      
      //previews for new files
      const newPreviews = [];
      validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push(reader.result);
          if (newPreviews.length === validFiles.length) {
            setShopImagePreviews(prev => [...prev, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeShopImage = (index) => {
    const updatedImages = [...shopImages];
    const updatedPreviews = [...shopImagePreviews];
    
    updatedImages.splice(index, 1);
    updatedPreviews.splice(index, 1);
    
    setShopImages(updatedImages);
    setShopImagePreviews(updatedPreviews);
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!profileImage) newErrors.profileImage = 'Profile picture is required';
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
      if (!formData.location.trim()) newErrors.location = 'Location is required';
      if (!formData.mallName.trim()) newErrors.mallName = 'Mall name is required';
    }
    
    if (step === 2) {
      if (!formData.shopAddress.trim()) newErrors.shopAddress = 'Shop address is required';
      if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
      else if (!/^\+?[\d\s-]{10,}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
        newErrors.phoneNumber = 'Valid phone number is required';
      }
      if (!formData.vendorLicenseNumber.trim()) newErrors.vendorLicenseNumber = 'License number is required';
      
      if (!formData.vendorShopNumberOfFloors) newErrors.vendorShopNumberOfFloors = 'Number of floors is required';
      else if (isNaN(formData.vendorShopNumberOfFloors) || formData.vendorShopNumberOfFloors <= 0) {
        newErrors.vendorShopNumberOfFloors = 'Must be a positive number';
      }
      
      if (!formData.vendorShopNumberOfStalls) newErrors.vendorShopNumberOfStalls = 'Number of stalls is required';
      else if (isNaN(formData.vendorShopNumberOfStalls) || formData.vendorShopNumberOfStalls <= 0) {
        newErrors.vendorShopNumberOfStalls = 'Must be a positive number';
      }
    }
    
    if (step === 3) {
      if (!formData.vendorShopOpeningTime.trim()) newErrors.vendorShopOpeningTime = 'Opening time is required';
      if (!formData.vendorShopClosingTime.trim()) newErrors.vendorShopClosingTime = 'Closing time is required';
      if (!formData.vendorShopDescription.trim()) newErrors.vendorShopDescription = 'Shop description is required';
      
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      
      if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm password';
      else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const nextStep = () => {
    const validationErrors = validateStep(currentStep);
    if (Object.keys(validationErrors).length === 0) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      setErrors({});
    } else {
      setErrors(validationErrors);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // In VendorRegister.jsx - Replace the handleSubmit function
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all steps
    let allErrors = {};
    for (let step = 1; step <= totalSteps; step++) {
      const stepErrors = validateStep(step);
      allErrors = { ...allErrors, ...stepErrors };
    }
    
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      const firstErrorStep = Object.keys(allErrors)[0];
      if (firstErrorStep === 'profileImage' || firstErrorStep === 'name' || firstErrorStep === 'email' || 
          firstErrorStep === 'location' || firstErrorStep === 'mallName') {
        setCurrentStep(1);
              console.log('Profile image before submit:', profileImage);
      console.log('Profile image type:', profileImage?.type);
      console.log('Profile image size:', profileImage?.size);
      } else if (firstErrorStep === 'shopAddress' || firstErrorStep === 'phoneNumber' || 
                firstErrorStep === 'vendorLicenseNumber' || firstErrorStep === 'vendorShopNumberOfFloors' || 
                firstErrorStep === 'vendorShopNumberOfStalls') {
        setCurrentStep(2);
      } else {
        setCurrentStep(3);
      }

      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      console.log('Submitting form data:', formData);
      const response = await vendorApi.registerVendor(formData, profileImage, shopImages);
      console.log('API Response:', response);
      
      // Store verification data in localStorage
      localStorage.setItem('pendingVendorVerification', JSON.stringify({
        email: formData.email,
        vendorLicenseNumber: formData.vendorLicenseNumber,
        name: formData.name,
        mallName: formData.mallName,
        registrationTime: new Date().toISOString()
      }));
      
      // Redirect to OTP verification page
      navigate('/vendor/verify-otp', {
        state: {
          email: formData.email,
          vendorLicenseNumber: formData.vendorLicenseNumber,
          fromRegistration: true,
          message: 'Registration successful! Please verify your email with the OTP sent.'
        }
      });
      
    } catch (error) {
      console.error('Registration failed:', error);
      setApiError(error.message || 'Registration failed. Please try again.');
      window.scrollTo(0, 0);
    } finally {
      setIsLoading(false);
    }
  };

  const stepLabels = ['Profile & Basic Info', 'Shop Details', 'Timings & Security'];

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        {[1, 2, 3].map((step, idx) => {
          const isDone = step < currentStep;
          const isActive = step === currentStep;
          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isActive
                    ? 'bg-gradient-to-br from-[#4F46E5] to-[#6D28D9] text-white'
                    : isDone
                      ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
                      : 'bg-gray-100 text-gray-400'
                }`}>
                  {isDone ? <FaCheck className="h-3 w-3" /> : step}
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wide text-center max-w-[5.5rem] leading-tight ${
                  isActive ? 'text-indigo-600' : isDone ? 'text-gray-500' : 'text-gray-300'
                }`}>
                  {stepLabels[idx]}
                </span>
              </div>
              {idx < 2 && (
                <div className={`flex-1 h-0.5 mx-2 -mt-4 rounded-full transition-colors ${
                  step < currentStep ? 'bg-gradient-to-r from-[#4F46E5] to-[#6D28D9]' : 'bg-gray-100'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );

  return (
    <AuthLayout type="register" role="vendor" backLink="/vendor/login">
      <form onSubmit={handleSubmit}>
        {apiError && (
          <div className="mb-6 p-4 bg-rose-50 ring-1 ring-rose-200 rounded-2xl">
            <p className="text-rose-600 text-sm font-medium">{apiError}</p>
          </div>
        )}

        {renderStepIndicator()}

        <div className="mb-6 pb-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900">Vendor Registration</h3>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[11px] font-semibold rounded-full ring-1 ring-indigo-200">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
        </div>

        {currentStep === 1 && (
          <div className="space-y-5">
            {/* Profile Picture Upload */}
            <div className="mb-2 text-center">
              <label className="block text-gray-700 text-sm font-semibold mb-4">
                Profile Picture <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="w-28 h-28 rounded-full ring-1 ring-gray-200 border border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                    {profilePreview ? (
                      <img 
                        src={profilePreview} 
                        alt="Profile preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FaUser className="w-12 h-12 text-gray-300" />
                    )}
                  </div>
                  <label 
                    htmlFor="profile-upload"
                    className="absolute bottom-0 right-0 bg-gradient-to-br from-[#4F46E5] to-[#6D28D9] text-white p-2.5 rounded-full cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <FaCamera className="w-3.5 h-3.5" />
                  </label>
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Click the camera icon to upload
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  JPG, PNG • Max 5MB
                </p>
                {errors.profileImage && (
                  <p className="text-rose-500 text-xs mt-2 font-medium">{errors.profileImage}</p>
                )}
              </div>
            </div>

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

            <FormInput
              label="Mall Name *"
              type="text"
              name="mallName"
              placeholder="Your mall name"
              value={formData.mallName}
              onChange={handleChange}
              error={errors.mallName}
              icon={<FaBuilding className="text-gray-400" />}
              required
            />
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Shop Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute top-3.5 left-3.5 pointer-events-none">
                  <FaMapMarkerAlt className="text-gray-400 h-3.5 w-3.5" />
                </div>
                <textarea
                  name="shopAddress"
                  className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 min-h-[90px] resize-none text-sm transition-all"
                  placeholder="Complete shop address..."
                  value={formData.shopAddress}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.shopAddress && <p className="text-rose-500 text-xs mt-2 font-medium">{errors.shopAddress}</p>}
            </div>

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
              label="License Number *"
              type="text"
              name="vendorLicenseNumber"
              placeholder="LIC12345"
              value={formData.vendorLicenseNumber}
              onChange={handleChange}
              error={errors.vendorLicenseNumber}
              required
            />

            <div className="grid md:grid-cols-2 gap-5">
              <FormInput
                label="Number of Floors *"
                type="number"
                name="vendorShopNumberOfFloors"
                placeholder="2"
                value={formData.vendorShopNumberOfFloors}
                onChange={handleChange}
                error={errors.vendorShopNumberOfFloors}
                required
              />

              <FormInput
                label="Number of Stalls *"
                type="number"
                name="vendorShopNumberOfStalls"
                placeholder="10"
                value={formData.vendorShopNumberOfStalls}
                onChange={handleChange}
                error={errors.vendorShopNumberOfStalls}
                required
              />
            </div>

            {/* Shop Images Upload */}
            <div className="pt-2">
              <label className="block text-gray-700 text-sm font-semibold mb-3">
                Shop Images <span className="text-gray-400 font-normal">(optional, up to 10)</span>
              </label>
              
              <div className="border border-dashed border-gray-300 rounded-2xl p-6 bg-gray-50/50">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                    <FaImages className="w-5 h-5 text-indigo-400" />
                  </div>
                  <p className="text-gray-700 text-sm font-medium mb-1">Upload photos of your shop</p>
                  <p className="text-xs text-gray-400 mb-4">
                    Multiple images allowed, max 10
                  </p>
                  
                  <label className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white rounded-xl cursor-pointer hover:opacity-90 transition-opacity text-sm font-semibold shadow-sm shadow-indigo-600/25">
                    <FaUpload className="w-3.5 h-3.5 mr-2" />
                    Choose images
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleShopImagesChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              
              {shopImages.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2.5">
                    Selected ({shopImages.length}/10)
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {shopImagePreviews.map((preview, index) => (
                      <div key={index} className="relative group rounded-xl overflow-hidden ring-1 ring-gray-200">
                        <img 
                          src={preview} 
                          alt={`Shop image ${index + 1}`}
                          className="w-full h-28 object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeShopImage(index)}
                          className="absolute top-1.5 right-1.5 bg-rose-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FaTrash className="w-2.5 h-2.5" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1.5 py-1 text-center truncate">
                          {shopImages[index].name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {errors.shopImages && (
                <p className="text-amber-600 text-xs mt-2 font-medium">{errors.shopImages}</p>
              )}
              
              <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                Clear photos help build trust with shoppers · JPG or PNG · Max 5MB each
              </p>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Opening Time <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FaClock className="text-gray-400 h-3.5 w-3.5" />
                  </div>
                  <input
                    type="text"
                    name="vendorShopOpeningTime"
                    placeholder="09:00 AM"
                    value={formData.vendorShopOpeningTime}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-sm transition-all"
                    required
                  />
                </div>
                {errors.vendorShopOpeningTime && <p className="text-rose-500 text-xs mt-2 font-medium">{errors.vendorShopOpeningTime}</p>}
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  Closing Time <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FaClock className="text-gray-400 h-3.5 w-3.5" />
                  </div>
                  <input
                    type="text"
                    name="vendorShopClosingTime"
                    placeholder="09:00 PM"
                    value={formData.vendorShopClosingTime}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-sm transition-all"
                    required
                  />
                </div>
                {errors.vendorShopClosingTime && <p className="text-rose-500 text-xs mt-2 font-medium">{errors.vendorShopClosingTime}</p>}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Shop Description <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute top-3.5 left-3.5 pointer-events-none">
                  <FaAlignLeft className="text-gray-400 h-3.5 w-3.5" />
                </div>
                <textarea
                  name="vendorShopDescription"
                  className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 min-h-[100px] resize-none text-sm transition-all"
                  placeholder="Describe your shop/mall..."
                  value={formData.vendorShopDescription}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.vendorShopDescription && <p className="text-rose-500 text-xs mt-2 font-medium">{errors.vendorShopDescription}</p>}
            </div>

            {/* Password Field with Eye Icon */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Password <span className="text-rose-500">*</span> <span className="text-gray-400 font-normal">(at least 8 characters)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400 h-3.5 w-3.5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${
                    errors.password ? 'border-rose-300' : 'border-gray-200 focus:border-indigo-400'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-rose-500 text-xs mt-2 font-medium">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field with Eye Icon */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <FaCheck className="text-gray-400 h-3.5 w-3.5" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all ${
                    errors.confirmPassword ? 'border-rose-300' : 'border-gray-200 focus:border-indigo-400'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-rose-500 text-xs mt-2 font-medium">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl ring-1 ring-gray-100">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="agreement"
                  className="h-4 w-4 rounded border-gray-300 accent-[#4F46E5] focus:ring-indigo-500 mt-0.5"
                  required
                />
                <label htmlFor="agreement" className="text-sm text-gray-600 leading-relaxed">
                  I agree to the terms and conditions, and confirm that all information provided is accurate
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-5 py-3 ring-1 ring-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>
          )}
          
          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={nextStep}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm shadow-indigo-600/25"
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-indigo-600/25"
            >
              {isLoading ? 'Registering...' : 'Complete Registration'}
            </button>
          )}
        </div>

        <div className="mt-7 text-center">
          <p className="text-gray-500 text-sm">
            Already registered?{' '}
            <Link to="/vendor/login" className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </form>

      <div className="mt-6 p-5 bg-indigo-50/60 rounded-2xl ring-1 ring-indigo-100">
        <h4 className="font-bold text-gray-900 text-sm mb-1">Need a hand?</h4>
        <p className="text-sm text-gray-500 mb-3">
          Our support team can help with anything during registration.
        </p>
        <div className="flex items-center gap-2 text-sm">
          <FaHeadset className="h-3.5 w-3.5 text-indigo-500" />
          <span className="text-gray-700 font-medium">+1 (555) 123-4567</span>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VendorRegister;