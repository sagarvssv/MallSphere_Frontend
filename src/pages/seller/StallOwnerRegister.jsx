import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import FormInput from '../../components/FormInput';
import sellerApi from '../../hooks/sellerApi'
import {
  FaUser,
  FaEnvelope,
  FaStore,
  FaMapMarkerAlt,
  FaPhone,
  FaLock,
  FaCheck,
  FaBuilding,
  FaIdCard,
  FaTags,
  FaEye,
  FaEyeSlash,
  FaCamera,
  FaShieldAlt,
  FaExclamationTriangle,
  FaArrowLeft,
  FaArrowRight,
} from 'react-icons/fa';

const STEPS = [
  { id: 1, label: 'Profile' },
  { id: 2, label: 'Business' },
  { id: 3, label: 'Owner' },
  { id: 4, label: 'Security' },
];

const StallOwnerRegister = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    licenseId: '',
    mallName: '',
    shopName: '',
    category: '',
    sellerShopAddress: '',
    sellerContactNumber: '',
    location: '',
    floorNumber: '',
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [sellerShopImages, setSellerShopImages] = useState([]);
  const [profilePreview, setProfilePreview] = useState('');
  const [shopImagePreviews, setShopImagePreviews] = useState([]);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handle text input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (apiError) setApiError('');
  };

  // Handle profile picture
  const handleProfilePicture = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result);
      reader.readAsDataURL(file);
      if (errors.profilePicture) setErrors((prev) => ({ ...prev, profilePicture: '' }));
    }
  };

  // Handle shop images (1–5)
  const handleShopImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setSellerShopImages(files);
    const previews = [];
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result);
        if (previews.length === files.length) setShopImagePreviews([...previews]);
      };
      reader.readAsDataURL(file);
    });
    if (errors.sellerShopImages) setErrors((prev) => ({ ...prev, sellerShopImages: '' }));
  };

  // Full validation (used as final gate before submit)
  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.licenseId.trim()) newErrors.licenseId = 'License ID is required';
    if (!formData.mallName.trim()) newErrors.mallName = 'Mall name is required';
    if (!formData.shopName.trim()) newErrors.shopName = 'Shop name is required';
    if (!formData.category.trim()) newErrors.category = 'Category is required';
    if (!formData.sellerShopAddress.trim()) newErrors.sellerShopAddress = 'Shop address is required';
    if (!formData.sellerContactNumber.trim()) newErrors.sellerContactNumber = 'Contact number is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.floorNumber) newErrors.floorNumber = 'Floor number is required';
    if (!profilePicture) newErrors.profilePicture = 'Profile picture is required';
    if (sellerShopImages.length === 0) newErrors.sellerShopImages = 'At least one shop image is required';
    return newErrors;
  };

  // Per-step validation, used to gate "Next"
  const validateStep = (stepNum) => {
    const newErrors = {};

    if (stepNum === 1) {
      if (!profilePicture) newErrors.profilePicture = 'Profile picture is required';
      if (sellerShopImages.length === 0) newErrors.sellerShopImages = 'At least one shop image is required';
    }

    if (stepNum === 2) {
      if (!formData.shopName.trim()) newErrors.shopName = 'Shop name is required';
      if (!formData.mallName.trim()) newErrors.mallName = 'Mall name is required';
      if (!formData.licenseId.trim()) newErrors.licenseId = 'License ID is required';
      if (!formData.category.trim()) newErrors.category = 'Category is required';
      if (!formData.sellerContactNumber.trim()) newErrors.sellerContactNumber = 'Contact number is required';
      if (!formData.location.trim()) newErrors.location = 'Location is required';
      if (!formData.floorNumber) newErrors.floorNumber = 'Floor number is required';
      if (!formData.sellerShopAddress.trim()) newErrors.sellerShopAddress = 'Shop address is required';
    }

    if (stepNum === 3) {
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    }

    return newErrors;
  };

  const handleNext = () => {
    const stepErrors = validateStep(step);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    setStep((s) => Math.min(s + 1, STEPS.length));
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      // Jump back to the earliest step that has an error
      if (validationErrors.profilePicture || validationErrors.sellerShopImages) setStep(1);
      else if (validationErrors.shopName || validationErrors.mallName || validationErrors.licenseId ||
               validationErrors.category || validationErrors.sellerContactNumber || validationErrors.location ||
               validationErrors.floorNumber || validationErrors.sellerShopAddress) setStep(2);
      else if (validationErrors.name || validationErrors.email) setStep(3);
      else setStep(4);
      return;
    }

    setIsLoading(true);
    try {
      const sellerData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        licenseId: formData.licenseId,
        mallName: formData.mallName,
        shopName: formData.shopName,
        category: formData.category,
        sellerShopAddress: formData.sellerShopAddress,
        sellerContactNumber: formData.sellerContactNumber,
        location: formData.location,
        floorNumber: formData.floorNumber,
      };

      const data = await sellerApi.registerSellerStall(sellerData, profilePicture, sellerShopImages);
      console.log('Registration success:', data);

      // Redirect to OTP verification, passing email along
      navigate('/stall-owner/verify-otp', { state: { email: data.email } });
    } catch (error) {
      console.error('Registration error:', error);
      setApiError(error.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const SectionHeader = ({ icon: Icon, eyebrow, title }) => (
    <div className="flex items-center gap-3 mb-6">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C026D3] to-[#6D28D9] flex items-center justify-center shrink-0">
        <Icon className="text-white text-sm" />
      </div>
      <div>
        <p className="text-[10px] font-semibold tracking-[0.1em] uppercase text-fuchsia-500">{eyebrow}</p>
        <h2 className="text-base font-bold text-gray-900">{title}</h2>
      </div>
    </div>
  );

  const Stepper = () => (
    <div className="flex items-center mb-8">
      {STEPS.map((s, idx) => {
        const isDone = step > s.id;
        const isActive = step === s.id;
        return (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isDone
                    ? 'bg-gradient-to-br from-[#C026D3] to-[#6D28D9] text-white'
                    : isActive
                      ? 'ring-2 ring-fuchsia-500 text-fuchsia-600 bg-fuchsia-50'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isDone ? <FaCheck className="h-3 w-3" /> : s.id}
              </div>
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                isActive ? 'text-fuchsia-600' : isDone ? 'text-gray-600' : 'text-gray-300'
              }`}>
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 -mt-4 rounded-full transition-colors ${
                step > s.id ? 'bg-gradient-to-r from-[#C026D3] to-[#6D28D9]' : 'bg-gray-100'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  return (
    <AuthLayout type="register" role="stall-owner" backLink="/stall-owner/login">
      <form onSubmit={handleSubmit}>

        <Stepper />

        {/* API Error Banner */}
        {apiError && (
          <div className="mb-6 p-4 bg-rose-50 ring-1 ring-rose-200 rounded-2xl flex items-start gap-3">
            <FaExclamationTriangle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
            <p className="text-sm font-medium text-rose-600">{apiError}</p>
          </div>
        )}

        {/* Step 1: Profile Section */}
        {step === 1 && (
          <div>
            <SectionHeader icon={FaUser} eyebrow="Step 1 of 4" title="Profile Information" />

            {/* Profile Picture */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-semibold mb-2.5">
                Profile Picture <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 relative">
                  {profilePreview ? (
                    <img
                      src={profilePreview}
                      alt="Profile preview"
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-fuchsia-50"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-50 ring-1 ring-gray-200 border border-dashed border-gray-300 flex items-center justify-center">
                      <FaCamera className="text-gray-300 text-xl" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    name="profilePicture"
                    accept="image/*"
                    onChange={handleProfilePicture}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100 file:transition-colors file:cursor-pointer cursor-pointer"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Recommended: Square image, 400×400px</p>
                </div>
              </div>
              {errors.profilePicture && (
                <p className="text-rose-500 text-xs mt-2 font-medium">{errors.profilePicture}</p>
              )}
            </div>

            {/* Shop Images */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2.5">
                Shop Images <span className="text-rose-500">*</span>{' '}
                <span className="text-gray-400 font-normal">(1–5 images)</span>
              </label>
              <input
                type="file"
                name="sellerShopImage"
                accept="image/*"
                multiple
                onChange={handleShopImages}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100 file:transition-colors file:cursor-pointer cursor-pointer"
              />
              {shopImagePreviews.length > 0 && (
                <div className="flex gap-2.5 mt-3.5 flex-wrap">
                  {shopImagePreviews.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`Shop ${i + 1}`}
                      className="w-20 h-20 rounded-xl object-cover ring-1 ring-gray-200 hover:ring-fuchsia-300 transition-all"
                    />
                  ))}
                </div>
              )}
              {errors.sellerShopImages && (
                <p className="text-rose-500 text-xs mt-2 font-medium">{errors.sellerShopImages}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Business Information */}
        {step === 2 && (
          <div>
            <SectionHeader icon={FaStore} eyebrow="Step 2 of 4" title="Business Information" />
            <div className="grid md:grid-cols-2 gap-5">
              <FormInput
                label="Shop Name"
                type="text"
                name="shopName"
                placeholder="Fashion Hub"
                value={formData.shopName}
                onChange={handleChange}
                error={errors.shopName}
                icon={<FaStore className="text-gray-400" />}
                required
              />

              <FormInput
                label="Mall Name"
                type="text"
                name="mallName"
                placeholder="City Mall"
                value={formData.mallName}
                onChange={handleChange}
                error={errors.mallName}
                icon={<FaBuilding className="text-gray-400" />}
                required
              />

              <FormInput
                label="License ID"
                type="text"
                name="licenseId"
                placeholder="LIC-2024-001"
                value={formData.licenseId}
                onChange={handleChange}
                error={errors.licenseId}
                icon={<FaIdCard className="text-gray-400" />}
                required
              />

              <FormInput
                label="Category"
                type="text"
                name="category"
                placeholder="Fashion, Food, Electronics..."
                value={formData.category}
                onChange={handleChange}
                error={errors.category}
                icon={<FaTags className="text-gray-400" />}
                required
              />

              <FormInput
                label="Contact Number"
                type="tel"
                name="sellerContactNumber"
                placeholder="+1 234 567 8900"
                value={formData.sellerContactNumber}
                onChange={handleChange}
                error={errors.sellerContactNumber}
                icon={<FaPhone className="text-gray-400" />}
                required
              />

              <FormInput
                label="Location"
                type="text"
                name="location"
                placeholder="Hyderabad"
                value={formData.location}
                onChange={handleChange}
                error={errors.location}
                icon={<FaMapMarkerAlt className="text-gray-400" />}
                required
              />

              <FormInput
                label="Floor Number"
                type="text"
                name="floorNumber"
                placeholder="1"
                value={formData.floorNumber}
                onChange={handleChange}
                error={errors.floorNumber}
                required
              />
            </div>

            {/* Shop Address */}
            <div className="mt-5">
              <label className="block text-gray-700 text-sm font-semibold mb-2.5">
                Shop Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute top-3.5 left-3.5 pointer-events-none">
                  <FaMapMarkerAlt className="text-gray-400 h-4 w-4" />
                </div>
                <textarea
                  name="sellerShopAddress"
                  className={`w-full px-4 py-3 pl-10 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30 min-h-[100px] resize-none transition-all ${
                    errors.sellerShopAddress ? 'border-rose-300' : 'border-gray-200 focus:border-fuchsia-400'
                  }`}
                  placeholder="Full shop address including mall name..."
                  value={formData.sellerShopAddress}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.sellerShopAddress && (
                <p className="text-rose-500 text-xs mt-2 font-medium">{errors.sellerShopAddress}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Owner Information */}
        {step === 3 && (
          <div>
            <SectionHeader icon={FaUser} eyebrow="Step 3 of 4" title="Owner Information" />
            <div className="grid md:grid-cols-2 gap-5">
              <FormInput
                label="Full Name"
                type="text"
                name="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                icon={<FaUser className="text-gray-400" />}
                required
              />

              <FormInput
                label="Email Address"
                type="email"
                name="email"
                placeholder="owner@example.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                icon={<FaEnvelope className="text-gray-400" />}
                required
              />
            </div>
          </div>
        )}

        {/* Step 4: Security + Agreement */}
        {step === 4 && (
          <div>
            <SectionHeader icon={FaShieldAlt} eyebrow="Step 4 of 4" title="Security" />
            <div className="grid md:grid-cols-2 gap-5 mb-6">
              {/* Password Field */}
              <div className="relative">
                <label className="block text-gray-700 text-sm font-semibold mb-2.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400 h-3.5 w-3.5" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30 transition-all ${
                      errors.password ? 'border-rose-300' : 'border-gray-200 focus:border-fuchsia-400'
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

              {/* Confirm Password Field */}
              <div className="relative">
                <label className="block text-gray-700 text-sm font-semibold mb-2.5">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FaCheck className="text-gray-400 h-3.5 w-3.5" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30 transition-all ${
                      errors.confirmPassword ? 'border-rose-300' : 'border-gray-200 focus:border-fuchsia-400'
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
            </div>

            {/* Agreement */}
            <div className="p-4 bg-gray-50 rounded-2xl ring-1 ring-gray-100">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="agreement"
                  className="h-4 w-4 rounded border-gray-300 accent-[#C026D3] focus:ring-fuchsia-500 mt-0.5"
                  required
                />
                <label htmlFor="agreement" className="text-sm text-gray-600 leading-relaxed">
                  I agree to the stall owner agreement and mall regulations
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm ring-1 ring-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <FaArrowLeft className="h-3 w-3" />
              Back
            </button>
          )}

          {step < STEPS.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#C026D3] to-[#6D28D9] text-white py-3 px-6 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 shadow-sm shadow-fuchsia-600/25"
            >
              Continue
              <FaArrowRight className="h-3 w-3" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-[#C026D3] to-[#6D28D9] text-white py-3 px-6 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-fuchsia-600/25"
            >
              {isLoading ? 'Registering stall...' : 'Register Stall'}
            </button>
          )}
        </div>

        <div className="mt-7 text-center">
          <p className="text-gray-500 text-sm">
            Already registered?{' '}
            <Link to="/stall-owner/login" className="text-fuchsia-600 hover:text-fuchsia-800 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default StallOwnerRegister;