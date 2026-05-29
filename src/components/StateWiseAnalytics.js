import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getStateWiseStatistics, 
  getFrequentBuyers, 
  getFrequentSellers,
  getReceiptsByState,
  getAllMarkets
} from '../firebase/firestoreService';
import Header from './Header';

function StateWiseAnalytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stateStats, setStateStats] = useState([]);
  const [frequentBuyers, setFrequentBuyers] = useState([]);
  const [frequentSellers, setFrequentSellers] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [stateReceipts, setStateReceipts] = useState([]);
  const [activeTab, setActiveTab] = useState('states'); // 'states', 'buyers', 'sellers'
  const [markets, setMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState('all');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [stats, buyers, sellers, marketsData] = await Promise.all([
        getStateWiseStatistics(),
        getFrequentBuyers(20),
        getFrequentSellers(20),
        getAllMarkets()
      ]);
      
      setStateStats(stats);
      setFrequentBuyers(buyers);
      setFrequentSellers(sellers);
      setMarkets(marketsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      alert('Error loading analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Filter data by selected market
  const getFilteredData = (data) => {
    if (selectedMarket === 'all') return data;
    return data.filter(item => item.marketId === selectedMarket);
  };

  const handleStateSelect = async (state) => {
    setSelectedState(state);
    try {
      const receipts = await getReceiptsByState(state, 'buyer');
      setStateReceipts(receipts);
    } catch (error) {
      console.error('Error loading state receipts:', error);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="State-wise Analytics" />
        <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
          <h2>Loading Analytics... / विश्लेषण लोड हो रहा है...</h2>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="State-wise Analytics / राज्यवार विश्लेषण" />
      
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

        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '30px',
          borderBottom: '2px solid #e0e0e0',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setActiveTab('states')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeTab === 'states' ? '#1e3c72' : 'transparent',
              color: activeTab === 'states' ? 'white' : '#1e3c72',
              borderBottom: activeTab === 'states' ? '3px solid #1e3c72' : 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3V16C3 17.1046 3.89543 18 5 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M7 14L10 11L13 14L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="7" cy="14" r="1.5" fill="currentColor"/>
              <circle cx="10" cy="11" r="1.5" fill="currentColor"/>
              <circle cx="13" cy="14" r="1.5" fill="currentColor"/>
              <circle cx="18" cy="9" r="1.5" fill="currentColor"/>
            </svg>
            State-wise / राज्यवार
          </button>
          <button
            onClick={() => setActiveTab('buyers')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeTab === 'buyers' ? '#1e3c72' : 'transparent',
              color: activeTab === 'buyers' ? 'white' : '#1e3c72',
              borderBottom: activeTab === 'buyers' ? '3px solid #1e3c72' : 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 2C6.38 2 4.25 4.13 4.25 6.75C4.25 9.32 6.26 11.4 8.88 11.49C8.96 11.48 9.04 11.48 9.1 11.49C9.12 11.49 9.13 11.49 9.15 11.49C9.16 11.49 9.16 11.49 9.17 11.49C11.73 11.4 13.74 9.32 13.75 6.75C13.75 4.13 11.62 2 9 2Z" fill="currentColor"/>
              <path d="M14.08 14.15C11.29 12.29 6.73996 12.29 3.92996 14.15C2.65996 15 1.95996 16.15 1.95996 17.38C1.95996 18.61 2.65996 19.75 3.91996 20.59C5.31996 21.53 7.15996 22 8.99996 22C10.84 22 12.68 21.53 14.08 20.59C15.34 19.74 16.04 18.6 16.04 17.36C16.03 16.13 15.34 14.99 14.08 14.15Z" fill="currentColor"/>
              <path d="M19.99 7.34C20.15 9.28 18.77 10.98 16.86 11.21C16.85 11.21 16.85 11.21 16.84 11.21H16.81C16.75 11.21 16.69 11.21 16.64 11.23C15.67 11.28 14.78 10.97 14.11 10.4C15.14 9.48 15.73 8.1 15.61 6.6C15.54 5.79 15.26 5.05 14.84 4.42C15.22 4.23 15.66 4.11 16.11 4.07C18.07 3.90 19.82 5.36 19.99 7.34Z" fill="currentColor"/>
              <path d="M21.99 16.59C21.91 17.56 21.29 18.4 20.25 18.97C19.25 19.52 17.99 19.78 16.74 19.75C17.46 19.1 17.88 18.29 17.96 17.43C18.06 16.19 17.47 15 16.29 14.05C15.62 13.52 14.84 13.1 13.99 12.79C16.2 12.15 18.98 12.58 20.69 13.96C21.61 14.7 22.08 15.63 21.99 16.59Z" fill="currentColor"/>
            </svg>
            Frequent Buyers / बार-बार खरीदार
          </button>
          <button
            onClick={() => setActiveTab('sellers')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeTab === 'sellers' ? '#1e3c72' : 'transparent',
              color: activeTab === 'sellers' ? 'white' : '#1e3c72',
              borderBottom: activeTab === 'sellers' ? '3px solid #1e3c72' : 'none',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 10H19C21 10 22 9 22 7V5C22 3 21 2 19 2H17C15 2 14 3 14 5V7C14 9 15 10 17 10Z" fill="currentColor"/>
              <path d="M5 22H7C9 22 10 21 10 19V17C10 15 9 14 7 14H5C3 14 2 15 2 17V19C2 21 3 22 5 22Z" fill="currentColor"/>
              <path d="M6 10C8.20914 10 10 8.20914 10 6C10 3.79086 8.20914 2 6 2C3.79086 2 2 3.79086 2 6C2 8.20914 3.79086 10 6 10Z" fill="currentColor"/>
              <path d="M18 22C20.2091 22 22 20.2091 22 18C22 15.7909 20.2091 14 18 14C15.7909 14 14 15.7909 14 18C14 20.2091 15.7909 22 18 22Z" fill="currentColor"/>
            </svg>
            Frequent Sellers / बार-बार विक्रेता
          </button>
        </div>

        {/* State-wise Statistics Tab */}
        {activeTab === 'states' && (
          <div className="card">
            <h2 style={{ color: '#1e3c72', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" stroke="#1e3c72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="9" r="2.5" fill="#1e3c72"/>
              </svg>
              State-wise Transaction Statistics / राज्यवार लेनदेन आंकड़े
            </h2>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1e3c72', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>
                      State / राज्य
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>
                      Market / बाजार
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>
                      Buyers / खरीदार
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>
                      Sellers / विक्रेता
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>
                      Total Transactions / कुल लेनदेन
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>
                      Buyer Amount / खरीदार राशि
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>
                      Seller Amount / विक्रेता राशि
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>
                      Actions / कार्य
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredData(stateStats).map((stat, index) => (
                    <tr key={index} style={{ background: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                      <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                        {stat.state}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', color: '#666', fontSize: '13px' }}>
                        {stat.marketName || 'N/A'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                        {stat.buyerCount}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                        {stat.sellerCount}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>
                        {stat.totalTransactions}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>
                        ₹{stat.totalBuyerAmount.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right' }}>
                        ₹{stat.totalSellerAmount.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                        <button
                          onClick={() => handleStateSelect(stat.state)}
                          style={{
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, #1e3c72, #2a5298)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            transition: 'all 0.2s',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" fill="white"/>
                            <path d="M12 5C7 5 2.73 8.11 1 12.5C2.73 16.89 7 20 12 20C17 20 21.27 16.89 23 12.5C21.27 8.11 17 5 12 5Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Selected State Details */}
            {selectedState && stateReceipts.length > 0 && (
              <div style={{ marginTop: '30px', padding: '20px', background: '#f0f4f8', borderRadius: '8px' }}>
                <h3 style={{ color: '#1e3c72', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#1e3c72"/>
                    <path d="M14 2V8H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Receipts from {selectedState} / {selectedState} से रसीदें
                </h3>
                <p style={{ marginBottom: '15px' }}>
                  Total Receipts: {stateReceipts.length}
                </p>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {stateReceipts.slice(0, 10).map((receipt) => (
                    <div key={receipt.id} style={{ 
                      padding: '10px', 
                      background: 'white', 
                      marginBottom: '10px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}>
                      <strong>Receipt ID:</strong> {receipt.id} | 
                      <strong> Buyer:</strong> {receipt.buyerName} | 
                      <strong> Amount:</strong> ₹{parseInt(receipt.animalPrice).toLocaleString()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Frequent Buyers Tab */}
        {activeTab === 'buyers' && (
          <div className="card">
            <h2 style={{ color: '#1e3c72', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 2C6.38 2 4.25 4.13 4.25 6.75C4.25 9.32 6.26 11.4 8.88 11.49C8.96 11.48 9.04 11.48 9.1 11.49C9.12 11.49 9.13 11.49 9.15 11.49C9.16 11.49 9.16 11.49 9.17 11.49C11.73 11.4 13.74 9.32 13.75 6.75C13.75 4.13 11.62 2 9 2Z" fill="#1e3c72"/>
                <path d="M14.08 14.15C11.29 12.29 6.73996 12.29 3.92996 14.15C2.65996 15 1.95996 16.15 1.95996 17.38C1.95996 18.61 2.65996 19.75 3.91996 20.59C5.31996 21.53 7.15996 22 8.99996 22C10.84 22 12.68 21.53 14.08 20.59C15.34 19.74 16.04 18.6 16.04 17.36C16.03 16.13 15.34 14.99 14.08 14.15Z" fill="#1e3c72"/>
                <path d="M19.99 7.34C20.15 9.28 18.77 10.98 16.86 11.21C16.85 11.21 16.85 11.21 16.84 11.21H16.81C16.75 11.21 16.69 11.21 16.64 11.23C15.67 11.28 14.78 10.97 14.11 10.4C15.14 9.48 15.73 8.1 15.61 6.6C15.54 5.79 15.26 5.05 14.84 4.42C15.22 4.23 15.66 4.11 16.11 4.07C18.07 3.90 19.82 5.36 19.99 7.34Z" fill="#1e3c72"/>
                <path d="M21.99 16.59C21.91 17.56 21.29 18.4 20.25 18.97C19.25 19.52 17.99 19.78 16.74 19.75C17.46 19.1 17.88 18.29 17.96 17.43C18.06 16.19 17.47 15 16.29 14.05C15.62 13.52 14.84 13.1 13.99 12.79C16.2 12.15 18.98 12.58 20.69 13.96C21.61 14.7 22.08 15.63 21.99 16.59Z" fill="#1e3c72"/>
              </svg>
              Top Frequent Buyers / शीर्ष बार-बार खरीदार
            </h2>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1e3c72', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Rank</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Name / नाम</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Market / बाजार</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Mobile / मोबाइल</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Aadhaar / आधार</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Location / स्थान</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>State / राज्य</th>
                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Purchases / खरीद</th>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>Total Amount / कुल राशि</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredData(frequentBuyers).map((buyer, index) => (
                    <tr key={index} style={{ background: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                      <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{buyer.name}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', color: '#666', fontSize: '13px' }}>
                        {buyer.marketName || 'N/A'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{buyer.mobile}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {buyer.aadhar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {buyer.village}, {buyer.tehsil}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{buyer.state}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', color: '#1e3c72' }}>
                        {buyer.count}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>
                        ₹{buyer.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Frequent Sellers Tab */}
        {activeTab === 'sellers' && (
          <div className="card">
            <h2 style={{ color: '#1e3c72', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 10H19C21 10 22 9 22 7V5C22 3 21 2 19 2H17C15 2 14 3 14 5V7C14 9 15 10 17 10Z" fill="#1e3c72"/>
                <path d="M5 22H7C9 22 10 21 10 19V17C10 15 9 14 7 14H5C3 14 2 15 2 17V19C2 21 3 22 5 22Z" fill="#1e3c72"/>
                <path d="M6 10C8.20914 10 10 8.20914 10 6C10 3.79086 8.20914 2 6 2C3.79086 2 2 3.79086 2 6C2 8.20914 3.79086 10 6 10Z" fill="#1e3c72"/>
                <path d="M18 22C20.2091 22 22 20.2091 22 18C22 15.7909 20.2091 14 18 14C15.7909 14 14 15.7909 14 18C14 20.2091 15.7909 22 18 22Z" fill="#1e3c72"/>
              </svg>
              Top Frequent Sellers / शीर्ष बार-बार विक्रेता
            </h2>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#1e3c72', color: 'white' }}>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Rank</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Name / नाम</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Market / बाजार</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Mobile / मोबाइल</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Aadhaar / आधार</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Location / स्थान</th>
                    <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>State / राज्य</th>
                    <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Sales / बिक्री</th>
                    <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>Total Amount / कुल राशि</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredData(frequentSellers).map((seller, index) => (
                    <tr key={index} style={{ background: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                      <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{seller.name}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', color: '#666', fontSize: '13px' }}>
                        {seller.marketName || 'N/A'}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{seller.mobile}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {seller.aadhar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                        {seller.village}, {seller.tehsil}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd' }}>{seller.state}</td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold', color: '#1e3c72' }}>
                        {seller.count}
                      </td>
                      <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>
                        ₹{seller.totalAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StateWiseAnalytics;
