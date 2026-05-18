// components/AuthModal.jsx
import React, { useState, useEffect } from 'react';
import { Shield, Loader2, CheckCircle, AlertCircle, Mail, Lock, User } from 'lucide-react';
import { superAdminAuth } from '../../hooks/superAdminAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';  // ✅ ADDED: Import auth context

const AuthModal = ({ onAuthSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginSuperAdmin } = useAuth();  // ✅ ADDED: Get login function from auth context
  
  // Determine auth mode from URL
  const getInitialAuthMode = () => {
    if (location.pathname.includes('/register')) return 'register';
    if (location.pathname.includes('/login')) return 'login';
    return 'login'; // default
  };

  const [authMode, setAuthMode] = useState(getInitialAuthMode());
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    hasMinLength: false
  });
  const [cooldown, setCooldown] = useState(0);
  const [resetStep, setResetStep] = useState('email'); // 'email' or 'reset'

  // Update auth mode when URL changes
  useEffect(() => {
    setAuthMode(getInitialAuthMode());
    // Clear form when switching between routes
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      otp: '',
      newPassword: '',
      confirmNewPassword: ''
    });
    setError('');
    setSuccess('');
    setShowOTP(false);
    setShowResetPassword(false);
    setRegisteredEmail('');
    setResetEmail('');
    setResetStep('email');
  }, [location.pathname]);

  // Password strength checker
  useEffect(() => {
    const password = showResetPassword ? formData.newPassword : formData.password;
    const validation = superAdminAuth.validatePassword(password);
    setPasswordStrength(validation.requirements);
  }, [formData.password, formData.newPassword, showResetPassword]);

  // OTP resend cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate inputs
      if (!superAdminAuth.validateName(formData.name)) {
        throw new Error('Name must be at least 3 characters');
      }

      if (!superAdminAuth.validateEmail(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      const passwordValidation = superAdminAuth.validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.message);
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Call Super Admin Register API
      const response = await superAdminAuth.register(
        formData.name,
        formData.email,
        formData.password
      );

      if (response.success) {
        setRegisteredEmail(formData.email);
        setShowOTP(true);
        setSuccess('Registration successful! Please check your email for OTP.');
        setCooldown(60);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.otp || formData.otp.length !== 6) {
        throw new Error('Please enter a valid 6-digit OTP');
      }

      const response = await superAdminAuth.verifyOTP(registeredEmail, formData.otp);

      if (response.message?.includes('successfully')) {
        setSuccess('Account verified successfully! You can now login.');
        setShowOTP(false);
        navigate('/superadmin/login');
        // Clear form
        setFormData({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          otp: '',
          newPassword: '',
          confirmNewPassword: ''
        });
      }
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (cooldown > 0) {
      setError(`Please wait ${cooldown} seconds before resending OTP`);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let response;
      
      if (showResetPassword) {
        // For password reset, use forgot password endpoint to resend OTP
        response = await superAdminAuth.forgotPassword(resetEmail || formData.email);
      } else {
        // For registration, use resend OTP endpoint
        response = await superAdminAuth.resendOTP(registeredEmail);
      }
      
      if (response.message?.includes('successfully')) {
        setSuccess('OTP resent successfully! Check your email.');
        setCooldown(60);
      } else {
        throw new Error(response.message || 'Failed to resend OTP');
      }
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // ✅ UPDATED: handleLogin function with auth context
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!superAdminAuth.validateEmail(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      if (!formData.password) {
        throw new Error('Please enter your password');
      }

      // Call Super Admin Login API
      const response = await superAdminAuth.login(
        formData.email, 
        formData.password
      );

      console.log('Login response:', response);

      if (response.success) {
        // ✅ UPDATE AUTH CONTEXT - Mark super admin as authenticated
        loginSuperAdmin();
        
        // Call onAuthSuccess callback if provided
        if (onAuthSuccess) {
          onAuthSuccess(response.superAdmin);
        }
        
        // ✅ USE REPLACE to prevent back navigation to login page
        navigate('/superadmin/dashboard', { replace: true });
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!superAdminAuth.validateEmail(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      const response = await superAdminAuth.forgotPassword(formData.email);
      
      if (response.message?.includes('successfully')) {
        setResetEmail(formData.email);
        setResetStep('reset');
        setSuccess('OTP sent to your email. Please enter it along with your new password.');
        setCooldown(60);
      } else {
        throw new Error(response.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err.message || 'Failed to send reset instructions');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate OTP
      if (!formData.otp || formData.otp.length !== 6) {
        throw new Error('Please enter a valid 6-digit OTP');
      }

      // Validate password
      const passwordValidation = superAdminAuth.validatePassword(formData.newPassword);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.message);
      }

      if (formData.newPassword !== formData.confirmNewPassword) {
        throw new Error('New passwords do not match');
      }

      // Call reset password endpoint with OTP and new password together
      const response = await superAdminAuth.resetPassword(
        resetEmail,
        formData.otp,
        formData.newPassword,
        formData.confirmNewPassword
      );

      if (response.message?.includes('successful') || response.success) {
        setSuccess('Password reset successfully! You can now login with your new password.');
        setTimeout(() => {
          setShowResetPassword(false);
          setResetStep('email');
          setResetEmail('');
          navigate('/superadmin/login');
          // Clear form
          setFormData({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            otp: '',
            newPassword: '',
            confirmNewPassword: ''
          });
        }, 2000);
      } else {
        throw new Error(response.message || 'Password reset failed');
      }
    } catch (err) {
      setError(err.message || 'Password reset failed. Please check your OTP and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (showOTP) {
      await handleVerifyOTP(e);
    } else if (showResetPassword) {
      if (resetStep === 'email') {
        await handleSendOTP(e);
      } else {
        await handleResetPassword(e);
      }
    } else if (authMode === 'register') {
      await handleRegister(e);
    } else {
      await handleLogin(e);
    }
  };

  // Navigation handlers
  const handleLoginClick = () => {
    navigate('/superadmin/login');
  };

  const handleRegisterClick = () => {
    navigate('/superadmin/register');
  };

  // Trigger forgot password from login form
  const triggerForgotPassword = () => {
    setShowResetPassword(true);
    setResetStep('email');
    setError('');
    setSuccess('');
    // Keep the email from login form if it exists
    if (formData.email && superAdminAuth.validateEmail(formData.email)) {
      // Keep the email
    } else {
      setFormData(prev => ({ ...prev, email: '' }));
    }
  };

  // Render password requirements
  const renderPasswordRequirements = () => {
    const requirements = [
      { label: 'At least 8 characters', met: passwordStrength.hasMinLength },
      { label: 'Uppercase letter', met: passwordStrength.hasUpperCase },
      { label: 'Lowercase letter', met: passwordStrength.hasLowerCase },
      { label: 'Number', met: passwordStrength.hasNumber },
      { label: 'Special character (@$!%*?&)', met: passwordStrength.hasSpecialChar },
    ];

    return (
      <div className="mt-2 space-y-1">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center text-xs">
            {req.met ? (
              <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
            ) : (
              <AlertCircle className="w-3 h-3 text-gray-400 mr-2" />
            )}
            <span className={req.met ? 'text-green-500' : 'text-gray-400'}>
              {req.label}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // OTP Verification Screen (for registration only)
  if (showOTP && !showResetPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
          
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Verify Your Account</h1>
              <p className="text-slate-400 text-sm">Enter the 6-digit OTP sent to {registeredEmail}</p>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="mb-6 p-3 bg-green-900/30 border border-green-700 rounded-xl text-green-400 text-sm">
                {success}
              </div>
            )}
            
            {error && (
              <div className="mb-6 p-3 bg-red-900/30 border border-red-700 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  6-Digit OTP
                </label>
                <input
                  type="text"
                  name="otp"
                  value={formData.otp}
                  onChange={handleChange}
                  maxLength="6"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading || cooldown > 0}
                  className={`flex-1 py-3 ${
                    cooldown > 0 
                      ? 'bg-slate-700 text-slate-400' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } rounded-xl font-medium transition-all duration-300`}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Verifying...
                    </div>
                  ) : 'Verify OTP'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowOTP(false);
                    navigate('/superadmin/login');
                  }}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Back to Login
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Password Reset Screen (2-step flow)
  if (showResetPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
          
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {resetStep === 'email' ? 'Reset Password' : 'Enter New Password'}
              </h1>
              <p className="text-slate-400 text-sm">
                {resetStep === 'email' 
                  ? 'Enter your email to receive OTP' 
                  : `OTP sent to ${resetEmail}`}
              </p>
            </div>

            {/* Progress Indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  resetStep === 'email' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                }`}>
                  1
                </div>
                <div className={`w-16 h-1 ${resetStep === 'email' ? 'bg-slate-700' : 'bg-green-600'}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  resetStep === 'reset' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
                }`}>
                  2
                </div>
              </div>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="mb-6 p-3 bg-green-900/30 border border-green-700 rounded-xl text-green-400 text-sm">
                {success}
              </div>
            )}
            
            {error && (
              <div className="mb-6 p-3 bg-red-900/30 border border-red-700 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {resetStep === 'email' ? (
                // Step 1: Email Input
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="admin@platform.com"
                      required
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !formData.email}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Sending OTP...
                      </div>
                    ) : 'Send OTP'}
                  </button>
                </div>
              ) : (
                // Step 2: OTP + Password Fields
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={resetEmail}
                        className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-slate-300 cursor-not-allowed"
                        disabled
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      6-Digit OTP
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        name="otp"
                        value={formData.otp}
                        onChange={handleChange}
                        maxLength="6"
                        className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={cooldown > 0 || loading}
                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:bg-slate-700"
                      >
                        {cooldown > 0 ? `${cooldown}s` : 'Resend'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter new password"
                        required
                      />
                    </div>
                    {renderPasswordRequirements()}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="password"
                        name="confirmNewPassword"
                        value={formData.confirmNewPassword}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setResetStep('email');
                        setError('');
                        setSuccess('');
                      }}
                      className="flex-1 py-3 bg-slate-800 text-slate-300 rounded-xl font-medium hover:bg-slate-700 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-green-500/50 transition-all duration-300 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Resetting...
                        </div>
                      ) : 'Reset Password'}
                    </button>
                  </div>
                </>
              )}
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowResetPassword(false);
                  setResetStep('email');
                  setResetEmail('');
                  navigate('/superadmin/login');
                }}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Login/Register Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900/0 to-purple-900/20"></div>
      
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-xl opacity-30 animate-pulse"></div>
        
        <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Super Admin Portal</h1>
            <p className="text-slate-400">Secure platform management</p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-3 bg-green-900/30 border border-green-700 rounded-xl text-green-400 text-sm">
              {success}
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-3 bg-red-900/30 border border-red-700 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 mb-6 bg-slate-800/50 p-1 rounded-xl">
            <button
              onClick={handleLoginClick}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                authMode === 'login' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              onClick={handleRegisterClick}
              className={`flex-1 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                authMode === 'register' 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="admin@platform.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              {authMode === 'register' && renderPasswordRequirements()}
            </div>

            {authMode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}

            {authMode === 'login' && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-slate-400">
                  <input type="checkbox" className="mr-2 rounded" />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={triggerForgotPassword}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {authMode === 'login' ? 'Logging in...' : 'Registering...'}
                </div>
              ) : (
                authMode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            {authMode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  onClick={handleRegisterClick}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Register here
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={handleLoginClick}
                  className="text-blue-400 hover:text-blue-300"
                >
                  Login here
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;