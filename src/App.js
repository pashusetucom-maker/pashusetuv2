import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import MarketAdminDashboard from './components/MarketAdminDashboard';
import CreateReceipt from './components/CreateReceipt';
import ViewReceipts from './components/ViewReceipts';
import VerifyReceipt from './components/VerifyReceipt';
import VerifyReceiptInput from './components/VerifyReceiptInput';
import CreateMarket from './components/CreateMarket';
import CreateAdmin from './components/CreateAdmin';
import ManageAdmins from './components/ManageAdmins';
import MarketHoursSettings from './components/MarketHoursSettings';
import MarketDataAnalytics from './components/MarketDataAnalytics';
import AadharTracker from './components/AadharTracker';
import StateWiseAnalytics from './components/StateWiseAnalytics';
import InterStateAnalytics from './components/InterStateAnalytics';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

function PrivateRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" />;
  }
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <OfflineIndicator />
          <PWAInstallPrompt />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/verify" element={<VerifyReceiptInput />} />
            <Route path="/verify/:receiptId" element={<VerifyReceipt />} />
            
            <Route 
              path="/super-admin" 
              element={
                <PrivateRoute allowedRoles={['super-admin']}>
                  <SuperAdminDashboard />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/create-market" 
              element={
                <PrivateRoute allowedRoles={['super-admin']}>
                  <CreateMarket />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/create-admin" 
              element={
                <PrivateRoute allowedRoles={['super-admin']}>
                  <CreateAdmin />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/manage-admins" 
              element={
                <PrivateRoute allowedRoles={['super-admin']}>
                  <ManageAdmins />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/market-hours-settings" 
              element={
                <PrivateRoute allowedRoles={['super-admin']}>
                  <MarketHoursSettings />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/market-data-analytics" 
              element={
                <PrivateRoute allowedRoles={['super-admin']}>
                  <MarketDataAnalytics />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/aadhar-tracker" 
              element={
                <PrivateRoute allowedRoles={['super-admin']}>
                  <AadharTracker />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/state-wise-analytics" 
              element={
                <PrivateRoute allowedRoles={['super-admin']}>
                  <StateWiseAnalytics />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/inter-state-analytics" 
              element={
                <PrivateRoute allowedRoles={['super-admin']}>
                  <InterStateAnalytics />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/market-admin" 
              element={
                <PrivateRoute allowedRoles={['market-admin']}>
                  <MarketAdminDashboard />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/create-receipt" 
              element={
                <PrivateRoute allowedRoles={['market-admin']}>
                  <CreateReceipt />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/view-receipts" 
              element={
                <PrivateRoute allowedRoles={['market-admin', 'super-admin']}>
                  <ViewReceipts />
                </PrivateRoute>
              } 
            />
            
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
