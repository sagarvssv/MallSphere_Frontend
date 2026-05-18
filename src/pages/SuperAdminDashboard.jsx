// pages/SuperAdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import AuthModal from '../components/superadmin/AuthModal';
import Sidebar from '../components/superadmin/Sidebar';
import Header from '../components/superadmin/Header';
import DashboardTab from '../components/superadmintabs/DashboardTab';
import ApplicationsTab from '../components/superadmintabs/ApplicationsTab';
import SubscriptionsTab from '../components/superadmintabs/SubscriptionsTab';
import LicensesTab from '../components/superadmintabs/LicensesTab';
import UsersTab from '../components/superadmintabs/UsersTab';
import AnalyticsTab from '../components/superadmintabs/AnalyticsTab';
import SettingsTab from '../components/superadmintabs/SettingsTab';
import { superAdminAuth } from '../hooks/superAdminAuth';
import { useAuth } from '../context/AuthContext';

const SuperAdminDashboard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { logoutSuperAdmin } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notifications, setNotifications] = useState(3);
  const [currentSuperAdmin, setCurrentSuperAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data
  const [dashboardData, setDashboardData] = useState({
    totalMalls: 1247,
    totalShops: 8932,
    activeUsers: 45823,
    revenue: 2847293,
    monthlyGrowth: 18.5,
    pendingApprovals: 23
  });

  const [mallApplications, setMallApplications] = useState([
    { id: 1, name: 'Phoenix City Mall', owner: 'John Smith', location: 'New York, NY', date: '2026-01-18', status: 'pending', shops: 120, revenue: 450000 },
    { id: 2, name: 'Sunset Plaza', owner: 'Sarah Johnson', location: 'Los Angeles, CA', date: '2026-01-19', status: 'pending', shops: 85, revenue: 320000 },
    { id: 3, name: 'Harbor View Center', owner: 'Michael Chen', location: 'San Francisco, CA', date: '2026-01-20', status: 'pending', shops: 95, revenue: 380000 }
  ]);

  // SIMPLIFIED: Check authentication on component mount - NO PROFILE CHECK
useEffect(() => {
  const checkAuthentication = async () => {
    try {
      // Check localStorage for auth data
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      const superAdminData = localStorage.getItem('superAdminData');
      
      console.log('Initial auth check from localStorage:', {
        isAuthenticated,
        hasSuperAdminData: !!superAdminData,
        superAdminData: superAdminData ? JSON.parse(superAdminData) : null
      });
      
      if (isAuthenticated && superAdminData) {
        setIsAuthenticated(true);
        setCurrentSuperAdmin(JSON.parse(superAdminData));
        setShowAuthModal(false);
        console.log('Auto-logged in from localStorage');
      } else {
        setShowAuthModal(true);
        console.log('No auth found in localStorage, showing login modal');
      }
    } catch (error) {
      console.log('Auth check error:', error);
      setShowAuthModal(true);
    } finally {
      setLoading(false);
    }
  };

  checkAuthentication();
}, []);

// Handle login from AuthModal
const handleLogin = async (email, password) => {
  try {
    console.log('Attempting login for:', email);
    const response = await superAdminAuth.login(email, password);
    
    console.log('Login response:', response);
    
    if (response.success && response.superAdmin) {
      setIsAuthenticated(true);
      setCurrentSuperAdmin(response.superAdmin);
      setShowAuthModal(false);
      
      // Store auth data in localStorage
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('superAdminData', JSON.stringify(response.superAdmin));
      
      console.log('Login successful, stored in localStorage');
      return { success: true, data: response.superAdmin };
    } else {
      console.log('Login failed - no success or superAdmin data');
      return { 
        success: false, 
        message: response.message || 'Login failed. Please check credentials.' 
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { 
      success: false, 
      message: error.message || 'Login failed. Please try again.' 
    };
  }
};
  // Handle registration from AuthModal
  const handleRegistration = async (name, email, password) => {
    try {
      console.log('Attempting registration:', { name, email });
      const response = await superAdminAuth.register(name, email, password);
      
      console.log('Registration response:', response);
      
      if (response.success) {
        // Store the email for OTP verification
        localStorage.setItem('pendingSuperAdminEmail', email);
        
        return { 
          success: true, 
          message: response.message || 'Registration successful! Please check your email for OTP.',
          superAdmin: response.superAdmin 
        };
      } else {
        return { 
          success: false, 
          message: response.message || 'Registration failed. Please try again.' 
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific error cases
      let userMessage = error.message || 'Registration failed. Please try again.';
      
      if (error.message.includes('500') || error.message.includes('Server Error')) {
        userMessage = 'Server error. Please try again later or contact support.';
      } else if (error.message.includes('Network error')) {
        userMessage = 'Network error. Please check your internet connection.';
      }
      
      return { success: false, message: userMessage };
    }
  };

  // Handle OTP verification from AuthModal
  const handleVerifyOTP = async (email, otp) => {
    try {
      console.log('Verifying OTP for:', email);
      const response = await superAdminAuth.verifyOTP(email, otp);
      
      console.log('OTP verification response:', response);
      
      if (response.message?.includes('successfully')) {
        // Clear pending email after successful verification
        localStorage.removeItem('pendingSuperAdminEmail');
        
        return { 
          success: true, 
          message: response.message || 'Account verified successfully!' 
        };
      } else {
        return { 
          success: false, 
          message: response.message || 'OTP verification failed. Please try again.' 
        };
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      return { 
        success: false, 
        message: error.message || 'OTP verification failed. Please try again.' 
      };
    }
  };

  // Handle logout function
  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      await superAdminAuth.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear all super admin local data
      ['superAdminAuth', 'superAdminAuthenticated', 'superAdminId', 
      'superAdminData', 'pendingSuperAdminEmail', 'isAuthenticated']
        .forEach(key => localStorage.removeItem(key));

      logoutSuperAdmin(); // ✅ updates superAdminAuth state in context

      setIsAuthenticated(false);
      setCurrentSuperAdmin(null);
      setShowAuthModal(true);
      setAuthMode('login');
      console.log('Logged out successfully');
    }
  };

  // Handle vendor approval (only after login)
  const handleApproval = async (vendorId, status, reason = '') => {
    try {
      if (status === 'approved') {
        const response = await superAdminAuth.approveVendor(vendorId);
        if (response.success) {
          // Update local state
          setMallApplications(prev => prev.map(app => 
            app.id === vendorId ? { ...app, status: 'approved' } : app
          ));
          
          // Update dashboard pending count
          setDashboardData(prev => ({
            ...prev,
            pendingApprovals: Math.max(0, prev.pendingApprovals - 1)
          }));
          
          return { success: true, message: response.message };
        }
      } else if (status === 'rejected') {
        const response = await superAdminAuth.rejectVendor(vendorId, reason);
        if (response.success) {
          // Update local state
          setMallApplications(prev => prev.map(app => 
            app.id === vendorId ? { ...app, status: 'rejected' } : app
          ));
          
          // Update dashboard pending count
          setDashboardData(prev => ({
            ...prev,
            pendingApprovals: Math.max(0, prev.pendingApprovals - 1)
          }));
          
          return { success: true, message: response.message };
        }
      }
      
      return { success: false, message: 'Action failed' };
    } catch (error) {
      console.error('Approval error:', error);
      
      // Handle token expiration
      if (error.message.includes('Session expired') || error.message.includes('401')) {
        // Force logout
        await handleLogout();
        return { 
          success: false, 
          message: 'Session expired. Please login again.',
          sessionExpired: true 
        };
      }
      
      return { 
        success: false, 
        message: error.message || 'Action failed. Please try again.' 
      };
    }
  };

  // Handle forgot password from AuthModal
  const handleForgotPassword = async (email) => {
    try {
      console.log('Forgot password request for:', email);
      const response = await superAdminAuth.forgotPassword(email);
      
      console.log('Forgot password response:', response);
      
      if (response.message?.includes('successfully')) {
        // Store email for OTP verification
        localStorage.setItem('resetPasswordEmail', email);
        
        return { 
          success: true, 
          message: response.message || 'Reset instructions sent to your email.' 
        };
      } else {
        return { 
          success: false, 
          message: response.message || 'Failed to send reset instructions.' 
        };
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to process request. Please try again.' 
      };
    }
  };

  // Handle password reset with OTP from AuthModal
  const handleResetPassword = async (email, otp, newPassword, confirmPassword) => {
    try {
      console.log('Resetting password for:', email);
      const response = await superAdminAuth.resetPassword(email, otp, newPassword, confirmPassword);
      
      console.log('Reset password response:', response);
      
      if (response.message?.includes('successful')) {
        // Clear stored email after successful reset
        localStorage.removeItem('resetPasswordEmail');
        
        return { 
          success: true, 
          message: response.message || 'Password reset successfully!' 
        };
      } else {
        return { 
          success: false, 
          message: response.message || 'Password reset failed.' 
        };
      }
    } catch (error) {
      console.error('Reset password error:', error);
      return { 
        success: false, 
        message: error.message || 'Password reset failed. Please try again.' 
      };
    }
  };

  // Handle change password from Settings tab (only after login)
  const handleChangePassword = async (oldPassword, newPassword, confirmPassword) => {
    try {
      console.log('Changing password...');
      const response = await superAdminAuth.changePassword(oldPassword, newPassword, confirmPassword);
      
      console.log('Change password response:', response);
      
      if (response.message?.includes('successfully')) {
        return { 
          success: true, 
          message: response.message || 'Password changed successfully!' 
        };
      } else {
        return { 
          success: false, 
          message: response.message || 'Failed to change password.' 
        };
      }
    } catch (error) {
      console.error('Change password error:', error);
      
      // Handle token expiration
      if (error.message.includes('Session expired') || error.message.includes('401')) {
        // Force logout
        await handleLogout();
        return { 
          success: false, 
          message: 'Session expired. Please login again.',
          sessionExpired: true 
        };
      }
      
      return { 
        success: false, 
        message: error.message || 'Failed to change password. Please try again.' 
      };
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-gray-300 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show auth modal if not authenticated
  if (!isAuthenticated || showAuthModal) {
    return (
      <AuthModal 
        authMode={authMode}
        setAuthMode={setAuthMode}
        handleLogin={handleLogin}
        handleRegistration={handleRegistration}
        handleVerifyOTP={handleVerifyOTP}
        handleForgotPassword={handleForgotPassword}
        handleResetPassword={handleResetPassword}
        currentSuperAdmin={currentSuperAdmin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
        currentSuperAdmin={currentSuperAdmin}
      />

      <main className={`transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
        <Header 
          activeTab={activeTab} 
          notifications={notifications}
          currentSuperAdmin={currentSuperAdmin}
        />
        
        <div className="p-6">
          {activeTab === 'dashboard' && (
            <DashboardTab 
              dashboardData={dashboardData}
              currentSuperAdmin={currentSuperAdmin}
            />
          )}

          {activeTab === 'applications' && (
            <ApplicationsTab
              mallApplications={mallApplications}
              handleApproval={handleApproval}
              pendingApprovals={dashboardData.pendingApprovals}
            />
          )}

          {activeTab === 'subscriptions' && (
            <SubscriptionsTab />
          )}

          {activeTab === 'licenses' && (
            <LicensesTab />
          )}

          {activeTab === 'users' && (
            <UsersTab />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsTab />
          )}

          {activeTab === 'settings' && (
            <SettingsTab 
              currentSuperAdmin={currentSuperAdmin}
              handleChangePassword={handleChangePassword}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;