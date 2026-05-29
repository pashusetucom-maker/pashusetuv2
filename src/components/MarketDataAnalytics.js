import React, { useState, useEffect } from 'react';
import { getAllMarkets, getAllReceipts } from '../firebase/firestoreService';
import Header from './Header';

function MarketDataAnalytics() {
  const [markets, setMarkets] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState('ALL');
  const [dateRange, setDateRange] = useState('ALL');
  const [viewMode, setViewMode] = useState('SUMMARY'); // SUMMARY, LAST7, LAST30, QUARTER, YEAR

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [marketsData, receiptsData] = await Promise.all([
        getAllMarkets(),
        getAllReceipts()
      ]);
      setMarkets(marketsData);
      setReceipts(receiptsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter receipts based on selection
  const getFilteredReceipts = () => {
    let filtered = receipts;

    // Filter by market
    if (selectedMarket !== 'ALL') {
      filtered = filtered.filter(r => r.marketId === selectedMarket);
    }

    // Filter by date range
    const today = new Date();
    if (dateRange === 'TODAY') {
      filtered = filtered.filter(r => {
        const receiptDate = r.date?.toDate ? r.date.toDate() : new Date(r.date);
        return receiptDate.toDateString() === today.toDateString();
      });
    } else if (dateRange === 'WEEK') {
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(r => {
        const receiptDate = r.date?.toDate ? r.date.toDate() : new Date(r.date);
        return receiptDate >= weekAgo;
      });
    } else if (dateRange === 'MONTH') {
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(r => {
        const receiptDate = r.date?.toDate ? r.date.toDate() : new Date(r.date);
        return receiptDate >= monthAgo;
      });
    }

    return filtered;
  };

  const filteredReceipts = getFilteredReceipts();

  // Calculate analytics
  const analytics = {
    totalReceipts: filteredReceipts.length,
    totalValue: filteredReceipts.reduce((sum, r) => sum + parseInt(r.animalPrice || 0), 0),
    totalAnimals: filteredReceipts.reduce((sum, r) => sum + parseInt(r.animalCount || 0), 0),
    avgPrice: filteredReceipts.length > 0 
      ? Math.round(filteredReceipts.reduce((sum, r) => sum + parseInt(r.animalPrice || 0), 0) / filteredReceipts.length)
      : 0
  };

  // Animal type breakdown
  const animalBreakdown = filteredReceipts.reduce((acc, r) => {
    const type = r.animalType || 'Unknown';
    if (!acc[type]) {
      acc[type] = { count: 0, value: 0, animals: 0 };
    }
    acc[type].count += 1;
    acc[type].value += parseInt(r.animalPrice || 0);
    acc[type].animals += parseInt(r.animalCount || 0);
    return acc;
  }, {});

  // Market-wise breakdown
  const marketBreakdown = filteredReceipts.reduce((acc, r) => {
    const marketId = r.marketId || 'Unknown';
    const marketName = r.marketName || 'Unknown Market';
    if (!acc[marketId]) {
      acc[marketId] = { name: marketName, count: 0, value: 0, animals: 0 };
    }
    acc[marketId].count += 1;
    acc[marketId].value += parseInt(r.animalPrice || 0);
    acc[marketId].animals += parseInt(r.animalCount || 0);
    return acc;
  }, {});

  // Last 7 Days breakdown
  const getLast7DaysData = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const dayReceipts = filteredReceipts.filter(r => {
        const receiptDate = r.date?.toDate ? r.date.toDate() : new Date(r.date);
        return receiptDate.toDateString() === dateStr;
      });
      days.push({
        label: date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
        count: dayReceipts.length,
        value: dayReceipts.reduce((sum, r) => sum + parseInt(r.animalPrice || 0), 0),
        animals: dayReceipts.reduce((sum, r) => sum + parseInt(r.animalCount || 0), 0)
      });
    }
    return days;
  };

  // Last 30 Days breakdown
  const getLast30DaysData = () => {
    const days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const dayReceipts = filteredReceipts.filter(r => {
        const receiptDate = r.date?.toDate ? r.date.toDate() : new Date(r.date);
        return receiptDate.toDateString() === dateStr;
      });
      days.push({
        label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        count: dayReceipts.length,
        value: dayReceipts.reduce((sum, r) => sum + parseInt(r.animalPrice || 0), 0),
        animals: dayReceipts.reduce((sum, r) => sum + parseInt(r.animalCount || 0), 0)
      });
    }
    return days;
  };

  // Quarter-wise breakdown
  const getQuarterWiseData = () => {
    const quarters = [];
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const currentQuarter = Math.floor(currentMonth / 3);
    
    // Get last 4 quarters
    for (let i = 3; i >= 0; i--) {
      let quarter = currentQuarter - i;
      let year = currentYear;
      
      if (quarter < 0) {
        quarter += 4;
        year -= 1;
      }
      
      const startMonth = quarter * 3;
      const endMonth = startMonth + 2;
      
      const quarterReceipts = filteredReceipts.filter(r => {
        const receiptDate = r.date?.toDate ? r.date.toDate() : new Date(r.date);
        const receiptYear = receiptDate.getFullYear();
        const receiptMonth = receiptDate.getMonth();
        return receiptYear === year && receiptMonth >= startMonth && receiptMonth <= endMonth;
      });
      
      const quarterNames = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];
      
      quarters.push({
        label: `${quarterNames[quarter]} ${year}`,
        count: quarterReceipts.length,
        value: quarterReceipts.reduce((sum, r) => sum + parseInt(r.animalPrice || 0), 0),
        animals: quarterReceipts.reduce((sum, r) => sum + parseInt(r.animalCount || 0), 0)
      });
    }
    
    return quarters;
  };

  // Year-wise breakdown
  const getYearWiseData = () => {
    const years = [];
    const currentYear = new Date().getFullYear();
    
    // Get last 5 years
    for (let i = 4; i >= 0; i--) {
      const year = currentYear - i;
      
      const yearReceipts = filteredReceipts.filter(r => {
        const receiptDate = r.date?.toDate ? r.date.toDate() : new Date(r.date);
        return receiptDate.getFullYear() === year;
      });
      
      years.push({
        label: `Year ${year}`,
        count: yearReceipts.length,
        value: yearReceipts.reduce((sum, r) => sum + parseInt(r.animalPrice || 0), 0),
        animals: yearReceipts.reduce((sum, r) => sum + parseInt(r.animalCount || 0), 0)
      });
    }
    
    return years;
  };

  const last7DaysData = getLast7DaysData();
  const last30DaysData = getLast30DaysData();
  const quarterWiseData = getQuarterWiseData();
  const yearWiseData = getYearWiseData();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%)' }}>
        <div style={{ textAlign: 'center' }}>
          <img 
            src="/logo.png" 
            alt="Loading..." 
            style={{ width: '80px', height: '80px', animation: 'spin 2s linear infinite' }} 
          />
          <p style={{ color: '#1e3c72', fontSize: '16px', fontWeight: '600', marginTop: '20px' }}>Loading analytics...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Market Data Analytics" />

      <div className="container">
        {/* Filters */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '15px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '6px' }}>
                📍 Select Market
              </label>
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Markets</option>
                {markets.map(market => (
                  <option key={market.id} value={market.id}>{market.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '6px' }}>
                📅 Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="WEEK">Last 7 Days</option>
                <option value="MONTH">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '2px solid #E3F2FD'
          }}>
            <div style={{ fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '6px' }}>📊 TOTAL RECEIPTS</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#2196F3' }}>{analytics.totalReceipts}</div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '2px solid #F1F8E9'
          }}>
            <div style={{ fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '6px' }}>🐄 TOTAL ANIMALS</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#4CAF50' }}>{analytics.totalAnimals}</div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '2px solid #FFF3E0'
          }}>
            <div style={{ fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '6px' }}>💰 TOTAL VALUE</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#FF9800' }}>₹{(analytics.totalValue / 1000).toFixed(0)}K</div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '2px solid #FFEBEE'
          }}>
            <div style={{ fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '6px' }}>📈 AVG PRICE</div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#f44336' }}>₹{(analytics.avgPrice / 1000).toFixed(1)}K</div>
          </div>
        </div>

        {/* Animal Type Breakdown */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1e3c72', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="#1e3c72"/>
              <path d="M7 12H9V17H7V12ZM11 7H13V17H11V7ZM15 14H17V17H15V14Z" fill="#1e3c72"/>
            </svg>
            Animal Type Analysis
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#666' }}>Animal Type</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#666' }}>Receipts</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#666' }}>Animals</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#666' }}>Total Value</th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#666' }}>Avg Price</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(animalBreakdown).map(([type, data]) => (
                  <tr key={type} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px', fontWeight: '600', color: '#333' }}>{type}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#2196F3', fontWeight: '600' }}>{data.count}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#4CAF50', fontWeight: '600' }}>{data.animals}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#FF9800', fontWeight: '600' }}>₹{data.value.toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#f44336', fontWeight: '600' }}>₹{Math.round(data.value / data.count).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Market-wise Breakdown */}
        {selectedMarket === 'ALL' && (
          <div className="card" style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#1e3c72', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 7V3H2V21H22V7H12ZM6 19H4V17H6V19ZM6 15H4V13H6V15ZM6 11H4V9H6V11ZM6 7H4V5H6V7ZM10 19H8V17H10V19ZM10 15H8V13H10V15ZM10 11H8V9H10V11ZM10 7H8V5H10V7ZM20 19H12V17H14V15H12V13H14V11H12V9H20V19ZM18 11H16V13H18V11ZM18 15H16V17H18V15Z" fill="#1e3c72"/>
              </svg>
              Market-wise Performance
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#666' }}>Market Name</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#666' }}>Receipts</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#666' }}>Animals</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#666' }}>Total Value</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#666' }}>Avg Price</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(marketBreakdown).map(([id, data]) => (
                    <tr key={id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#333' }}>{data.name}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#2196F3', fontWeight: '600' }}>{data.count}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#4CAF50', fontWeight: '600' }}>{data.animals}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#FF9800', fontWeight: '600' }}>₹{data.value.toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#f44336', fontWeight: '600' }}>₹{Math.round(data.value / data.count).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Time Period Analysis */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, color: '#1e3c72', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.5 18.49L9.5 12.48L13.5 16.48L22 6.92L20.59 5.51L13.5 13.48L9.5 9.48L2 16.99L3.5 18.49Z" fill="#1e3c72"/>
              </svg>
              Time Period Analysis
            </h3>
            
            {/* View Mode Tabs */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setViewMode('LAST7')}
                style={{
                  padding: '8px 14px',
                  background: viewMode === 'LAST7' ? 'linear-gradient(135deg, #2196F3, #1976D2)' : '#f5f5f5',
                  color: viewMode === 'LAST7' ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setViewMode('LAST30')}
                style={{
                  padding: '8px 14px',
                  background: viewMode === 'LAST30' ? 'linear-gradient(135deg, #4CAF50, #388E3C)' : '#f5f5f5',
                  color: viewMode === 'LAST30' ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setViewMode('QUARTER')}
                style={{
                  padding: '8px 14px',
                  background: viewMode === 'QUARTER' ? 'linear-gradient(135deg, #FF9800, #F57C00)' : '#f5f5f5',
                  color: viewMode === 'QUARTER' ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Quarter-wise
              </button>
              <button
                onClick={() => setViewMode('YEAR')}
                style={{
                  padding: '8px 14px',
                  background: viewMode === 'YEAR' ? 'linear-gradient(135deg, #9C27B0, #7B1FA2)' : '#f5f5f5',
                  color: viewMode === 'YEAR' ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Year-wise
              </button>
            </div>
          </div>

          {/* Last 7 Days View */}
          {viewMode === 'LAST7' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#E3F2FD' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#1976D2' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#1976D2' }}>Receipts</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#1976D2' }}>Animals</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#1976D2' }}>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {last7DaysData.map((day, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#333' }}>{day.label}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#2196F3', fontWeight: '600' }}>{day.count}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#4CAF50', fontWeight: '600' }}>{day.animals}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#FF9800', fontWeight: '600' }}>₹{day.value.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f5f5f5', fontWeight: '700' }}>
                    <td style={{ padding: '12px', color: '#1e3c72' }}>Total</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#2196F3' }}>{last7DaysData.reduce((sum, d) => sum + d.count, 0)}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#4CAF50' }}>{last7DaysData.reduce((sum, d) => sum + d.animals, 0)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#FF9800' }}>₹{last7DaysData.reduce((sum, d) => sum + d.value, 0).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Last 30 Days View */}
          {viewMode === 'LAST30' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F1F8E9' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#388E3C' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#388E3C' }}>Receipts</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#388E3C' }}>Animals</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#388E3C' }}>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {last30DaysData.map((day, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#333' }}>{day.label}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#2196F3', fontWeight: '600' }}>{day.count}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#4CAF50', fontWeight: '600' }}>{day.animals}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#FF9800', fontWeight: '600' }}>₹{day.value.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f5f5f5', fontWeight: '700' }}>
                    <td style={{ padding: '12px', color: '#1e3c72' }}>Total</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#2196F3' }}>{last30DaysData.reduce((sum, d) => sum + d.count, 0)}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#4CAF50' }}>{last30DaysData.reduce((sum, d) => sum + d.animals, 0)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#FF9800' }}>₹{last30DaysData.reduce((sum, d) => sum + d.value, 0).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Quarter-wise View */}
          {viewMode === 'QUARTER' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#FFF3E0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#F57C00' }}>Quarter</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#F57C00' }}>Receipts</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#F57C00' }}>Animals</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#F57C00' }}>Total Value</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#F57C00' }}>Avg/Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {quarterWiseData.map((quarter, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#333' }}>{quarter.label}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#2196F3', fontWeight: '600' }}>{quarter.count}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#4CAF50', fontWeight: '600' }}>{quarter.animals}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#FF9800', fontWeight: '600' }}>₹{quarter.value.toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#f44336', fontWeight: '600' }}>
                        ₹{quarter.count > 0 ? Math.round(quarter.value / quarter.count).toLocaleString() : 0}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f5f5f5', fontWeight: '700' }}>
                    <td style={{ padding: '12px', color: '#1e3c72' }}>Total</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#2196F3' }}>{quarterWiseData.reduce((sum, q) => sum + q.count, 0)}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#4CAF50' }}>{quarterWiseData.reduce((sum, q) => sum + q.animals, 0)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#FF9800' }}>₹{quarterWiseData.reduce((sum, q) => sum + q.value, 0).toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#f44336' }}>-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Year-wise View */}
          {viewMode === 'YEAR' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F3E5F5' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#7B1FA2' }}>Year</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#7B1FA2' }}>Receipts</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#7B1FA2' }}>Animals</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#7B1FA2' }}>Total Value</th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#7B1FA2' }}>Avg/Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {yearWiseData.map((year, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#333' }}>{year.label}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#2196F3', fontWeight: '600' }}>{year.count}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#4CAF50', fontWeight: '600' }}>{year.animals}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#FF9800', fontWeight: '600' }}>₹{year.value.toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#f44336', fontWeight: '600' }}>
                        ₹{year.count > 0 ? Math.round(year.value / year.count).toLocaleString() : 0}
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f5f5f5', fontWeight: '700' }}>
                    <td style={{ padding: '12px', color: '#1e3c72' }}>Total</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#2196F3' }}>{yearWiseData.reduce((sum, y) => sum + y.count, 0)}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#4CAF50' }}>{yearWiseData.reduce((sum, y) => sum + y.animals, 0)}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#FF9800' }}>₹{yearWiseData.reduce((sum, y) => sum + y.value, 0).toLocaleString()}</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#f44336' }}>-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MarketDataAnalytics;
