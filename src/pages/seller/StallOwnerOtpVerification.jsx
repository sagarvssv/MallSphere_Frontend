import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import OtpVerification from '../../components/auth/OtpVerification';
import { sellerApi } from '../../hooks/sellerApi';
import { CheckCircle, AlertCircle } from 'lucide-react';

const COOLDOWN_STORAGE_KEY = 'otpResendTimestamp';
const COOLDOWN_DURATION = 120; // seconds — must match your backend's rate-limit window

const StallOwnerOtpVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [otpExpired, setOtpExpired] = useState(false);
  const [fromLogin, setFromLogin] = useState(false);

  // Prevent double-initialisation in React StrictMode
  const initialised = useRef(false);

  // ─── Restore persisted cooldown on mount ───────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem(COOLDOWN_STORAGE_KEY);
    if (stored) {
      const elapsed = Math.floor((Date.now() - Number(stored)) / 1000);
      const remaining = COOLDOWN_DURATION - elapsed;
      if (remaining > 0) setResendCooldown(remaining);
    }
  }, []);

  // ─── Initialise from navigation state / localStorage ──────────────────────
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;

    if (location.state?.email) {
      setEmail(location.state.email);
      setFromLogin(location.state.fromLogin || false);
      return;
    }

    const raw = localStorage.getItem('pendingStallOwnerVerification');
    if (!raw) {
      navigate('/stall-owner/register');
      return;
    }

    try {
      const data = JSON.parse(raw);
      if (!data.email) {
        navigate('/stall-owner/register');
        return;
      }

      setEmail(data.email);
      setFromLogin(data.fromLogin || false);

      if (data.timestamp) {
        const expiryTime = new Date(data.timestamp).getTime() + 10 * 60 * 1000;
        if (Date.now() > expiryTime) {
          setOtpExpired(true);
          setError('Your verification code has expired. Please request a new one.');
        }
      }
    } catch {
      navigate('/stall-owner/register');
    }
  }, []); // intentionally empty — runs once on mount

  // ─── Cooldown tick ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleVerify = async (emailArg, otp) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await sellerApi.verifyOtp(emailArg, otp);
      console.log('OTP verification response:', response);

      setVerificationSuccess(true);

      const pendingData = localStorage.getItem('pendingStallOwnerVerification');
      if (pendingData) {
        const data = JSON.parse(pendingData);
        data.verified = true;
        data.verifiedAt = new Date().toISOString();
        localStorage.setItem('pendingStallOwnerVerification', JSON.stringify(data));
      }

      localStorage.setItem('stallOwnerEmailVerified', 'true');
      localStorage.setItem('stallOwnerVerifiedEmail', emailArg);
      localStorage.setItem('stallOwnerVerificationTime', new Date().toISOString());

      setTimeout(() => {
        localStorage.removeItem('pendingStallOwnerVerification');
        localStorage.removeItem(COOLDOWN_STORAGE_KEY);

        navigate('/stall-owner/login', {
          state: {
            message: 'Email verified successfully! You can now login to your stall owner account.',
            verifiedEmail: emailArg,
            verified: true,
            fromVerification: true,
          },
        });
      }, 2000);
    } catch (err) {
      console.error('OTP verification failed:', err);

      if (err.message?.includes('expired')) {
        setError('Your verification code has expired. Please request a new one.');
        setOtpExpired(true);
        throw new Error('expired');
      } else if (err.message?.includes('invalid')) {
        setError('Invalid verification code. Please check and try again.');
        throw new Error('invalid');
      } else {
        setError(err.message || 'OTP verification failed. Please try again.');
        throw err;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async (emailArg) => {
    // Guard: never fire if cooldown is still active
    if (resendCooldown > 0) return;

    setIsResending(true);
    setError('');

    try {
      await sellerApi.resendOtp(emailArg);

      // Reset expired state
      setOtpExpired(false);

      // Start cooldown and persist the timestamp so it survives navigation
      localStorage.setItem(COOLDOWN_STORAGE_KEY, String(Date.now()));
      setResendCooldown(COOLDOWN_DURATION);

      // Refresh the pending verification timestamp
      localStorage.setItem(
        'pendingStallOwnerVerification',
        JSON.stringify({
          email: emailArg,
          timestamp: new Date().toISOString(),
          fromLogin,
        })
      );

      alert('A new verification code has been sent to your email address. Please check your inbox.');
    } catch (err) {
      console.error('Resend OTP failed:', err);

      if (err.message?.includes('cooldown') || err.message?.includes('Too many')) {
        // Backend enforced — sync our local cooldown too
        localStorage.setItem(COOLDOWN_STORAGE_KEY, String(Date.now()));
        setResendCooldown(COOLDOWN_DURATION);
        setError('Please wait before requesting another code.');
      } else {
        setError(err.message || 'Failed to resend verification code. Please try again.');
      }
      throw err;
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    if (!fromLogin) {
      localStorage.removeItem('pendingStallOwnerVerification');
      navigate('/stall-owner/register');
    } else {
      navigate('/stall-owner/login');
    }
  };

  // ─── Expired OTP screen ────────────────────────────────────────────────────
  if (otpExpired) {
    return (
      <AuthLayout
        type="verify"
        role="stall-owner"
        backLink={fromLogin ? '/stall-owner/login' : '/stall-owner/register'}
        title="Stall Owner Verification"
      >
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Verification Code Expired
            </h2>
            <p className="text-slate-600 mb-6">
              Your verification code has expired. Please request a new one to continue.
            </p>

            <button
              onClick={() => handleResend(email)}
              disabled={isResending || resendCooldown > 0}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Sending...
                </span>
              ) : resendCooldown > 0 ? (
                `Resend available in ${resendCooldown}s`
              ) : (
                'Request New Code'
              )}
            </button>

            <button
              onClick={handleBack}
              className="mt-4 text-sm text-slate-600 hover:text-slate-900"
            >
              ← Back to {fromLogin ? 'Login' : 'Registration'}
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // ─── Main screen ───────────────────────────────────────────────────────────
  return (
    <AuthLayout
      type="verify"
      role="stall-owner"
      backLink={fromLogin ? '/stall-owner/login' : '/stall-owner/register'}
      title="Stall Owner Verification"
    >
      {verificationSuccess ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Verification Successful!
          </h2>
          <p className="text-slate-600 mb-6">
            Your email has been verified successfully. Redirecting you to the login page...
          </p>
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : (
        <>
          {error && !otpExpired && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          <OtpVerification
            email={email}
            onVerify={handleVerify}
            onResend={handleResend}
            onBack={handleBack}
            isLoading={isLoading}
            isResending={isResending}
            resendCooldown={resendCooldown}
            title="Verify Your Stall Owner Account"
            subtitle={
              fromLogin
                ? "Please verify your email to access your stall owner account. We've sent a 6-digit verification code to:"
                : `We've sent a 6-digit verification code to ${email || 'your email'}`
            }
          />

          {fromLogin && (
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <p className="ml-3 text-sm text-amber-800">
                  <strong>Important:</strong> You need to verify your email before you can
                  login to your stall owner dashboard. If you didn't receive the code,
                  check your spam folder or click "Resend OTP".
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex">
              <svg
                className="h-5 w-5 text-blue-500 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="ml-3 text-sm text-blue-800">
                <strong>Note:</strong> The verification code will expire in 10 minutes.
                Please check your spam or junk folder if you don't see the email.
              </p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Having trouble? Contact support at{' '}
              <a href="mailto:support@mallspere.com" className="text-blue-600 hover:underline">
                support@mallspere.com
              </a>
            </p>
          </div>
        </>
      )}
    </AuthLayout>
  );
};

export default StallOwnerOtpVerification;