import React, { useState, useEffect } from 'react';
import { Key, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import OTPInput from './OTPInput';

const OtpVerification = ({
  email,
  onVerify,
  onResend,
  onBack,
  isLoading,
  externalError = '',
  isResending = false,
  resendCooldown = 0,
  title,
  subtitle,
}) => {
  const [otp, setOtp] = useState('');
  const [localError, setLocalError] = useState('');

  // Parent owns all cooldown/timer state — this component just displays it
  const error = externalError || localError;

  // Clear local error whenever a new external error arrives
  useEffect(() => {
    if (externalError) setLocalError('');
  }, [externalError]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpComplete = (completeOtp) => {
    setOtp(completeOtp);
    setLocalError('');
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setLocalError('Please enter the 6-digit OTP');
      return;
    }
    try {
      await onVerify(email, otp);
    } catch (err) {
      if (err.message === 'expired') {
        setLocalError('OTP has expired. Please request a new one.');
      } else if (err.message === 'invalid') {
        setLocalError('Invalid OTP. Please check and try again.');
      } else {
        setLocalError(err.message || 'Verification failed. Please try again.');
      }
    }
  };

  const handleResend = async () => {
    setLocalError('');
    try {
      await onResend(email);
      setOtp('');
    } catch (err) {
      setLocalError(err.message || 'Failed to resend OTP');
    }
  };

  // Resend is only enabled when parent says cooldown is zero
  const canResend = resendCooldown === 0 && !isResending && !isLoading;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Key className="w-10 h-10 text-white" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          {title || 'Verify Your Email'}
        </h2>

        <p className="text-slate-600 mb-2">
          {subtitle || "We've sent a 6-digit OTP to:"}
        </p>
        <p className="text-lg font-semibold text-blue-600 mb-6">{email}</p>

        {/* Cooldown timer — only shown when active */}
        {resendCooldown > 0 && (
          <div className="flex items-center justify-center space-x-2 text-sm text-slate-500 mb-8">
            <Clock className="w-4 h-4" />
            <span>Resend available in:</span>
            <span
              className={`font-mono font-bold ${
                resendCooldown < 30 ? 'text-red-500' : 'text-green-500'
              }`}
            >
              {formatTime(resendCooldown)}
            </span>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* OTP input */}
      <OTPInput
        length={6}
        onComplete={handleOtpComplete}
        error={error}
        disabled={isLoading || isResending}
      />

      <p className="text-center text-sm text-slate-500 mt-4 mb-8">
        Can't see the OTP? Check your spam folder
      </p>

      {/* Verify button */}
      <button
        onClick={handleVerify}
        disabled={isLoading || otp.length !== 6 || isResending}
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold py-4 rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 mb-4"
      >
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Verifying...</span>
          </div>
        ) : (
          'Verify OTP'
        )}
      </button>

      {/* Resend button — fully controlled by parent cooldown */}
      <div className="text-center">
        {canResend ? (
          <button
            onClick={handleResend}
            disabled={isLoading || isResending}
            className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Resend OTP</span>
          </button>
        ) : (
          <p className="text-slate-500 text-sm">
            {isResending
              ? 'Sending new code...'
              : resendCooldown > 0
              ? `Resend available in ${formatTime(resendCooldown)}`
              : ''}
          </p>
        )}
      </div>

      {/* Back link */}
      <div className="mt-8 pt-6 border-t border-slate-200 text-center">
        <button
          onClick={onBack}
          className="text-slate-600 hover:text-slate-800 font-medium"
          disabled={isLoading || isResending}
        >
          ← Back to registration
        </button>
      </div>
    </div>
  );
};

export default OtpVerification;