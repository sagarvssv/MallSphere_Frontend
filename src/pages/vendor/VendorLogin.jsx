import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import FormInput from '../../components/FormInput';
import { FaEnvelope, FaLock, FaShieldAlt, FaPaperPlane, FaEye, FaEyeSlash, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaStore, FaHeadset } from 'react-icons/fa';
import { vendorApi } from '../../hooks/vendorApi';
import { useAuth } from '../../context/AuthContext';

const VendorLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginVendor } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [showVerificationBanner, setShowVerificationBanner] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (location.state?.message) {
      setApiError(location.state.message);
    }
    if (location.state?.verifiedEmail) {
      setFormData(prev => ({ ...prev, email: location.state.verifiedEmail }));
    }
    
    const isEmailVerified = localStorage.getItem('vendorEmailVerified');
    const verifiedEmail = localStorage.getItem('vendorVerifiedEmail');
    
    if (isEmailVerified === 'true' && verifiedEmail && !location.state?.fromVerification) {
      setFormData(prev => ({ ...prev, email: verifiedEmail }));
      setApiError('✅ Your email has been verified! Please login to continue.');
      setTimeout(() => {
        localStorage.removeItem('vendorEmailVerified');
        localStorage.removeItem('vendorVerifiedEmail');
        localStorage.removeItem('vendorVerificationTime');
      }, 5000);
    }
    
    // ONLY show verification banner if coming from an unverified login attempt
    // Check if we have a pending verification that was created from login (not registration)
    const pendingVerification = localStorage.getItem('pendingVendorVerification');
    if (pendingVerification) {
      try {
        const data = JSON.parse(pendingVerification);
        // Only show banner if:
        // 1. It's from login (fromLogin === true)
        // 2. Not already verified
        // 3. Not coming from verification page
        // 4. Not already shown (check if we haven't dismissed it)
        if (data.fromLogin === true && !data.verified && !location.state?.verified && !sessionStorage.getItem('bannerDismissed')) {
          setShowVerificationBanner(true);
          setVerificationEmail(data.email);
          // Don't remove the item yet, keep it for resend functionality
        }
      } catch (error) {
        console.error('Error parsing pending verification:', error);
      }
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (apiError) {
      setApiError('');
    }
    // Clear verification banner when user starts typing
    if (showVerificationBanner) {
      setShowVerificationBanner(false);
      // Also store in sessionStorage that banner was dismissed
      sessionStorage.setItem('bannerDismissed', 'true');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    return newErrors;
  };

  const handleResendVerificationOtp = async () => {
    setIsResendingOtp(true);
    setResendMessage('');
    
    try {
      const storedData = localStorage.getItem('pendingVendorVerification');
      let vendorLicenseNumber = '';
      
      if (storedData) {
        const data = JSON.parse(storedData);
        vendorLicenseNumber = data.vendorLicenseNumber || '';
      }
      
      const response = await vendorApi.resendOtp(unverifiedEmail, vendorLicenseNumber);
      
      setResendMessage('✅ Verification OTP has been resent to your email!');
      setTimeout(() => setResendMessage(''), 5000);
      
    } catch (error) {
      console.error('Resend OTP error:', error);
      setResendMessage('❌ Failed to resend OTP. Please try again.');
      setTimeout(() => setResendMessage(''), 5000);
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleProceedToVerification = () => {
    // Store the email for verification
    localStorage.setItem('pendingVendorVerification', JSON.stringify({
      email: unverifiedEmail,
      timestamp: Date.now(),
      fromLogin: true
    }));
    
    // Clear banner dismissed flag
    sessionStorage.removeItem('bannerDismissed');
    
    // Navigate to OTP verification page
    navigate('/vendor/verify-otp', {
      state: {
        email: unverifiedEmail,
        fromLogin: true
      }
    });
  };

  const handleVerifyFromBanner = () => {
    const emailToVerify = verificationEmail || formData.email;
    if (!emailToVerify) {
      setApiError('⚠️ Please enter your email address to verify');
      return;
    }
    
    localStorage.setItem('pendingVendorVerification', JSON.stringify({
      email: emailToVerify,
      timestamp: Date.now(),
      fromLogin: true
    }));
    
    // Clear banner dismissed flag
    sessionStorage.removeItem('bannerDismissed');
    
    navigate('/vendor/verify-otp', {
      state: {
        email: emailToVerify,
        fromLogin: true
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    
    const validationErrors = validateForm();
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting vendor login...');
      
      const response = await vendorApi.loginVendor({
        email: formData.email,
        password: formData.password
      });

      console.log('Login successful:', response);

      if (response.user || response.vendor) {
        localStorage.setItem('vendorData', JSON.stringify(response.user || response.vendor));
      }

      if (response.message) {
        console.log('Login message:', response.message);
      }

      // Clear any pending verification data on successful login
      localStorage.removeItem('pendingVendorVerification');
      sessionStorage.removeItem('bannerDismissed');

      loginVendor(response);
      
      navigate('/vendor/dashboard', { replace: true });

    } catch (error) {
      console.error('Login error:', error);
      console.error('Error message:', error.message);
      
      // Check for verification error - this catches the "Please verify your account first" message
      if (error.message && (
          error.message.toLowerCase().includes('verify') || 
          error.message.toLowerCase().includes('not verified') ||
          error.message.toLowerCase().includes('please verify your account')
      )) {
        // Store unverified email for verification
        setUnverifiedEmail(formData.email);
        setVerificationEmail(formData.email);
        
        // Store pending verification data
        localStorage.setItem('pendingVendorVerification', JSON.stringify({
          email: formData.email,
          timestamp: Date.now(),
          fromLogin: true,
          verified: false
        }));
        
        // Clear any previous dismissal
        sessionStorage.removeItem('bannerDismissed');
        
        // Show verification banner and dialog
        setShowVerificationBanner(true);
        setShowVerificationDialog(true);
        
        // Also set a user-friendly error message
        setApiError('⚠️ Your account is not verified. Please verify your email to continue.');
      } 
      else if (error.message.includes('Network')) {
        setApiError('Network error. Please check your internet connection.');
      } 
      else if (error.message.includes('401') || error.message.includes('Invalid credentials')) {
        setApiError('Invalid email or password. Please try again.');
      } 
      else {
        setApiError(error.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (formData.email) {
      navigate('/vendor/forgot-password', { state: { email: formData.email } });
    } else {
      navigate('/vendor/forgot-password');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const dismissBanner = () => {
    setShowVerificationBanner(false);
    sessionStorage.setItem('bannerDismissed', 'true');
  };

  // Verification Banner Component
  const VerificationBanner = () => (
    <div className="mb-6 p-4 bg-amber-50 ring-1 ring-amber-200 rounded-2xl">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
          <FaShieldAlt className="text-amber-600 text-sm" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-amber-800 mb-1">
            Account verification required
          </h4>
          <p className="text-sm text-amber-700 mb-3.5 leading-relaxed">
            Your account needs to be verified before you can access your vendor dashboard.
            {verificationEmail && (
              <> We'll send a verification code to <strong className="font-mono">{verificationEmail}</strong></>
            )}
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={handleVerifyFromBanner}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-700 transition-colors shadow-sm shadow-amber-600/25"
            >
              <FaPaperPlane className="text-xs" />
              Send OTP & verify
            </button>
            <button
              onClick={dismissBanner}
              className="text-amber-700 text-sm font-medium hover:text-amber-900 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Verification Dialog Component
  const VerificationDialog = () => (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowVerificationDialog(false)}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FaShieldAlt className="w-6 h-6 text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Email verification required</h3>
          <p className="text-gray-500 text-sm leading-relaxed">
            Your account is not verified yet. We'll send a one-time code to verify your email address.
          </p>
          <p className="text-sm text-gray-400 mt-3">
            Email: <span className="text-amber-600 font-mono font-medium">{unverifiedEmail}</span>
          </p>
        </div>

        {resendMessage && (
          <div className={`mb-4 p-3 rounded-xl ring-1 ${
            resendMessage.includes('✅')
              ? 'bg-emerald-50 ring-emerald-200 text-emerald-700'
              : 'bg-rose-50 ring-rose-200 text-rose-600'
          }`}>
            <p className="text-sm font-medium">{resendMessage}</p>
          </div>
        )}

        <div className="space-y-2.5">
          <button
            onClick={handleProceedToVerification}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 px-6 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 flex items-center justify-center gap-2 shadow-sm shadow-amber-500/25"
          >
            <FaPaperPlane className="text-xs" />
            Send verification OTP
          </button>
          
          <button
            onClick={handleResendVerificationOtp}
            disabled={isResendingOtp}
            className="w-full ring-1 ring-amber-300 text-amber-600 py-3 px-6 rounded-xl font-semibold text-sm transition-colors hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isResendingOtp ? (
              <>
                <FaSpinner className="animate-spin h-3.5 w-3.5" />
                Resending...
              </>
            ) : (
              'Resend OTP'
            )}
          </button>
          
          <button
            onClick={() => {
              setShowVerificationDialog(false);
              setResendMessage('');
            }}
            className="w-full text-gray-500 py-2.5 px-6 rounded-xl font-medium text-sm hover:text-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <AuthLayout type="login" role="vendor" backLink="/">
      {/* Verification Dialog - This will pop up automatically */}
      {showVerificationDialog && <VerificationDialog />}

      <form onSubmit={handleSubmit}>
        {/* Verification Banner - Only shows when there's an unverified login attempt */}
        {showVerificationBanner && <VerificationBanner />}

        <div className="mb-6 pb-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4F46E5] to-[#6D28D9] flex items-center justify-center shrink-0">
                <FaStore className="text-white text-sm" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Vendor Login</h3>
            </div>
            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[11px] font-semibold rounded-full ring-1 ring-indigo-200">
              Mall Owner
            </span>
          </div>
          <p className="text-gray-500 text-sm">Access your vendor dashboard to manage your mall</p>
        </div>

        {/* API Error Message */}
        {apiError && (
          <div className={`mb-5 p-4 rounded-2xl ring-1 flex items-start gap-3 ${
            apiError.includes('✅') ? 'bg-emerald-50 ring-emerald-200' :
            apiError.includes('⚠️') ? 'bg-amber-50 ring-amber-200' :
            'bg-rose-50 ring-rose-200'
          }`}>
            {apiError.includes('✅') ? (
              <FaCheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
            ) : apiError.includes('⚠️') ? (
              <FaShieldAlt className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            ) : (
              <FaExclamationTriangle className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
            )}
            <p className={`text-sm font-medium ${
              apiError.includes('✅') ? 'text-emerald-700' :
              apiError.includes('⚠️') ? 'text-amber-700' :
              'text-rose-600'
            }`}>{apiError}</p>
          </div>
        )}

        <div className="space-y-5">
          <FormInput
            label="Email Address"
            type="email"
            name="email"
            placeholder="your.mall@email.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            icon={<FaEnvelope className="text-gray-400" />}
            required
          />

          {/* Password Field with Eye Icon */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <FaLock className="text-gray-400 h-3.5 w-3.5" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
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
        </div>

        <div className="flex items-center justify-between mt-5 mb-7">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              className="h-4 w-4 rounded border-gray-300 accent-[#4F46E5] focus:ring-indigo-500"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-600">
              Remember me
            </label>
          </div>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-[#4F46E5] to-[#6D28D9] text-white py-3.5 px-6 rounded-xl font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-indigo-600/25 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin h-4 w-4 mr-2.5" />
              Logging in...
            </>
          ) : (
            'Login to Dashboard'
          )}
        </button>

        <div className="mt-7 text-center">
          <p className="text-gray-500 text-sm">
            Don't have a vendor account?{' '}
            <Link to="/vendor/register" className="text-indigo-600 hover:text-indigo-800 font-semibold transition-colors">
              Register your mall
            </Link>
          </p>
        </div>
      </form>

      <div className="mt-6 p-4 bg-indigo-50/60 rounded-2xl ring-1 ring-indigo-100">
        <div className="flex items-start gap-3">
          <FaHeadset className="h-4 w-4 text-indigo-500 mt-0.5 shrink-0" />
          <p className="text-sm text-indigo-800">
            <strong className="font-semibold">Need help?</strong> Contact support at support@mallsphere.com or call +1 (555) 123-4567.
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VendorLogin;