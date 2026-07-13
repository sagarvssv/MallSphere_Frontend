import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import FormInput from '../../components/FormInput';
import { FaEnvelope, FaStore, FaLock, FaShieldAlt, FaPaperPlane, FaEye, FaEyeSlash, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { sellerApi } from '../../hooks/sellerApi'; 
import { useAuth } from '../../context/AuthContext'

const StallOwnerLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginSeller } = useAuth();

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
    
    // Check if user has a verified email but hasn't logged in yet
    const isEmailVerified = localStorage.getItem('stallOwnerEmailVerified');
    const verifiedEmail = localStorage.getItem('stallOwnerVerifiedEmail');
    
    if (isEmailVerified === 'true' && verifiedEmail && !location.state?.fromVerification) {
      setFormData(prev => ({ ...prev, email: verifiedEmail }));
      setApiError('✅ Your email has been verified! Please login to continue.');
      setTimeout(() => {
        localStorage.removeItem('stallOwnerEmailVerified');
        localStorage.removeItem('stallOwnerVerifiedEmail');
        localStorage.removeItem('stallOwnerVerificationTime');
      }, 5000);
    }
    
    // Check for pending verification from registration
    const pendingVerification = localStorage.getItem('pendingStallOwnerVerification');
    if (pendingVerification) {
      const data = JSON.parse(pendingVerification);
      if (data.email && !data.verified && !location.state?.verified) {
        setShowVerificationBanner(true);
        setVerificationEmail(data.email);
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
      const response = await sellerApi.resendOtp(unverifiedEmail);
      
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
    localStorage.setItem('pendingStallOwnerVerification', JSON.stringify({
      email: unverifiedEmail,
      timestamp: new Date().toISOString(),
      fromLogin: true
    }));
    
    navigate('/stall-owner/verify-otp', {
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
    
    localStorage.setItem('pendingStallOwnerVerification', JSON.stringify({
      email: emailToVerify,
      timestamp: new Date().toISOString(),
      fromLogin: true
    }));
    
    navigate('/stall-owner/verify-otp', {
      state: {
        email: emailToVerify,
        fromLogin: true
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      const response = await sellerApi.loginSellerStall(formData.email, formData.password);
      
      console.log('Login successful:', response);
      
      if (response.success || response.sellerId || response.token) {
        // Clear pending verification
        localStorage.removeItem('pendingStallOwnerVerification');
        navigate('/stall-owner/dashboard');
      } else {
        setApiError('Login successful but unexpected response format');
      }

      loginSeller(response);
      navigate('/stall-owner/dashboard', { replace: true });
      
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.message) {
        if (error.message.includes('Invalid email or password')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (error.message.toLowerCase().includes('verify') || 
                   error.message.toLowerCase().includes('not verified')) {
          // Show verification banner and dialog
          setUnverifiedEmail(formData.email);
          setVerificationEmail(formData.email);
          setShowVerificationBanner(true);
          setShowVerificationDialog(true);
          errorMessage = '⚠️ Your account is not verified. Please verify your email to continue.';
        } else if (error.message.includes('Network error')) {
          errorMessage = 'Unable to connect to server. Please check your internet connection.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setApiError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (formData.email) {
      navigate('/stall-owner/forgot-password', { 
        state: { email: formData.email } 
      });
    } else {
      navigate('/stall-owner/forgot-password');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
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
            Your stall owner account needs to be verified before you can access your dashboard.
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
              onClick={() => setShowVerificationBanner(false)}
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
            Your stall owner account is not verified yet. We'll send a one-time code to verify your email address.
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
    <AuthLayout type="login" role="stall-owner" backLink="/">
      {/* Verification Dialog */}
      {showVerificationDialog && <VerificationDialog />}

      <form onSubmit={handleSubmit}>
        {/* Verification Banner */}
        {showVerificationBanner && <VerificationBanner />}

        {/* API Error Message */}
        {apiError && (
          <div className={`mb-6 p-4 rounded-2xl ring-1 flex items-start gap-3 ${
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
            placeholder="stall@example.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            icon={<FaEnvelope className="text-gray-400" />}
            required
            disabled={isLoading}
          />

          {/* Password Field with Eye Icon */}
          <div className="relative">
            <FormInput
              label="Password"
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              icon={<FaLock className="text-gray-400" />}
              required
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <FaEyeSlash className="h-4 w-4" />
              ) : (
                <FaEye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-5 mb-7">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              className="h-4 w-4 rounded border-gray-300 accent-[#C026D3] focus:ring-fuchsia-500"
              disabled={isLoading}
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-600">
              Remember me
            </label>
          </div>
          <button
            type="button"
            onClick={handleForgotPassword}
            className="text-sm text-fuchsia-600 hover:text-fuchsia-800 font-semibold bg-transparent border-none cursor-pointer transition-colors"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-[#C026D3] to-[#6D28D9] text-white py-3.5 px-6 rounded-xl font-semibold text-base transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-fuchsia-600/25 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <FaSpinner className="animate-spin h-4 w-4 mr-2.5" />
              Signing in...
            </>
          ) : (
            'Sign In to Dashboard'
          )}
        </button>

        <div className="mt-7 text-center">
          <p className="text-gray-500 text-sm">
            New stall owner?{' '}
            <Link 
              to="/stall-owner/register" 
              className="text-fuchsia-600 hover:text-fuchsia-800 font-semibold transition-colors"
            >
              Register your stall
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default StallOwnerLogin;