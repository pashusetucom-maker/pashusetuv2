import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getReceiptsByMarketId } from '../firebase/firestoreService';
import { calculateReceiptStatus } from '../utils/mockData';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Header from './Header';

function MarketAdminDashboard() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [marketStatus, setMarketStatus] = useState({
    isOpen: true,
    openTime: '08:00',
    closeTime: '16:00',
    loading: true
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (user && user.marketId) {
        try {
          const marketReceipts = await getReceiptsByMarketId(user.marketId);
          
          // Update receipts with calculated status
          const receiptsWithStatus = marketReceipts.map(receipt => ({
            ...receipt,
            status: calculateReceiptStatus(receipt)
          }));
          setReceipts(receiptsWithStatus);
        } catch (error) {
          console.error('Error fetching receipts:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    const checkMarketStatus = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'marketHours'));
        if (settingsDoc.exists()) {
          const settings = settingsDoc.data();
          const now = new Date();
          const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
          
          // Convert time strings to minutes for accurate comparison
          const timeToMinutes = (timeStr) => {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
          };
          
          const currentMinutes = timeToMinutes(currentTime);
          const openMinutes = timeToMinutes(settings.openTime);
          const closeMinutes = timeToMinutes(settings.closeTime);
          
          const isCurrentlyOpen = settings.isEnabled && 
                                 currentMinutes >= openMinutes && 
                                 currentMinutes <= closeMinutes;
          
          setMarketStatus({
            isOpen: isCurrentlyOpen,
            openTime: settings.openTime,
            closeTime: settings.closeTime,
            loading: false
          });
        } else {
          // Default settings
          const now = new Date();
          const currentHour = now.getHours();
          setMarketStatus({
            isOpen: currentHour >= 8 && currentHour < 16,
            openTime: '08:00',
            closeTime: '16:00',
            loading: false
          });
        }
      } catch (error) {
        console.error('Error checking market status:', error);
        setMarketStatus(prev => ({ ...prev, loading: false }));
      }
    };

    fetchData();
    checkMarketStatus();
    
    // Check market status every minute
    const statusInterval = setInterval(() => {
      checkMarketStatus();
    }, 60000);
    
    return () => {
      clearInterval(statusInterval);
    };
  }, [user]);

  // Convert 24-hour time to 12-hour format
  const convertTo12Hour = (time24) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const todayReceipts = receipts.filter(r => {
    const receiptDate = r.date?.toDate ? r.date.toDate() : new Date(r.date);
    return receiptDate.toDateString() === new Date().toDateString();
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '20px' }}>
            <img 
              src="/logo.png" 
              alt="Loading..." 
              style={{ 
                width: '80px', 
                height: '80px',
                animation: 'spin 2s linear infinite'
              }} 
            />
          </div>
          <p style={{ color: '#1e3c72', fontSize: '16px', fontWeight: '600' }}>Loading dashboard...</p>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Market Admin Dashboard" />

      <div className="container">
        {/* Stats Grid - Compact for Mobile */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          marginBottom: '20px'
        }}>
          {/* Today's Receipts */}
          <div style={{
            background: 'white',
            padding: '15px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            borderLeft: '4px solid #2196F3',
            transition: 'transform 0.2s'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20Z" fill="#2196F3"/>
                </svg>
                <h3 style={{ fontSize: '12px', color: '#666', margin: 0, fontWeight: '600' }}>Today</h3>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e3c72' }}>
                {todayReceipts.length}
              </div>
            </div>
          </div>

          {/* Total Receipts */}
          <div style={{
            background: 'white',
            padding: '15px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            borderLeft: '4px solid #4CAF50',
            transition: 'transform 0.2s'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#4CAF50"/>
                </svg>
                <h3 style={{ fontSize: '12px', color: '#666', margin: 0, fontWeight: '600' }}>Total</h3>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e3c72' }}>
                {receipts.length}
              </div>
            </div>
          </div>

          {/* Market Status */}
          <div style={{
            background: 'white',
            padding: '15px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            borderLeft: `4px solid ${marketStatus.isOpen ? '#4CAF50' : '#f44336'}`,
            transition: 'transform 0.2s'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill={marketStatus.isOpen ? "#4CAF50" : "#f44336"}/>
                  <path d="M12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z" fill={marketStatus.isOpen ? "#4CAF50" : "#f44336"}/>
                </svg>
                <h3 style={{ fontSize: '12px', color: '#666', margin: 0, fontWeight: '600' }}>Status</h3>
              </div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: marketStatus.isOpen ? '#4CAF50' : '#f44336'
              }}>
                {marketStatus.isOpen ? 'Open' : 'Closed'}
              </div>
            </div>
          </div>

          {/* Admin ID */}
          <div style={{
            background: 'white',
            padding: '15px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            borderLeft: '4px solid #FF9800',
            transition: 'transform 0.2s'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="#FF9800"/>
                </svg>
                <h3 style={{ fontSize: '12px', color: '#666', margin: 0, fontWeight: '600' }}>Admin ID</h3>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e3c72', letterSpacing: '0.5px' }}>
                {user.adminId || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '20px', color: '#1e3c72', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 3C13 2.45 12.55 2 12 2C11.45 2 11 2.45 11 3V4.08C8.61 4.57 7 6.47 7 8.5C7 10.95 9.05 13 11.5 13H12.5C13.33 13 14 13.67 14 14.5C14 15.33 13.33 16 12.5 16H10C9.45 16 9 16.45 9 17C9 17.55 9.45 18 10 18H11V19C11 19.55 11.45 20 12 20C12.55 20 13 19.55 13 19V17.92C15.39 17.43 17 15.53 17 13.5C17 11.05 14.95 9 12.5 9H11.5C10.67 9 10 8.33 10 7.5C10 6.67 10.67 6 11.5 6H14C14.55 6 15 5.55 15 5C15 4.45 14.55 4 14 4H13V3Z" fill="#1e3c72"/>
            </svg>
            Quick Actions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            {marketStatus.isOpen ? (
              <Link to="/create-receipt" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="white"/>
                </svg>
                Create New Receipt
              </Link>
            ) : (
              <button className="btn btn-primary" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                Create New Receipt (Market Closed)
              </button>
            )}
            <Link to="/view-receipts" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5C17 19.5 21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C14.76 7 17 9.24 17 12C17 14.76 14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9Z" fill="white"/>
              </svg>
              View All Receipts
            </Link>
          </div>

          {/* Market Status Info */}
          {!marketStatus.loading && (
            <div style={{
              background: marketStatus.isOpen 
                ? 'rgba(232, 245, 233, 0.5)' 
                : 'rgba(255, 235, 238, 0.5)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginTop: '15px',
              border: `1px solid ${marketStatus.isOpen ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {/* Status Icon */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill={marketStatus.isOpen ? '#4CAF50' : '#f44336'}/>
                <path d="M12 6V12L16 14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              
              {/* Status Text */}
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: '700', 
                  color: marketStatus.isOpen ? '#2e7d32' : '#c62828',
                  marginBottom: '2px'
                }}>
                  Market {marketStatus.isOpen ? 'OPEN' : 'CLOSED'} / बाजार {marketStatus.isOpen ? 'खुला' : 'बंद'}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: '#666', 
                  fontWeight: '500'
                }}>
                  Operating Hours: {convertTo12Hour(marketStatus.openTime)} - {convertTo12Hour(marketStatus.closeTime)}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '20px', color: '#1e3c72' }}>Today's Receipts</h2>
          {todayReceipts.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              No receipts created today
            </p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Receipt ID</th>
                    <th>Seller Name</th>
                    <th>Animal Type</th>
                    <th>Count</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayReceipts.map(receipt => (
                    <tr key={receipt.id}>
                      <td>{receipt.id}</td>
                      <td>{receipt.sellerName}</td>
                      <td>{receipt.animalType}</td>
                      <td>{receipt.animalCount}</td>
                      <td>{receipt.time}</td>
                      <td>
                        <span className={`status-badge status-${receipt.status.toLowerCase()}`}>
                          {receipt.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '20px', color: '#1e3c72' }}>Recent Receipts</h2>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Receipt ID</th>
                  <th>Seller Name</th>
                  <th>Animal Type</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {receipts.slice(0, 10).map(receipt => (
                  <tr key={receipt.id}>
                    <td>{receipt.id}</td>
                    <td>{receipt.sellerName}</td>
                    <td>{receipt.animalType}</td>
                    <td>{new Date(receipt.date).toLocaleDateString()}</td>
                    <td>₹{receipt.animalPrice.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge status-${receipt.status.toLowerCase()}`}>
                        {receipt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketAdminDashboard;
