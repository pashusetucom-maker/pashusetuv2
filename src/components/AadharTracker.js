import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import Header from './Header';

function AadharTracker() {
  const [aadharNumber, setAadharNumber] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all'); // all, 7days, 30days
  const [error, setError] = useState('');
  const [aadharList, setAadharList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({ key: 'totalTransactions', direction: 'desc' });
  const [filterType, setFilterType] = useState('all'); // all, suspicious, highFrequency, duplicates

  // Load all Aadhar cards on component mount
  useEffect(() => {
    loadAllAadharCards();
  }, []);

  const loadAllAadharCards = async () => {
    setListLoading(true);
    try {
      const receiptsRef = collection(db, 'receipts');
      const receiptsQuery = query(receiptsRef, orderBy('createdAt', 'desc'));
      const receiptsSnapshot = await getDocs(receiptsQuery);
      
      const receipts = receiptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Process all unique Aadhar cards
      const aadharMap = new Map();

      receipts.forEach(receipt => {
        const receiptDate = receipt.createdAt?.toDate ? receipt.createdAt.toDate() : new Date(receipt.date || receipt.createdAt);
        
        // Process Seller Aadhar
        if (receipt.sellerAadhar) {
          if (!aadharMap.has(receipt.sellerAadhar)) {
            aadharMap.set(receipt.sellerAadhar, {
              aadharNumber: receipt.sellerAadhar,
              name: receipt.sellerName,
              sellerTransactions: [],
              buyerTransactions: []
            });
          }
          aadharMap.get(receipt.sellerAadhar).sellerTransactions.push({
            ...receipt,
            date: receiptDate,
            role: 'Seller'
          });
        }

        // Process Buyer Aadhar
        if (receipt.buyerAadhar) {
          if (!aadharMap.has(receipt.buyerAadhar)) {
            aadharMap.set(receipt.buyerAadhar, {
              aadharNumber: receipt.buyerAadhar,
              name: receipt.buyerName,
              sellerTransactions: [],
              buyerTransactions: []
            });
          }
          aadharMap.get(receipt.buyerAadhar).buyerTransactions.push({
            ...receipt,
            date: receiptDate,
            role: 'Buyer'
          });
        }
      });

      // Calculate analytics for each Aadhar
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const aadharListData = Array.from(aadharMap.values()).map(aadhar => {
        const allTransactions = [...aadhar.sellerTransactions, ...aadhar.buyerTransactions];
        
        // Sort by date
        allTransactions.sort((a, b) => b.date - a.date);

        // Calculate metrics
        const last7Days = allTransactions.filter(t => t.date >= sevenDaysAgo);
        const last30Days = allTransactions.filter(t => t.date >= thirtyDaysAgo);

        const totalValueAsSeller = aadhar.sellerTransactions.reduce((sum, t) => 
          sum + (parseInt(t.animalPrice) || 0), 0);
        const totalValueAsBuyer = aadhar.buyerTransactions.reduce((sum, t) => 
          sum + (parseInt(t.animalPrice) || 0), 0);

        // Detect same-day duplicates
        const dateGroups = {};
        allTransactions.forEach(t => {
          const dateKey = t.date.toLocaleDateString('en-IN');
          if (!dateGroups[dateKey]) {
            dateGroups[dateKey] = [];
          }
          dateGroups[dateKey].push(t);
        });

        const duplicateDays = Object.entries(dateGroups)
          .filter(([date, transactions]) => transactions.length > 1)
          .map(([date, transactions]) => ({
            date,
            count: transactions.length,
            transactions
          }));

        // Get unique markets
        const markets = new Set(allTransactions.map(t => t.marketName));

        // Get last transaction date
        const lastTransaction = allTransactions.length > 0 ? allTransactions[0].date : null;

        return {
          aadharNumber: aadhar.aadharNumber,
          name: aadhar.name,
          totalTransactions: allTransactions.length,
          sellerCount: aadhar.sellerTransactions.length,
          buyerCount: aadhar.buyerTransactions.length,
          last7DaysCount: last7Days.length,
          last30DaysCount: last30Days.length,
          totalValue: totalValueAsSeller + totalValueAsBuyer,
          totalValueAsSeller,
          totalValueAsBuyer,
          duplicateDaysCount: duplicateDays.length,
          duplicateDays,
          hasSuspiciousActivity: duplicateDays.length > 0 || last7Days.length > 5,
          isHighFrequency: last7Days.length > 5,
          marketsCount: markets.size,
          markets: Array.from(markets),
          lastTransactionDate: lastTransaction,
          allTransactions
        };
      });

      // Filter out non-suspicious single transaction Aadhar cards
      // Only show if: totalTransactions > 1 OR hasSuspiciousActivity = true
      const filteredAadharList = aadharListData.filter(aadhar => {
        // Show if more than 1 transaction
        if (aadhar.totalTransactions > 1) return true;
        
        // Show if has suspicious activity (even with 1 transaction)
        if (aadhar.hasSuspiciousActivity) return true;
        
        // Hide single transaction non-suspicious cards
        return false;
      });

      // Sort by total transactions (descending)
      filteredAadharList.sort((a, b) => b.totalTransactions - a.totalTransactions);

      setAadharList(filteredAadharList);
    } catch (error) {
      console.error('Error loading Aadhar list:', error);
      setError('डेटा लोड करने में त्रुटि / Error loading data');
    } finally {
      setListLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedAndFilteredList = () => {
    let filtered = [...aadharList];

    // Apply filters
    switch (filterType) {
      case 'suspicious':
        filtered = filtered.filter(a => a.hasSuspiciousActivity);
        break;
      case 'highFrequency':
        filtered = filtered.filter(a => a.isHighFrequency);
        break;
      case 'duplicates':
        filtered = filtered.filter(a => a.duplicateDaysCount > 0);
        break;
      default:
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle date sorting
      if (sortConfig.key === 'lastTransactionDate') {
        aValue = aValue ? aValue.getTime() : 0;
        bValue = bValue ? bValue.getTime() : 0;
      }

      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const handleRowClick = (aadhar) => {
    setAadharNumber(aadhar.aadharNumber);
    // Simulate search with pre-loaded data
    const analytics = {
      totalTransactions: aadhar.totalTransactions,
      sellerCount: aadhar.sellerCount,
      buyerCount: aadhar.buyerCount,
      last7DaysCount: aadhar.last7DaysCount,
      last30DaysCount: aadhar.last30DaysCount,
      totalValueAsSeller: aadhar.totalValueAsSeller,
      totalValueAsBuyer: aadhar.totalValueAsBuyer,
      totalValue: aadhar.totalValue,
      duplicateDays: aadhar.duplicateDays,
      hasSuspiciousActivity: aadhar.hasSuspiciousActivity,
      animalTypes: {},
      markets: {}
    };

    // Calculate animal types and markets
    aadhar.allTransactions.forEach(t => {
      const type = t.animalType || 'Unknown';
      if (!analytics.animalTypes[type]) {
        analytics.animalTypes[type] = { count: 0, totalAnimals: 0 };
      }
      analytics.animalTypes[type].count++;
      analytics.animalTypes[type].totalAnimals += parseInt(t.animalCount) || 0;

      const market = t.marketName || 'Unknown';
      if (!analytics.markets[market]) {
        analytics.markets[market] = 0;
      }
      analytics.markets[market]++;
    });

    setSearchResults({
      transactions: aadhar.allTransactions,
      analytics: analytics
    });

    // Scroll to results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    // Validate Aadhar number
    if (!aadharNumber || aadharNumber.trim().length < 4) {
      setError('कृपया वैध आधार नंबर दर्ज करें / Please enter valid Aadhar number');
      return;
    }

    setLoading(true);
    setError('');
    setSearchResults(null);

    try {
      // Search in both seller and buyer fields
      const receiptsRef = collection(db, 'receipts');
      
      // Query for seller transactions
      const sellerQuery = query(
        receiptsRef,
        where('sellerAadhar', '==', aadharNumber.trim()),
        orderBy('createdAt', 'desc')
      );
      
      // Query for buyer transactions
      const buyerQuery = query(
        receiptsRef,
        where('buyerAadhar', '==', aadharNumber.trim()),
        orderBy('createdAt', 'desc')
      );

      const [sellerSnapshot, buyerSnapshot] = await Promise.all([
        getDocs(sellerQuery),
        getDocs(buyerQuery)
      ]);

      // Process seller transactions
      const sellerTransactions = sellerSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: 'Seller',
        roleHindi: 'विक्रेता'
      }));

      // Process buyer transactions
      const buyerTransactions = buyerSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        role: 'Buyer',
        roleHindi: 'क्रेता'
      }));

      // Combine and sort by date
      const allTransactions = [...sellerTransactions, ...buyerTransactions].sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.date || a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.date || b.createdAt);
        return dateB - dateA;
      });

      // Calculate analytics
      const analytics = calculateAnalytics(allTransactions, sellerTransactions, buyerTransactions);

      setSearchResults({
        transactions: allTransactions,
        analytics: analytics
      });

    } catch (error) {
      console.error('Search error:', error);
      setError('खोज में त्रुटि हुई। कृपया पुनः प्रयास करें। / Error in search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (allTransactions, sellerTransactions, buyerTransactions) => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter by time period
    const last7Days = allTransactions.filter(t => {
      const date = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.date || t.createdAt);
      return date >= sevenDaysAgo;
    });

    const last30Days = allTransactions.filter(t => {
      const date = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.date || t.createdAt);
      return date >= thirtyDaysAgo;
    });

    // Calculate total values
    const totalValueAsSeller = sellerTransactions.reduce((sum, t) => {
      return sum + (parseInt(t.animalPrice) || 0);
    }, 0);

    const totalValueAsBuyer = buyerTransactions.reduce((sum, t) => {
      return sum + (parseInt(t.animalPrice) || 0);
    }, 0);

    // Detect same-day duplicates
    const dateGroups = {};
    allTransactions.forEach(t => {
      const date = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.date || t.createdAt);
      const dateKey = date.toLocaleDateString('en-IN');
      if (!dateGroups[dateKey]) {
        dateGroups[dateKey] = [];
      }
      dateGroups[dateKey].push(t);
    });

    const duplicateDays = Object.entries(dateGroups)
      .filter(([date, transactions]) => transactions.length > 1)
      .map(([date, transactions]) => ({
        date,
        count: transactions.length,
        transactions
      }));

    // Animal type breakdown
    const animalTypes = {};
    allTransactions.forEach(t => {
      const type = t.animalType || 'Unknown';
      if (!animalTypes[type]) {
        animalTypes[type] = { count: 0, totalAnimals: 0 };
      }
      animalTypes[type].count++;
      animalTypes[type].totalAnimals += parseInt(t.animalCount) || 0;
    });

    // Market breakdown
    const markets = {};
    allTransactions.forEach(t => {
      const market = t.marketName || 'Unknown';
      if (!markets[market]) {
        markets[market] = 0;
      }
      markets[market]++;
    });

    return {
      totalTransactions: allTransactions.length,
      sellerCount: sellerTransactions.length,
      buyerCount: buyerTransactions.length,
      last7DaysCount: last7Days.length,
      last30DaysCount: last30Days.length,
      totalValueAsSeller,
      totalValueAsBuyer,
      totalValue: totalValueAsSeller + totalValueAsBuyer,
      duplicateDays,
      animalTypes,
      markets,
      hasSuspiciousActivity: duplicateDays.length > 0 || last7Days.length > 5
    };
  };

  const getFilteredTransactions = () => {
    if (!searchResults) return [];

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (timeFilter) {
      case '7days':
        return searchResults.transactions.filter(t => {
          const date = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.date || t.createdAt);
          return date >= sevenDaysAgo;
        });
      case '30days':
        return searchResults.transactions.filter(t => {
          const date = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.date || t.createdAt);
          return date >= thirtyDaysAgo;
        });
      default:
        return searchResults.transactions;
    }
  };

  const formatDate = (timestamp) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp) => {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div>
      <Header title="Aadhar Tracking System" />

      <div className="container">
        {/* Search Card - Compact */}
        <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
            {/* Title Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="#1e3c72" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="#1e3c72" strokeWidth="2" strokeLinecap="round"/>
                <path d="M11 8V14M8 11H14" stroke="#1e3c72" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div>
                <h2 style={{ color: '#1e3c72', margin: 0, fontSize: '20px', fontWeight: '600' }}>
                  Aadhar Transaction Tracker
                </h2>
                <p style={{ color: '#666', fontSize: '12px', margin: '2px 0 0 0' }}>
                  आधार लेनदेन खोज / Search Transactions
                </p>
              </div>
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: '1', maxWidth: '500px' }}>
              <input
                type="text"
                value={aadharNumber}
                onChange={(e) => setAadharNumber(e.target.value)}
                placeholder="Enter Aadhar number"
                style={{
                  flex: '1',
                  padding: '10px 14px',
                  fontSize: '14px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  outline: 'none',
                  minWidth: '200px'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1e3c72'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ 
                  padding: '10px 20px', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  fontSize: '14px'
                }}
              >
                {loading ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="4" strokeDasharray="31.4 31.4" strokeLinecap="round"/>
                    </svg>
                    Searching...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="11" cy="11" r="8" stroke="white" strokeWidth="2"/>
                      <path d="M21 21L16.65 16.65" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Search
                  </>
                )}
              </button>
            </form>
          </div>

          {error && (
            <div style={{
              marginTop: '15px',
              padding: '12px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '6px',
              color: '#c33',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#c33"/>
                <path d="M12 7V13M12 17H12.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* Pre-loaded Aadhar List - Excel Style Table */}
        {!searchResults && (
          <div className="card">
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
                <h2 style={{ color: '#1e3c72', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="16" rx="2" stroke="#1e3c72" strokeWidth="2"/>
                    <path d="M3 8H21M7 12H17M7 16H13" stroke="#1e3c72" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  All Aadhar Cards Analytics / सभी आधार कार्ड विश्लेषण
                </h2>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Filter Buttons */}
                  <button
                    onClick={() => setFilterType('all')}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '13px',
                      backgroundColor: filterType === 'all' ? '#1e3c72' : '#e0e0e0',
                      color: filterType === 'all' ? 'white' : '#333',
                      transition: 'all 0.2s'
                    }}
                  >
                    All ({aadharList.length})
                  </button>
                  <button
                    onClick={() => setFilterType('suspicious')}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '13px',
                      backgroundColor: filterType === 'suspicious' ? '#f44336' : '#e0e0e0',
                      color: filterType === 'suspicious' ? 'white' : '#333',
                      transition: 'all 0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L1 21H23L12 2Z" fill={filterType === 'suspicious' ? 'white' : '#f44336'}/>
                      <path d="M12 9V13" stroke={filterType === 'suspicious' ? '#f44336' : 'white'} strokeWidth="2" strokeLinecap="round"/>
                      <circle cx="12" cy="17" r="1" fill={filterType === 'suspicious' ? '#f44336' : 'white'}/>
                    </svg>
                    Suspicious ({aadharList.filter(a => a.hasSuspiciousActivity).length})
                  </button>
                  <button
                    onClick={() => setFilterType('highFrequency')}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '13px',
                      backgroundColor: filterType === 'highFrequency' ? '#ff9800' : '#e0e0e0',
                      color: filterType === 'highFrequency' ? 'white' : '#333',
                      transition: 'all 0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill={filterType === 'highFrequency' ? 'white' : '#ff9800'}/>
                    </svg>
                    High Freq ({aadharList.filter(a => a.isHighFrequency).length})
                  </button>
                  <button
                    onClick={() => setFilterType('duplicates')}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '13px',
                      backgroundColor: filterType === 'duplicates' ? '#9c27b0' : '#e0e0e0',
                      color: filterType === 'duplicates' ? 'white' : '#333',
                      transition: 'all 0.2s',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="3" width="18" height="18" rx="2" fill={filterType === 'duplicates' ? 'white' : '#9c27b0'}/>
                      <path d="M9 12H15M12 9V15" stroke={filterType === 'duplicates' ? '#9c27b0' : 'white'} strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Duplicates ({aadharList.filter(a => a.duplicateDaysCount > 0).length})
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '15px',
                marginBottom: '20px'
              }}>
                <div style={{
                  padding: '15px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold' }}>{aadharList.length}</div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Active Traders</div>
                  <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>(2+ transactions)</div>
                </div>
                <div style={{
                  padding: '15px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                    {aadharList.filter(a => a.hasSuspiciousActivity).length}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Suspicious Activity</div>
                  <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>(Needs review)</div>
                </div>
                <div style={{
                  padding: '15px',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                    {aadharList.reduce((sum, a) => sum + a.totalTransactions, 0)}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Total Transactions</div>
                  <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>(All active traders)</div>
                </div>
                <div style={{
                  padding: '15px',
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  color: 'white',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    ₹{(aadharList.reduce((sum, a) => sum + a.totalValue, 0) / 100000).toFixed(1)}L
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Total Value</div>
                  <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '4px' }}>(Active traders only)</div>
                </div>
              </div>
            </div>

            {listLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <img 
                    src="/logo.png" 
                    alt="Loading..." 
                    style={{ 
                      width: '60px', 
                      height: '60px',
                      animation: 'spin 2s linear infinite'
                    }} 
                  />
                </div>
                <p style={{ color: '#666', fontSize: '16px' }}>Loading Aadhar data...</p>
                <style>{`
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '13px',
                  backgroundColor: 'white'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#1e3c72', color: 'white' }}>
                      <th 
                        onClick={() => handleSort('name')}
                        style={{ 
                          padding: '12px 8px', 
                          textAlign: 'left', 
                          cursor: 'pointer',
                          userSelect: 'none',
                          position: 'sticky',
                          left: 0,
                          zIndex: 10
                        }}
                      >
                        Name / नाम {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        onClick={() => handleSort('aadharNumber')}
                        style={{ 
                          padding: '12px 8px', 
                          textAlign: 'left', 
                          cursor: 'pointer',
                          userSelect: 'none',
                          minWidth: '120px'
                        }}
                      >
                        Aadhar / आधार {sortConfig.key === 'aadharNumber' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        onClick={() => handleSort('totalTransactions')}
                        style={{ 
                          padding: '12px 8px', 
                          textAlign: 'center', 
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        Total {sortConfig.key === 'totalTransactions' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        onClick={() => handleSort('sellerCount')}
                        style={{ 
                          padding: '12px 8px', 
                          textAlign: 'center', 
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        Seller {sortConfig.key === 'sellerCount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        onClick={() => handleSort('buyerCount')}
                        style={{ 
                          padding: '12px 8px', 
                          textAlign: 'center', 
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        Buyer {sortConfig.key === 'buyerCount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        onClick={() => handleSort('last7DaysCount')}
                        style={{ 
                          padding: '12px 8px', 
                          textAlign: 'center', 
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        7 Days {sortConfig.key === 'last7DaysCount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        onClick={() => handleSort('last30DaysCount')}
                        style={{ 
                          padding: '12px 8px', 
                          textAlign: 'center', 
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        30 Days {sortConfig.key === 'last30DaysCount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        onClick={() => handleSort('duplicateDaysCount')}
                        style={{ 
                          padding: '12px 8px', 
                          textAlign: 'center', 
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        Duplicates {sortConfig.key === 'duplicateDaysCount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        onClick={() => handleSort('marketsCount')}
                        style={{ 
                          padding: '12px 8px', 
                          textAlign: 'center', 
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        Markets {sortConfig.key === 'marketsCount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        onClick={() => handleSort('totalValue')}
                        style={{ 
                          padding: '12px 8px', 
                          textAlign: 'right', 
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        Total Value {sortConfig.key === 'totalValue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th 
                        onClick={() => handleSort('lastTransactionDate')}
                        style={{ 
                          padding: '12px 8px', 
                          textAlign: 'center', 
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        Last Activity {sortConfig.key === 'lastTransactionDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th style={{ padding: '12px 8px', textAlign: 'center' }}>
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSortedAndFilteredList().map((aadhar, index) => (
                      <tr 
                        key={aadhar.aadharNumber}
                        onClick={() => handleRowClick(aadhar)}
                        style={{
                          backgroundColor: aadhar.hasSuspiciousActivity 
                            ? '#ffebee' 
                            : (index % 2 === 0 ? '#f9f9f9' : 'white'),
                          borderBottom: '1px solid #e0e0e0',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#e3f2fd';
                          e.currentTarget.style.transform = 'scale(1.01)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = aadhar.hasSuspiciousActivity 
                            ? '#ffebee' 
                            : (index % 2 === 0 ? '#f9f9f9' : 'white');
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <td style={{ 
                          padding: '12px 8px', 
                          fontWeight: '600',
                          position: 'sticky',
                          left: 0,
                          backgroundColor: 'inherit',
                          zIndex: 5
                        }}>
                          {aadhar.name}
                        </td>
                        <td style={{ padding: '12px 8px', fontFamily: 'monospace', fontSize: '12px' }}>
                          {aadhar.aadharNumber}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 'bold', color: '#1e3c72' }}>
                          {aadhar.totalTransactions}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '10px',
                            backgroundColor: '#e8f5e9',
                            color: '#2e7d32',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {aadhar.sellerCount}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '10px',
                            backgroundColor: '#e3f2fd',
                            color: '#1565c0',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            {aadhar.buyerCount}
                          </span>
                        </td>
                        <td style={{ 
                          padding: '12px 8px', 
                          textAlign: 'center',
                          fontWeight: aadhar.last7DaysCount > 5 ? 'bold' : 'normal',
                          color: aadhar.last7DaysCount > 5 ? '#d32f2f' : '#333'
                        }}>
                          {aadhar.last7DaysCount}
                          {aadhar.last7DaysCount > 5 && (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginLeft: '4px', verticalAlign: 'middle' }}>
                              <path d="M12 2L1 21H23L12 2Z" fill="#d32f2f"/>
                              <path d="M12 9V13" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                              <circle cx="12" cy="17" r="1" fill="white"/>
                            </svg>
                          )}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          {aadhar.last30DaysCount}
                        </td>
                        <td style={{ 
                          padding: '12px 8px', 
                          textAlign: 'center',
                          fontWeight: aadhar.duplicateDaysCount > 0 ? 'bold' : 'normal',
                          color: aadhar.duplicateDaysCount > 0 ? '#d32f2f' : '#333'
                        }}>
                          {aadhar.duplicateDaysCount > 0 ? (
                            <span style={{
                              padding: '3px 8px',
                              borderRadius: '10px',
                              backgroundColor: '#ffebee',
                              color: '#c62828',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              {aadhar.duplicateDaysCount}
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" fill="#c62828"/>
                                <path d="M12 7V13M12 17H12.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </span>
                          ) : (
                            <span style={{ color: '#4caf50', display: 'inline-flex', alignItems: 'center' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" fill="#4caf50"/>
                                <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          {aadhar.marketsCount}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: '600', color: '#1e3c72' }}>
                          ₹{(aadhar.totalValue / 1000).toFixed(1)}K
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', fontSize: '11px' }}>
                          {aadhar.lastTransactionDate 
                            ? aadhar.lastTransactionDate.toLocaleDateString('en-IN', { 
                                day: '2-digit', 
                                month: 'short' 
                              })
                            : 'N/A'}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                          {aadhar.hasSuspiciousActivity ? (
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '12px',
                              backgroundColor: '#f44336',
                              color: 'white',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L1 21H23L12 2Z" fill="white"/>
                                <path d="M12 9V13" stroke="#f44336" strokeWidth="2" strokeLinecap="round"/>
                                <circle cx="12" cy="17" r="1" fill="#f44336"/>
                              </svg>
                              Alert
                            </span>
                          ) : (
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '12px',
                              backgroundColor: '#4caf50',
                              color: 'white',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" fill="white"/>
                                <path d="M9 12L11 14L15 10" stroke="#4caf50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {getSortedAndFilteredList().length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" style={{ margin: '0 auto 10px' }}>
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                    <p>No Aadhar cards found matching the filter</p>
                  </div>
                )}
              </div>
            )}

            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '8px',
              fontSize: '13px',
              color: '#666',
              display: 'flex',
              gap: '10px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: '2px' }}>
                <circle cx="12" cy="12" r="10" fill="#2196f3"/>
                <path d="M12 16V12M12 8H12.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div>
                <strong>Note:</strong> Only showing Aadhar cards with 2+ transactions or suspicious activity. 
                Single transaction cards are hidden. Click any row to view detailed history. Use filters and column sorting for analysis.
                <br/>
                <strong>नोट:</strong> केवल 2+ लेनदेन या संदिग्ध गतिविधि वाले आधार कार्ड दिखाए जा रहे हैं। एकल लेनदेन कार्ड छिपे हुए हैं।
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {searchResults && (
          <>
            {/* Back Button */}
            <div style={{ marginBottom: '20px' }}>
              <button
                onClick={() => {
                  setSearchResults(null);
                  setAadharNumber('');
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ← Back to List / सूची पर वापस जाएं
              </button>
            </div>
            {/* Analytics Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              {/* Total Transactions */}
              <div className="card" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                textAlign: 'center',
                padding: '20px'
              }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {searchResults.analytics.totalTransactions}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  Total Transactions<br/>कुल लेनदेन
                </div>
              </div>

              {/* As Seller */}
              <div className="card" style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                textAlign: 'center',
                padding: '20px'
              }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {searchResults.analytics.sellerCount}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  As Seller<br/>विक्रेता के रूप में
                </div>
              </div>

              {/* As Buyer */}
              <div className="card" style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                textAlign: 'center',
                padding: '20px'
              }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {searchResults.analytics.buyerCount}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  As Buyer<br/>क्रेता के रूप में
                </div>
              </div>

              {/* Last 7 Days */}
              <div className="card" style={{
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                color: 'white',
                textAlign: 'center',
                padding: '20px'
              }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {searchResults.analytics.last7DaysCount}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  Last 7 Days<br/>पिछले 7 दिन
                </div>
              </div>

              {/* Last 30 Days */}
              <div className="card" style={{
                background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
                color: 'white',
                textAlign: 'center',
                padding: '20px'
              }}>
                <div style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {searchResults.analytics.last30DaysCount}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  Last 30 Days<br/>पिछले 30 दिन
                </div>
              </div>

              {/* Total Value */}
              <div className="card" style={{
                background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                color: '#333',
                textAlign: 'center',
                padding: '20px'
              }}>
                <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
                  ₹{(searchResults.analytics.totalValue / 1000).toFixed(1)}K
                </div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>
                  Total Value<br/>कुल मूल्य
                </div>
              </div>
            </div>

            {/* Suspicious Activity Alert */}
            {searchResults.analytics.hasSuspiciousActivity && (
              <div className="card" style={{
                backgroundColor: '#fff3cd',
                border: '2px solid #ffc107',
                marginBottom: '30px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#856404" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <div>
                    <h3 style={{ color: '#856404', marginBottom: '5px' }}>
                      Suspicious Activity Detected / संदिग्ध गतिविधि का पता चला
                    </h3>
                    <p style={{ color: '#856404', margin: 0, fontSize: '14px' }}>
                      {searchResults.analytics.duplicateDays.length > 0 && 
                        `Multiple transactions on same day detected (${searchResults.analytics.duplicateDays.length} days). `}
                      {searchResults.analytics.last7DaysCount > 5 && 
                        `High frequency: ${searchResults.analytics.last7DaysCount} transactions in last 7 days.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Duplicate Days Alert */}
            {searchResults.analytics.duplicateDays.length > 0 && (
              <div className="card" style={{ marginBottom: '30px' }}>
                <h3 style={{ color: '#d32f2f', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d32f2f" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Same Day Multiple Transactions / एक ही दिन में कई लेनदेन
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {searchResults.analytics.duplicateDays.map((day, index) => (
                    <div key={index} style={{
                      padding: '12px',
                      backgroundColor: '#ffebee',
                      border: '1px solid #ef5350',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontWeight: '600', color: '#c62828', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c62828" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {day.date}
                      </span>
                      <span style={{
                        backgroundColor: '#d32f2f',
                        color: 'white',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        {day.count} Transactions
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Breakdown Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
              marginBottom: '30px'
            }}>
              {/* Animal Type Breakdown */}
              <div className="card">
                <h3 style={{ color: '#1e3c72', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e3c72" strokeWidth="2">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                  Animal Type Breakdown / पशु प्रकार विवरण
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(searchResults.analytics.animalTypes).map(([type, data]) => (
                    <div key={type} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '10px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '6px'
                    }}>
                      <span style={{ fontWeight: '600' }}>{type}</span>
                      <span style={{ color: '#666' }}>
                        {data.count} transactions ({data.totalAnimals} animals)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Breakdown */}
              <div className="card">
                <h3 style={{ color: '#1e3c72', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e3c72" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                  Market Breakdown / बाजार विवरण
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(searchResults.analytics.markets).map(([market, count]) => (
                    <div key={market} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '10px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '6px'
                    }}>
                      <span style={{ fontWeight: '600' }}>{market}</span>
                      <span style={{
                        backgroundColor: '#1e3c72',
                        color: 'white',
                        padding: '2px 10px',
                        borderRadius: '10px',
                        fontSize: '13px'
                      }}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Value Breakdown */}
              <div className="card">
                <h3 style={{ color: '#1e3c72', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e3c72" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  Value Breakdown / मूल्य विवरण
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px',
                    backgroundColor: '#e8f5e9',
                    borderRadius: '6px'
                  }}>
                    <span style={{ fontWeight: '600' }}>As Seller / विक्रेता</span>
                    <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                      ₹{searchResults.analytics.totalValueAsSeller.toLocaleString()}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: '6px'
                  }}>
                    <span style={{ fontWeight: '600' }}>As Buyer / क्रेता</span>
                    <span style={{ color: '#1565c0', fontWeight: 'bold' }}>
                      ₹{searchResults.analytics.totalValueAsBuyer.toLocaleString()}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px',
                    backgroundColor: '#f3e5f5',
                    borderRadius: '6px',
                    borderTop: '2px solid #9c27b0'
                  }}>
                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>Total / कुल</span>
                    <span style={{ color: '#6a1b9a', fontWeight: 'bold', fontSize: '16px' }}>
                      ₹{searchResults.analytics.totalValue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Filter */}
            <div className="card" style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <h3 style={{ color: '#1e3c72', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e3c72" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6"/>
                    <line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                  Transaction Timeline / लेनदेन समयरेखा
                </h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setTimeFilter('all')}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      backgroundColor: timeFilter === 'all' ? '#1e3c72' : '#e0e0e0',
                      color: timeFilter === 'all' ? 'white' : '#333'
                    }}
                  >
                    All Time
                  </button>
                  <button
                    onClick={() => setTimeFilter('7days')}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      backgroundColor: timeFilter === '7days' ? '#1e3c72' : '#e0e0e0',
                      color: timeFilter === '7days' ? 'white' : '#333'
                    }}
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => setTimeFilter('30days')}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      backgroundColor: timeFilter === '30days' ? '#1e3c72' : '#e0e0e0',
                      color: timeFilter === '30days' ? 'white' : '#333'
                    }}
                  >
                    Last 30 Days
                  </button>
                </div>
              </div>
            </div>

            {/* Transaction List */}
            <div className="card">
              <h3 style={{ color: '#1e3c72', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1e3c72" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                Detailed Transactions ({getFilteredTransactions().length})
              </h3>
              
              {getFilteredTransactions().length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" style={{ margin: '0 auto 10px' }}>
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                  <p>No transactions found for selected time period</p>
                </div>
              ) : (
                <div style={{ 
                  overflowX: 'auto',
                  border: '1px solid #d0d0d0',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px',
                    minWidth: '800px',
                    backgroundColor: 'white'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#217346', color: 'white' }}>
                        <th style={{ 
                          padding: '14px 12px', 
                          textAlign: 'left',
                          fontWeight: '600',
                          fontSize: '13px',
                          borderRight: '1px solid rgba(255,255,255,0.2)',
                          whiteSpace: 'nowrap'
                        }}>
                          Date / Time<br/>
                          <span style={{ fontSize: '11px', fontWeight: '400', opacity: 0.9 }}>तारीख / समय</span>
                        </th>
                        <th style={{ 
                          padding: '14px 12px', 
                          textAlign: 'left',
                          fontWeight: '600',
                          fontSize: '13px',
                          borderRight: '1px solid rgba(255,255,255,0.2)',
                          whiteSpace: 'nowrap'
                        }}>
                          Receipt ID<br/>
                          <span style={{ fontSize: '11px', fontWeight: '400', opacity: 0.9 }}>रसीद आईडी</span>
                        </th>
                        <th style={{ 
                          padding: '14px 12px', 
                          textAlign: 'left',
                          fontWeight: '600',
                          fontSize: '13px',
                          borderRight: '1px solid rgba(255,255,255,0.2)',
                          whiteSpace: 'nowrap'
                        }}>
                          Role<br/>
                          <span style={{ fontSize: '11px', fontWeight: '400', opacity: 0.9 }}>भूमिका</span>
                        </th>
                        <th style={{ 
                          padding: '14px 12px', 
                          textAlign: 'left',
                          fontWeight: '600',
                          fontSize: '13px',
                          borderRight: '1px solid rgba(255,255,255,0.2)',
                          whiteSpace: 'nowrap'
                        }}>
                          Market<br/>
                          <span style={{ fontSize: '11px', fontWeight: '400', opacity: 0.9 }}>बाजार</span>
                        </th>
                        <th style={{ 
                          padding: '14px 12px', 
                          textAlign: 'left',
                          fontWeight: '600',
                          fontSize: '13px',
                          borderRight: '1px solid rgba(255,255,255,0.2)',
                          whiteSpace: 'nowrap'
                        }}>
                          Animal<br/>
                          <span style={{ fontSize: '11px', fontWeight: '400', opacity: 0.9 }}>पशु</span>
                        </th>
                        <th style={{ 
                          padding: '14px 12px', 
                          textAlign: 'center',
                          fontWeight: '600',
                          fontSize: '13px',
                          borderRight: '1px solid rgba(255,255,255,0.2)',
                          whiteSpace: 'nowrap'
                        }}>
                          Count<br/>
                          <span style={{ fontSize: '11px', fontWeight: '400', opacity: 0.9 }}>संख्या</span>
                        </th>
                        <th style={{ 
                          padding: '14px 12px', 
                          textAlign: 'right',
                          fontWeight: '600',
                          fontSize: '13px',
                          whiteSpace: 'nowrap'
                        }}>
                          Price<br/>
                          <span style={{ fontSize: '11px', fontWeight: '400', opacity: 0.9 }}>मूल्य</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredTransactions().map((transaction, index) => {
                        // Check if this is a duplicate day transaction
                        const transactionDate = transaction.createdAt?.toDate ? 
                          transaction.createdAt.toDate() : 
                          new Date(transaction.date || transaction.createdAt);
                        const dateKey = transactionDate.toLocaleDateString('en-IN');
                        const isDuplicate = searchResults.analytics.duplicateDays.some(d => d.date === dateKey);

                        return (
                          <tr key={transaction.id} style={{
                            backgroundColor: isDuplicate ? '#ffebee' : (index % 2 === 0 ? '#f8f9fa' : 'white'),
                            borderBottom: '1px solid #e0e0e0',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (!isDuplicate) {
                              e.currentTarget.style.backgroundColor = '#e8f4f8';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isDuplicate) {
                              e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#f8f9fa' : 'white';
                            }
                          }}>
                            <td style={{ 
                              padding: '12px', 
                              borderRight: '1px solid #e0e0e0',
                              whiteSpace: 'nowrap'
                            }}>
                              <div style={{ fontWeight: '600', color: '#333', fontSize: '13px' }}>
                                {formatDate(transaction.createdAt || transaction.date)}
                              </div>
                              <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                                {formatTime(transaction.createdAt || transaction.date)}
                              </div>
                            </td>
                            <td style={{ 
                              padding: '12px', 
                              fontFamily: 'monospace', 
                              fontWeight: '600',
                              fontSize: '12px',
                              color: '#1e3c72',
                              borderRight: '1px solid #e0e0e0'
                            }}>
                              {transaction.id}
                            </td>
                            <td style={{ 
                              padding: '12px',
                              borderRight: '1px solid #e0e0e0'
                            }}>
                              <span style={{
                                padding: '5px 12px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '600',
                                backgroundColor: transaction.role === 'Seller' ? '#d4edda' : '#cce5ff',
                                color: transaction.role === 'Seller' ? '#155724' : '#004085',
                                border: transaction.role === 'Seller' ? '1px solid #c3e6cb' : '1px solid #b8daff',
                                display: 'inline-block'
                              }}>
                                {transaction.role}
                              </span>
                            </td>
                            <td style={{ 
                              padding: '12px',
                              color: '#333',
                              fontSize: '13px',
                              borderRight: '1px solid #e0e0e0'
                            }}>
                              {transaction.marketName}
                            </td>
                            <td style={{ 
                              padding: '12px',
                              color: '#333',
                              fontSize: '13px',
                              borderRight: '1px solid #e0e0e0'
                            }}>
                              {transaction.animalType}
                            </td>
                            <td style={{ 
                              padding: '12px', 
                              textAlign: 'center', 
                              fontWeight: '600',
                              fontSize: '13px',
                              color: '#333',
                              borderRight: '1px solid #e0e0e0'
                            }}>
                              {transaction.animalCount}
                            </td>
                            <td style={{ 
                              padding: '12px', 
                              textAlign: 'right', 
                              fontWeight: '700',
                              fontSize: '14px',
                              color: '#217346'
                            }}>
                              ₹{parseInt(transaction.animalPrice || 0).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* No Results Message */}
        {searchResults && searchResults.transactions.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" style={{ margin: '0 auto 20px', display: 'block' }}>
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
              <line x1="11" y1="8" x2="11" y2="14"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
            <h2 style={{ color: '#666', marginBottom: '10px' }}>
              No Transactions Found
            </h2>
            <p style={{ color: '#999' }}>
              इस आधार नंबर के लिए कोई लेनदेन नहीं मिला<br/>
              No transactions found for this Aadhar number
            </p>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          table {
            font-size: 11px !important;
          }
          th, td {
            padding: 8px 4px !important;
          }
          th:first-child, td:first-child {
            position: static !important;
          }
        }
        
        /* Excel-like table styling */
        table {
          border: 1px solid #ddd;
        }
        
        table thead tr {
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        table tbody tr:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        
        /* Sticky header on scroll */
        table thead {
          position: sticky;
          top: 0;
          z-index: 100;
        }
      `}</style>
    </div>
  );
}

export default AadharTracker;
