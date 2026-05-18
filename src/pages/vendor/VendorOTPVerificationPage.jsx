import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthLayout from '../../components/AuthLayout';
import OtpVerification from '../../components/auth/OtpVerification';
import { vendorApi } from '../../hooks/vendorApi';
import { CheckCircle } from 'lucide-react';

// Helper to safely read pending verification data from localStorage
const getPendingVerification = () => {
  const raw = localStorage.getItem('pendingVendorVerification');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('Corrupted pendingVendorVerification data:', raw);
    localStorage.removeItem('pendingVendorVerification');
    return null;
  }
};

const VendorOTPVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [vendorLicenseNumber, setVendorLicenseNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [fromLogin, setFromLogin] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); // Optional: display error in UI

  useEffect(() => {
    // Get data from navigation state or localStorage
    if (location.state) {
      setEmail(location.state.email || '');
      setVendorLicenseNumber(location.state.vendorLicenseNumber || '');
      setFromLogin(location.state.fromLogin || false);
    } else {
      const pending = getPendingVerification();
      if (pending) {
        setEmail(pending.email || '');
        setVendorLicenseNumber(pending.vendorLicenseNumber || '');
        setFromLogin(pending.fromLogin || false);
      } else {
        // No verification data found – redirect to appropriate page
        if (fromLogin) {
          navigate('/vendor/login');
        } else {
          navigate('/vendor/register');
        }
      }
    }
  }, [location.state, navigate, fromLogin]);

  const handleVerify = async (email, otp) => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      console.log('Verifying OTP for vendor:', { email, vendorLicenseNumber });
      
      const response = await vendorApi.verifyOtp(email, otp, vendorLicenseNumber);
      console.log('OTP verification response:', response);
      
      setVerificationSuccess(true);
      
      // Mark as verified in pending data before removing
      const pending = getPendingVerification();
      if (pending) {
        const updated = { ...pending, verified: true, verifiedAt: new Date().toISOString() };
        localStorage.setItem('pendingVendorVerification', JSON.stringify(updated));
      }
      
      // Store tokens / user data if provided
      if (response.accessToken) {
        localStorage.setItem('vendorAccessToken', response.accessToken);
      }
      if (response.user || response.vendor) {
        localStorage.setItem('vendorData', JSON.stringify(response.user || response.vendor));
      }
      
      localStorage.setItem('vendorEmailVerified', 'true');
      localStorage.setItem('vendorVerifiedEmail', email);
      localStorage.setItem('vendorVerificationTime', new Date().toISOString());
      
      // Show success for 2 seconds, then redirect
      setTimeout(() => {
        localStorage.removeItem('pendingVendorVerification');
        navigate('/vendor/login', {
          state: {
            message: 'Email verified successfully! You can now login to your account.',
            verifiedEmail: email,
            verified: true,
            fromVerification: true
          }
        });
      }, 2000);
      
    } catch (error) {
      console.error('OTP verification failed:', error);
      setErrorMessage(error.message || 'Verification failed. Please try again.');
      throw error; // Re-throw so OtpVerification component can show the error
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async (email) => {
    setErrorMessage('');
    try {
      console.log('Resending OTP to:', email);
      await vendorApi.resendOtp(email, vendorLicenseNumber);
      // Show success message (you can replace with toast)
      alert('New OTP has been sent to your email. Please check your inbox.');
    } catch (error) {
      console.error('Resend OTP failed:', error);
      alert(error.message || 'Failed to resend OTP. Please try again later.');
      throw error;
    }
  };

  const handleBack = () => {
    if (!fromLogin) {
      localStorage.removeItem('pendingVendorVerification');
      navigate('/vendor/register');
    } else {
      navigate('/vendor/login');
    }
  };

  return (
    <AuthLayout type="verify" role="vendor" backLink={fromLogin ? "/vendor/login" : "/vendor/register"}>
      {verificationSuccess ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Verification Successful!
          </h2>
          <p className="text-slate-600 mb-6">
            Your email has been verified. Redirecting to login page...
          </p>
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : (
        <>
          <OtpVerification
            email={email}
            onVerify={handleVerify}
            onResend={handleResend}
            onBack={handleBack}
            isLoading={isLoading}
            errorMessage={errorMessage} // Pass down to display
            title="Verify Vendor Account"
            subtitle={fromLogin ? 
              "Please verify your email to access your vendor account. We've sent a 6-digit OTP to:" :
              "We've sent a 6-digit OTP to verify your vendor account"}
          />
          
          {fromLogin && (
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-800">
                    <strong>Important:</strong> You need to verify your email before you can login to your vendor dashboard. 
                    If you didn't receive the OTP, check your spam folder or click "Resend OTP".
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Check your spam folder if you don't see the OTP email. 
              The OTP is valid for 10 minutes. After verification, you'll be redirected to login.
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VendorOTPVerificationPage;