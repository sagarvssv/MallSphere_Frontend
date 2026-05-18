import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

import StallOwnerLogin from './pages/seller/StallOwnerLogin';
import StallOwnerRegister from './pages/seller/StallOwnerRegister';
import StallOwnerDashboard from './pages/seller/StallOwnerDashboard';
import StallOwnerOtpVerification from './pages/seller/StallOwnerOtpVerification';
import StallOwnerForgotPassword from './pages/seller/StallOwnerForgotPassword';

import VendorLogin from './pages/vendor/VendorLogin';
import VendorRegister from './pages/vendor/VendorRegister';
import VendorOTPVerificationPage from './pages/vendor/VendorOTPVerificationPage';
import VendorForgotPassword from './pages/vendor/VendorForgotPassword';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorProfile from './pages/vendor/VendorProfile';

import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AuthModal from './components/superadmin/AuthModal';

import RoleSelector from './components/RoleSelector';

import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
          <Routes>
            {/* Public Route - Role Selector */}
            <Route path="/" element={<RoleSelector />} />

            {/* Seller/Stall Owner Routes */}
            <Route path="/stall-owner/login" element={
              <PublicRoute role="seller">
                <StallOwnerLogin />
              </PublicRoute>
            } />
            <Route path="/stall-owner/register" element={
              <PublicRoute role="seller">
                <StallOwnerRegister />
              </PublicRoute>
            } />
            <Route path="/stall-owner/verify-otp" element={<StallOwnerOtpVerification />} />
            <Route path="/stall-owner/forgot-password" element={<StallOwnerForgotPassword />} />
            <Route path="/stall-owner/dashboard" element={
              <ProtectedRoute role="seller">
                <StallOwnerDashboard />
              </ProtectedRoute>
            } />

            {/* Vendor Routes */}
            <Route path="/vendor/login" element={
              <PublicRoute role="vendor">
                <VendorLogin />
              </PublicRoute>
            } />
            <Route path="/vendor/register" element={
              <PublicRoute role="vendor">
                <VendorRegister />
              </PublicRoute>
            } />
            <Route path="/vendor/verify-otp" element={<VendorOTPVerificationPage />} />
            <Route path="/vendor/forgot-password" element={<VendorForgotPassword />} />
            <Route path="/vendor/dashboard" element={
              <ProtectedRoute role="vendor">
                <VendorDashboard />
              </ProtectedRoute>
            } />
            <Route path="/vendor/profile" element={
              <ProtectedRoute role="vendor">
                <VendorProfile />
              </ProtectedRoute>
            } />

            {/* Super Admin Routes */}
            <Route path="/superadmin/login" element={
              <PublicRoute role="superAdmin">
                <AuthModal />
              </PublicRoute>
            } />
            <Route path="/superadmin/register" element={
              <PublicRoute role="superAdmin">
                <AuthModal />
              </PublicRoute>
            } />
            <Route path="/superadmin/dashboard" element={
              <ProtectedRoute role="superAdmin">
                <SuperAdminDashboard />
              </ProtectedRoute>
            } />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;