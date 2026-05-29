import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getReceiptsByMarketId, getAllReceipts, deleteReceipt } from '../firebase/firestoreService';
import { calculateReceiptStatus } from '../utils/mockData';
import { INDIAN_STATES } from '../utils/indianStates';
import Header from './Header';

function ViewReceipts() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [filteredReceipts, setFilteredReceipts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [animalFilter, setAnimalFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date-desc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        let allReceipts;
        if (user.role === 'super-admin') {
          allReceipts = await getAllReceipts();
        } else {
          allReceipts = await getReceiptsByMarketId(user.marketId);
        }
        
        // Update status based on expiry
        const updatedReceipts = allReceipts.map(receipt => ({
          ...receipt,
          status: calculateReceiptStatus(receipt)
        }));
        
        setReceipts(updatedReceipts);
        setFilteredReceipts(updatedReceipts);
      } catch (error) {
        console.error('Error fetching receipts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [user]);

  useEffect(() => {
    let filtered = receipts;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(receipt =>
        receipt.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.sellerMobile.includes(searchTerm) ||
        receipt.buyerMobile.includes(searchTerm) ||
        receipt.sellerAadhar.replace(/\s/g, '').includes(searchTerm.replace(/\s/g, '')) ||
        receipt.buyerAadhar.replace(/\s/g, '').includes(searchTerm.replace(/\s/g, '')) ||
        receipt.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.sellerVillage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.buyerVillage.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(receipt => receipt.status === statusFilter);
    }

    // Filter by animal type
    if (animalFilter !== 'ALL') {
      filtered = filtered.filter(receipt => receipt.animalType === animalFilter);
    }

    // Filter by state
    if (stateFilter !== 'ALL') {
      filtered = filtered.filter(receipt => 
        receipt.sellerState === stateFilter || receipt.buyerState === stateFilter
      );
    }

    // Filter by date
    const today = new Date();
    if (dateFilter === 'TODAY') {
      filtered = filtered.filter(receipt => 
        new Date(receipt.date).toDateString() === today.toDateString()
      );
    } else if (dateFilter === 'WEEK') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(receipt => new Date(receipt.date) >= weekAgo);
    } else if (dateFilter === 'MONTH') {
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(receipt => new Date(receipt.date) >= monthAgo);
    }

    // Sort
    if (sortBy === 'date-desc') {
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sortBy === 'date-asc') {
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortBy === 'amount-desc') {
      filtered.sort((a, b) => parseInt(b.animalPrice) - parseInt(a.animalPrice));
    } else if (sortBy === 'amount-asc') {
      filtered.sort((a, b) => parseInt(a.animalPrice) - parseInt(b.animalPrice));
    }

    setFilteredReceipts(filtered);
  }, [searchTerm, statusFilter, animalFilter, dateFilter, stateFilter, sortBy, receipts]);

  const handleDeleteReceipt = async (receiptId) => {
    if (!window.confirm('क्या आप वाकई इस रसीद को हटाना चाहते हैं? / Are you sure you want to delete this receipt?')) {
      return;
    }

    try {
      await deleteReceipt(receiptId);
      // Remove from local state
      setReceipts(receipts.filter(r => r.id !== receiptId));
      alert('रसीद सफलतापूर्वक हटा दी गई / Receipt deleted successfully');
    } catch (error) {
      console.error('Error deleting receipt:', error);
      alert('रसीद हटाने में त्रुटि / Error deleting receipt: ' + error.message);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setAnimalFilter('ALL');
    setDateFilter('ALL');
    setStateFilter('ALL');
    setSortBy('date-desc');
  };

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
          <p style={{ color: '#1e3c72', fontSize: '16px', fontWeight: '600' }}>Loading receipts...</p>
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
      <Header title="View Receipts" />

      <div className="container">
        {/* Compact Filter Card */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '15px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          marginBottom: '20px'
        }}>
          {/* Header Row */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '15px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <h2 style={{ 
              color: '#1e3c72', 
              margin: 0, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '18px'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#1e3c72"/>
              </svg>
              Receipts ({filteredReceipts.length})
            </h2>
            <button 
              onClick={clearFilters} 
              style={{
                padding: '6px 12px',
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#666',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f5f5f5';
                e.target.style.borderColor = '#2196F3';
                e.target.style.color = '#2196F3';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
                e.target.style.borderColor = '#e0e0e0';
                e.target.style.color = '#666';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor"/>
              </svg>
              Clear
            </button>
          </div>
          
          {/* Search Bar - Compact */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ position: 'relative' }}>
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none'
                }}
              >
                <path d="M15.5 14H14.71L14.43 13.73C15.41 12.59 16 11.11 16 9.5C16 5.91 13.09 3 9.5 3C5.91 3 3 5.91 3 9.5C3 13.09 5.91 16 9.5 16C11.11 16 12.59 15.41 13.73 14.43L14 14.71V15.5L19 20.49L20.49 19L15.5 14ZM9.5 14C7.01 14 5 11.99 5 9.5C5 7.01 7.01 5 9.5 5C11.99 5 14 7.01 14 9.5C14 11.99 11.99 14 9.5 14Z" fill="#999"/>
              </svg>
              <input
                type="text"
                placeholder="Search ID, Name, Mobile, Aadhaar, Village, Vehicle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>
          </div>

          {/* Filters Row - Compact Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
            gap: '10px' 
          }}>
            {/* Status Filter */}
            <div>
              <label style={{ 
                fontSize: '11px', 
                fontWeight: '600', 
                color: '#666', 
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="#666"/>
                </svg>
                Status
              </label>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer',
                  background: 'white'
                }}
              >
                <option value="ALL">All</option>
                <option value="VALID">✓ Valid</option>
                <option value="EXPIRED">✗ Expired</option>
                <option value="SUSPICIOUS">⚠ Suspicious</option>
              </select>
            </div>
            
            {/* Animal Filter */}
            <div>
              <label style={{ 
                fontSize: '11px', 
                fontWeight: '600', 
                color: '#666', 
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 8C13.1 8 14 7.1 14 6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6C10 7.1 10.9 8 12 8ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10ZM12 16C10.9 16 10 16.9 10 18C10 19.1 10.9 20 12 20C13.1 20 14 19.1 14 18C14 16.9 13.1 16 12 16Z" fill="#666"/>
                </svg>
                Animal
              </label>
              <select 
                value={animalFilter} 
                onChange={(e) => setAnimalFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer',
                  background: 'white'
                }}
              >
                <option value="ALL">All</option>
                <option value="Cow">Cow</option>
                <option value="Bull">Bull</option>
                <option value="Buffalo">Buffalo</option>
                <option value="Goat">Goat</option>
                <option value="Sheep">Sheep</option>
              </select>
            </div>

            {/* State Filter */}
            <div>
              <label style={{ 
                fontSize: '11px', 
                fontWeight: '600', 
                color: '#666', 
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke="#666" strokeWidth="2"/>
                  <circle cx="12" cy="9" r="2.5" fill="#666"/>
                </svg>
                State
              </label>
              <select 
                value={stateFilter} 
                onChange={(e) => setStateFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer',
                  background: 'white'
                }}
              >
                <option value="ALL">All States</option>
                {INDIAN_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label style={{ 
                fontSize: '11px', 
                fontWeight: '600', 
                color: '#666', 
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20Z" fill="#666"/>
                </svg>
                Date
              </label>
              <select 
                value={dateFilter} 
                onChange={(e) => setDateFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer',
                  background: 'white'
                }}
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="WEEK">7 Days</option>
                <option value="MONTH">30 Days</option>
              </select>
            </div>

            {/* Sort Filter */}
            <div>
              <label style={{ 
                fontSize: '11px', 
                fontWeight: '600', 
                color: '#666', 
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 18H9V16H3V18ZM3 6V8H21V6H3ZM3 13H15V11H3V13Z" fill="#666"/>
                </svg>
                Sort
              </label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none',
                  cursor: 'pointer',
                  background: 'white'
                }}
              >
                <option value="date-desc">Newest</option>
                <option value="date-asc">Oldest</option>
                <option value="amount-desc">High ₹</option>
                <option value="amount-asc">Low ₹</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Card */}
        <div className="card" style={{ padding: '15px' }}>
          {filteredReceipts.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
              No receipts found
            </p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Receipt ID</th>
                    {user.role === 'super-admin' && <th>Market</th>}
                    <th>Seller Name</th>
                    <th>Mobile</th>
                    <th>Animal Type</th>
                    <th>Count</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.map(receipt => (
                    <tr key={receipt.id}>
                      <td><strong>{receipt.id}</strong></td>
                      {user.role === 'super-admin' && <td>{receipt.marketName}</td>}
                      <td>{receipt.sellerName}</td>
                      <td>{receipt.sellerMobile}</td>
                      <td>{receipt.animalType}</td>
                      <td>{receipt.animalCount}</td>
                      <td>{new Date(receipt.date).toLocaleDateString()}</td>
                      <td>{receipt.time}</td>
                      <td>₹{parseInt(receipt.animalPrice).toLocaleString()}</td>
                      <td>
                        <span className={`status-badge status-${receipt.status.toLowerCase()}`}>
                          {receipt.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <Link 
                            to={`/verify/${receipt.id}`}
                            className="btn btn-secondary"
                            style={{ padding: '6px 16px', fontSize: '13px', fontWeight: '600' }}
                          >
                            View
                          </Link>
                          {user.role === 'super-admin' && (
                            <button
                              onClick={() => handleDeleteReceipt(receipt.id)}
                              className="btn btn-danger"
                              style={{ 
                                padding: '6px 16px', 
                                fontSize: '13px', 
                                fontWeight: '600',
                                background: '#f44336',
                                border: 'none',
                                color: 'white',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {user.role === 'super-admin' && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '15px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            marginTop: '20px'
          }}>
            <h3 style={{ 
              color: '#1e3c72', 
              marginBottom: '15px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '16px',
              fontWeight: '700'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="#1e3c72"/>
                <path d="M7 12H9V17H7V12ZM11 7H13V17H11V7ZM15 14H17V17H15V14Z" fill="#1e3c72"/>
              </svg>
              Summary Statistics
            </h3>
            
            {/* Super Compact Statistics Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px'
            }}>
              {/* Total Receipts */}
              <div style={{
                background: 'white',
                border: '1px solid #E3F2FD',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20Z" fill="#2196F3"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: '10px', 
                    color: '#999', 
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '2px'
                  }}>Total</div>
                  <div style={{ 
                    fontSize: '22px', 
                    fontWeight: '700', 
                    color: '#2196F3',
                    lineHeight: 1
                  }}>{receipts.length}</div>
                </div>
              </div>

              {/* Valid Receipts */}
              <div style={{
                background: 'white',
                border: '1px solid #F1F8E9',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #F1F8E9, #DCEDC8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" fill="#4CAF50"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: '10px', 
                    color: '#999', 
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '2px'
                  }}>Valid</div>
                  <div style={{ 
                    fontSize: '22px', 
                    fontWeight: '700', 
                    color: '#4CAF50',
                    lineHeight: 1
                  }}>{receipts.filter(r => r.status === 'VALID').length}</div>
                </div>
              </div>

              {/* Expired Receipts */}
              <div style={{
                background: 'white',
                border: '1px solid #FFEBEE',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #FFEBEE, #FFCDD2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="#f44336"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: '10px', 
                    color: '#999', 
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '2px'
                  }}>Expired</div>
                  <div style={{ 
                    fontSize: '22px', 
                    fontWeight: '700', 
                    color: '#f44336',
                    lineHeight: 1
                  }}>{receipts.filter(r => r.status === 'EXPIRED').length}</div>
                </div>
              </div>

              {/* Total Value */}
              <div style={{
                background: 'white',
                border: '1px solid #FFF3E0',
                borderRadius: '10px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M11.8 10.9C9.53 10.31 8.8 9.7 8.8 8.75C8.8 7.66 9.81 6.9 11.5 6.9C13.28 6.9 13.94 7.75 14 9H16.21C16.14 7.28 15.09 5.7 13 5.19V3H10V5.16C8.06 5.58 6.5 6.84 6.5 8.77C6.5 11.08 8.41 12.23 11.2 12.9C13.7 13.5 14.2 14.38 14.2 15.31C14.2 16 13.71 17.1 11.5 17.1C9.44 17.1 8.63 16.18 8.52 15H6.32C6.44 17.19 8.08 18.42 10 18.83V21H13V18.85C14.95 18.48 16.5 17.35 16.5 15.3C16.5 12.46 14.07 11.49 11.8 10.9Z" fill="#FF9800"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: '10px', 
                    color: '#999', 
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '2px'
                  }}>Value</div>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: '700', 
                    color: '#FF9800',
                    lineHeight: 1
                  }}>₹{(receipts.reduce((sum, r) => sum + parseInt(r.animalPrice), 0) / 1000).toFixed(0)}K</div>
                </div>
              </div>
            </div>

            <style>{`
              @media (max-width: 480px) {
                .container > div:last-child > div:first-child {
                  gap: 8px !important;
                }
                .container > div:last-child > div:first-child > div {
                  padding: 10px !important;
                  gap: 8px !important;
                }
                .container > div:last-child > div:first-child > div > div:first-child {
                  width: 36px !important;
                  height: 36px !important;
                }
                .container > div:last-child > div:first-child > div > div:first-child svg {
                  width: 18px !important;
                  height: 18px !important;
                }
                .container > div:last-child > div:first-child > div > div:last-child > div:first-child {
                  font-size: 9px !important;
                }
                .container > div:last-child > div:first-child > div > div:last-child > div:last-child {
                  font-size: 20px !important;
                }
              }
            `}</style>
          </div>
        )}

      </div>
    </div>
  );
}

export default ViewReceipts;
