import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import FormInput from '../../components/FormInput';
import { FaEnvelope, FaLock, FaShieldAlt, FaPaperPlane, FaEye, FaEyeSlash } from 'react-icons/fa';
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
    <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-lg shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <FaShieldAlt className="text-amber-600 text-lg" />
          </div>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-amber-800 mb-1">
            Account Verification Required
          </h4>
          <p className="text-sm text-amber-700 mb-3">
            Your account needs to be verified before you can access your vendor dashboard.
            {verificationEmail && (
              <> We'll send a verification code to <strong className="font-mono">{verificationEmail}</strong></>
            )}
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={handleVerifyFromBanner}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <FaPaperPlane className="text-sm" />
              Send OTP & Verify Account
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowVerificationDialog(false)}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl transform transition-all" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Email Verification Required</h3>
          <p className="text-gray-600">
            Your account is not verified yet. We'll send a One-Time Password (OTP) to verify your email address.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Email: <strong className="text-amber-700 font-mono">{unverifiedEmail}</strong>
          </p>
        </div>

        {resendMessage && (
          <div className={`mb-4 p-3 rounded-lg ${resendMessage.includes('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            <p className="text-sm">{resendMessage}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleProceedToVerification}
            className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:from-amber-700 hover:to-orange-700 flex items-center justify-center gap-2"
          >
            <FaPaperPlane />
            Send Verification OTP
          </button>
          
          <button
            onClick={handleResendVerificationOtp}
            disabled={isResendingOtp}
            className="w-full border-2 border-amber-600 text-amber-600 py-3 px-6 rounded-lg font-semibold transition-all duration-300 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResendingOtp ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Resending...
              </span>
            ) : (
              'Resend OTP'
            )}
          </button>
          
          <button
            onClick={() => {
              setShowVerificationDialog(false);
              setResendMessage('');
            }}
            className="w-full text-gray-600 py-2 px-6 rounded-lg font-medium hover:text-gray-800 transition-colors"
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

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-xl">
        {/* Verification Banner - Only shows when there's an unverified login attempt */}
        {showVerificationBanner && <VerificationBanner />}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Vendor Login</h3>
            <span className="px-3 py-1 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-xs font-semibold rounded-full">
              Shop Owner
            </span>
          </div>
          <p className="text-gray-600">Access your vendor dashboard to manage your shop</p>
        </div>

        {/* API Error Message */}
        {apiError && (
          <div className={`mb-4 p-3 rounded-lg ${
            apiError.includes('✅') ? 'bg-green-50 border border-green-200' : 
            apiError.includes('⚠️') ? 'bg-amber-50 border border-amber-200' :
            'bg-red-50 border border-red-200'
          }`}>
            <p className={`text-sm ${
              apiError.includes('✅') ? 'text-green-700' : 
              apiError.includes('⚠️') ? 'text-amber-700' :
              'text-red-700'
            }`}>{apiError}</p>
          </div>
        )}

        <FormInput
          label="Email Address"
          type="email"
          name="email"
          placeholder="your.shop@email.com"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          icon={<FaEnvelope className="text-gray-400" />}
          required
        />

        {/* Password Field with Eye Icon */}
        <div className="relative mb-6">
          <label className="block text-gray-700 text-sm font-semibold mb-2">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaLock className="text-gray-400" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full pl-10 pr-10 py-3 border-2 rounded-lg focus:outline-none focus:border-indigo-500 ${
                errors.password ? 'border-red-400' : 'border-gray-300'
              }`}
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none transition-colors duration-200"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-300 hover:shadow-lg hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Logging in...
            </span>
          ) : (
            'Login to Dashboard'
          )}
        </button>

        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Don't have a vendor account?{' '}
            <Link to="/vendor/register" className="text-indigo-600 hover:text-indigo-800 font-semibold">
              Register your shop
            </Link>
          </p>
        </div>
      </form>

      <div className="mt-8 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-indigo-800">
              <strong>Need help?</strong> Contact support at support@mallsphere.com or call +1 (555) 123-4567.
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VendorLogin;