import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllReceiptsWithStates, getAllMarkets } from '../firebase/firestoreService';
import Header from './Header';

function InterStateAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mpOutbound, setMpOutbound] = useState([]); // MP se bahar ja raha
  const [mpInbound, setMpInbound] = useState([]); // MP mein aa raha
  const [crossState, setCrossState] = useState([]); // Dono alag state
  const [topDestinations, setTopDestinations] = useState([]);
  const [topSources, setTopSources] = useState([]);
  const [activeTab, setActiveTab] = useState('outbound'); // outbound, inbound, cross
  const [markets, setMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState('all');

  useEffect(() => {
    loadInterStateData();
  }, []);

  const loadInterStateData = async () => {
    try {
      setLoading(true);
      const [allReceipts, marketsData] = await Promise.all([
        getAllReceiptsWithStates(),
        getAllMarkets()
      ]);
      
      setMarkets(marketsData);
      
      // Filter inter-state transactions
      const outbound = []; // MP seller → Other state buyer
      const inbound = []; // Other state seller → MP buyer
      const cross = []; // Both different states (not MP)
      const destinationMap = new Map(); // Kon se state mein ja raha
      const sourceMap = new Map(); // Kon se state se aa raha
      
      allReceipts.forEach(receipt => {
        const sellerState = receipt.sellerState || 'Madhya Pradesh';
        const buyerState = receipt.buyerState || 'Madhya Pradesh';
        
        // Skip if both same state
        if (sellerState === buyerState) return;
        
        // MP se bahar ja raha (MP seller → Other buyer)
        if (sellerState === 'Madhya Pradesh' && buyerState !== 'Madhya Pradesh') {
          outbound.push(receipt);
          
          // Count destinations
          if (destinationMap.has(buyerState)) {
            const existing = destinationMap.get(buyerState);
            existing.count += 1;
            existing.totalAmount += parseFloat(receipt.animalPrice || 0);
            existing.totalAnimals += parseInt(receipt.animalCount || 0);
          } else {
            destinationMap.set(buyerState, {
              state: buyerState,
              count: 1,
              totalAmount: parseFloat(receipt.animalPrice || 0),
              totalAnimals: parseInt(receipt.animalCount || 0)
            });
          }
        }
        
        // MP mein aa raha (Other seller → MP buyer)
        else if (sellerState !== 'Madhya Pradesh' && buyerState === 'Madhya Pradesh') {
          inbound.push(receipt);
          
          // Count sources
          if (sourceMap.has(sellerState)) {
            const existing = sourceMap.get(sellerState);
            existing.count += 1;
            existing.totalAmount += parseFloat(receipt.animalPrice || 0);
            existing.totalAnimals += parseInt(receipt.animalCount || 0);
          } else {
            sourceMap.set(sellerState, {
              state: sellerState,
              count: 1,
              totalAmount: parseFloat(receipt.animalPrice || 0),
              totalAnimals: parseInt(receipt.animalCount || 0)
            });
          }
        }
        
        // Dono alag state (not MP)
        else if (sellerState !== 'Madhya Pradesh' && buyerState !== 'Madhya Pradesh') {
          cross.push(receipt);
        }
      });
      
      // Sort destinations and sources
      const sortedDestinations = Array.from(destinationMap.values())
        .sort((a, b) => b.count - a.count);
      
      const sortedSources = Array.from(sourceMap.values())
        .sort((a, b) => b.count - a.count);
      
      setMpOutbound(outbound);
      setMpInbound(inbound);
      setCrossState(cross);
      setTopDestinations(sortedDestinations);
      setTopSources(sortedSources);
      
    } catch (error) {
      console.error('Error loading inter-state data:', error);
      alert('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  // Filter data by selected market
  const getFilteredData = (data) => {
    if (selectedMarket === 'all') return data;
    return data.filter(item => item.marketId === selectedMarket);
  };

  if (loading) {
    return (
      <div>
        <Header title="Inter-State Movement Analytics" />
        <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
          <h2>Loading Analytics... / विश्लेषण लोड हो रहा है...</h2>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Inter-State Movement Analytics / अंतर-राज्य आवाजाही विश्लेषण" />
      
      <div className="container">
        <div style={{ marginBottom: '20px' }}>
          <button onClick={() => navigate(-1)} className="btn btn-secondary">
            ← Back / वापस जाएं
          </button>
        </div>

        {/* Market Filter */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e3c72', fontSize: '16px' }}>
            🏪 Filter by Market / बाजार के अनुसार फ़िल्टर करें
          </label>
          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '2px solid #e0e0e0',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            <option value="all">All Markets / सभी बाजार</option>
            {markets.map(market => (
              <option key={market.id} value={market.id}>
                {market.name} - {market.location}
              </option>
            ))}
          </select>
        </div>

        {/* Summary Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #FF6B6B, #EE5A6F)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="white"/>
                <path d="M12 2L22 12L12 22" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              MP से बाहर (Outbound)
            </h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{getFilteredData(mpOutbound).length}</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Transactions</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #4CAF50, #45A049)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 9L12 16L5 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 3V16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M5 19H19" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              MP में आ रहा (Inbound)
            </h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{getFilteredData(mpInbound).length}</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Transactions</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #2196F3, #1976D2)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 16L12 21L17 16M17 8L12 3L7 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 21V3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Cross-State (Other)
            </h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{getFilteredData(crossState).length}</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Transactions</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #9C27B0, #7B1FA2)',
            color: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3V16C3 17.1046 3.89543 18 5 18H21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <path d="M7 14L10 11L13 14L18 9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="7" cy="14" r="1.5" fill="white"/>
                <circle cx="10" cy="11" r="1.5" fill="white"/>
                <circle cx="13" cy="14" r="1.5" fill="white"/>
                <circle cx="18" cy="9" r="1.5" fill="white"/>
              </svg>
              Total Inter-State
            </h3>
            <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
              {getFilteredData(mpOutbound).length + getFilteredData(mpInbound).length + getFilteredData(crossState).length}
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Transactions</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '30px',
          borderBottom: '2px solid #e0e0e0',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setActiveTab('outbound')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeTab === 'outbound' ? '#FF6B6B' : 'transparent',
              color: activeTab === 'outbound' ? 'white' : '#FF6B6B',
              borderBottom: activeTab === 'outbound' ? '3px solid #FF6B6B' : 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            MP से बाहर ({getFilteredData(mpOutbound).length})
          </button>
          <button
            onClick={() => setActiveTab('inbound')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeTab === 'inbound' ? '#4CAF50' : 'transparent',
              color: activeTab === 'inbound' ? 'white' : '#4CAF50',
              borderBottom: activeTab === 'inbound' ? '3px solid #4CAF50' : 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            MP में आ रहा ({getFilteredData(mpInbound).length})
          </button>
          <button
            onClick={() => setActiveTab('destinations')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeTab === 'destinations' ? '#2196F3' : 'transparent',
              color: activeTab === 'destinations' ? 'white' : '#2196F3',
              borderBottom: activeTab === 'destinations' ? '3px solid #2196F3' : 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
            </svg>
            Top Destinations
          </button>
          <button
            onClick={() => setActiveTab('sources')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeTab === 'sources' ? '#9C27B0' : 'transparent',
              color: activeTab === 'sources' ? 'white' : '#9C27B0',
              borderBottom: activeTab === 'sources' ? '3px solid #9C27B0' : 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="9" r="2.5" fill="currentColor"/>
            </svg>
            Top Sources
          </button>
        </div>

        {/* MP Outbound Tab */}
        {activeTab === 'outbound' && (
          <div className="card">
            <h2 style={{ color: '#FF6B6B', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="#FF6B6B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              MP से बाहर जा रहा (Outbound from MP)
            </h2>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Madhya Pradesh के sellers दूसरे states के buyers को animals बेच रहे हैं
            </p>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#FF6B6B', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Receipt ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Market / बाजार</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Seller (MP)</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Buyer State</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Buyer Name</th>
                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Animals</th>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredData(mpOutbound).map((receipt, index) => (
                    <tr key={index} style={{ background: index % 2 === 0 ? '#fff5f5' : 'white' }}>
                      <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                        {receipt.id}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', color: '#666', fontSize: '13px' }}>
                        {receipt.marketName || 'N/A'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {receipt.sellerName}<br/>
                        <small style={{ color: '#666' }}>{receipt.sellerVillage}, {receipt.sellerTehsil}</small>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold', color: '#FF6B6B' }}>
                        {receipt.buyerState}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {receipt.buyerName}<br/>
                        <small style={{ color: '#666' }}>{receipt.buyerVillage}, {receipt.buyerTehsil}</small>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                        {receipt.animalCount} {receipt.animalType}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>
                        ₹{parseInt(receipt.animalPrice).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                        {new Date(receipt.createdAt?.toDate ? receipt.createdAt.toDate() : receipt.date).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {getFilteredData(mpOutbound).length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                        No outbound transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MP Inbound Tab */}
        {activeTab === 'inbound' && (
          <div className="card">
            <h2 style={{ color: '#4CAF50', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M5 12L12 5M5 12L12 19" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              MP में आ रहा (Inbound to MP)
            </h2>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              दूसरे states के sellers Madhya Pradesh के buyers को animals बेच रहे हैं
            </p>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#4CAF50', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Receipt ID</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Market / बाजार</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Seller State</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Seller Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Buyer (MP)</th>
                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Animals</th>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredData(mpInbound).map((receipt, index) => (
                    <tr key={index} style={{ background: index % 2 === 0 ? '#f1f8f4' : 'white' }}>
                      <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                        {receipt.id}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', color: '#666', fontSize: '13px' }}>
                        {receipt.marketName || 'N/A'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold', color: '#4CAF50' }}>
                        {receipt.sellerState}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {receipt.sellerName}<br/>
                        <small style={{ color: '#666' }}>{receipt.sellerVillage}, {receipt.sellerTehsil}</small>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {receipt.buyerName}<br/>
                        <small style={{ color: '#666' }}>{receipt.buyerVillage}, {receipt.buyerTehsil}</small>
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                        {receipt.animalCount} {receipt.animalType}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>
                        ₹{parseInt(receipt.animalPrice).toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                        {new Date(receipt.createdAt?.toDate ? receipt.createdAt.toDate() : receipt.date).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {getFilteredData(mpInbound).length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                        No inbound transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Destinations Tab */}
        {activeTab === 'destinations' && (
          <div className="card">
            <h2 style={{ color: '#2196F3', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#2196F3"/>
              </svg>
              Top Destination States (MP से कहाँ जा रहा)
            </h2>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              MP से सबसे ज्यादा animals किन states में जा रहे हैं
            </p>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#2196F3', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Rank</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Destination State</th>
                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Transactions</th>
                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Total Animals</th>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {topDestinations.map((dest, index) => (
                    <tr key={index} style={{ background: index % 2 === 0 ? '#e3f2fd' : 'white' }}>
                      <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold', fontSize: '16px' }}>
                        {dest.state}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', color: '#2196F3' }}>
                        {dest.count}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                        {dest.totalAnimals}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>
                        ₹{dest.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {topDestinations.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                        No destination data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Sources Tab */}
        {activeTab === 'sources' && (
          <div className="card">
            <h2 style={{ color: '#9C27B0', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="9" r="2.5" fill="#9C27B0"/>
              </svg>
              Top Source States (MP में कहाँ से आ रहा)
            </h2>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              MP में सबसे ज्यादा animals किन states से आ रहे हैं
            </p>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#9C27B0', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Rank</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Source State</th>
                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Transactions</th>
                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Total Animals</th>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {topSources.map((source, index) => (
                    <tr key={index} style={{ background: index % 2 === 0 ? '#f3e5f5' : 'white' }}>
                      <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold', fontSize: '16px' }}>
                        {source.state}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', color: '#9C27B0' }}>
                        {source.count}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                        {source.totalAnimals}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>
                        ₹{source.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {topSources.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                        No source data found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InterStateAnalytics;
