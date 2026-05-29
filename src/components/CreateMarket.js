import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createMarket } from '../firebase/firestoreService';
import Header from './Header';

function CreateMarket() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    district: '',
    state: ''
  });
  const [success, setSuccess] = useState(false);
  const [marketId, setMarketId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const newMarketId = await createMarket({
        name: formData.name,
        location: formData.location,
        district: formData.district,
        state: formData.state
      });

      setMarketId(newMarketId);
      setSuccess(true);
      
      // Show success popup for 2 seconds, then redirect to dashboard
      setTimeout(() => {
        navigate('/super-admin');
      }, 2000);
    } catch (error) {
      console.error('Error creating market:', error);
      setError('Failed to create market. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header title="Create New Market" />

      <div className="container">
        {/* Success Popup Modal */}
        {success && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{
              background: 'white',
              padding: '40px',
              borderRadius: '16px',
              textAlign: 'center',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'scaleIn 0.3s ease'
            }}>
              {/* Professional SVG Checkmark */}
              <div style={{ marginBottom: '20px' }}>
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="40" cy="40" r="38" fill="#4CAF50" stroke="#2E7D32" strokeWidth="2"/>
                  <path d="M25 40L35 50L55 30" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{ 
                color: '#155724', 
                marginBottom: '15px', 
                fontSize: '26px',
                fontWeight: '700'
              }}>
                Market Created Successfully!
              </h2>
              <p style={{ 
                color: '#666', 
                marginBottom: '20px',
                fontSize: '15px'
              }}>
                बाजार सफलतापूर्वक बनाया गया!
              </p>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                color: '#155724',
                padding: '20px',
                background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
                borderRadius: '12px',
                marginBottom: '20px',
                letterSpacing: '3px',
                border: '2px solid #28a745'
              }}>
                {marketId}
              </div>
              <p style={{ 
                color: '#666',
                fontSize: '14px',
                marginBottom: '15px'
              }}>
                📋 Market ID saved! Redirecting to dashboard...
              </p>
              <div style={{
                width: '60px',
                height: '4px',
                background: 'linear-gradient(90deg, #4CAF50, #2196F3)',
                borderRadius: '2px',
                margin: '0 auto',
                animation: 'loading 1.5s ease-in-out infinite'
              }}></div>
            </div>
          </div>
        )}

        <div className="card" style={{ maxWidth: '700px', margin: '0 auto', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {success && (
            <div style={{
              padding: '25px',
              background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
              border: '2px solid #28a745',
              borderRadius: '12px',
              marginBottom: '25px',
              textAlign: 'center',
              animation: 'slideDown 0.3s ease',
              display: 'none'
            }}>
              <div style={{ fontSize: '56px', marginBottom: '12px' }}>✅</div>
              <h3 style={{ color: '#155724', marginBottom: '12px', fontSize: '22px' }}>
                Market Created Successfully!
              </h3>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                color: '#155724',
                padding: '15px 20px',
                background: 'white',
                borderRadius: '8px',
                display: 'inline-block',
                marginTop: '12px',
                letterSpacing: '2px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                {marketId}
              </div>
              <p style={{ marginTop: '15px', color: '#155724', fontSize: '15px', fontWeight: '600' }}>
                📋 Market ID saved! You can now create an admin for this market.
              </p>
            </div>
          )}

          {error && (
            <div style={{
              padding: '15px 20px',
              background: '#ffebee',
              border: '2px solid #f44336',
              borderRadius: '8px',
              marginBottom: '20px',
              color: '#c62828',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '20px' }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label style={{ fontSize: '15px', fontWeight: '700', color: '#1e3c72', marginBottom: '8px', display: 'block' }}>
                Market Name / बाजार का नाम *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="e.g., Central Livestock Market"
                style={{
                  fontSize: '15px',
                  padding: '12px 15px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  transition: 'all 0.3s'
                }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '15px', fontWeight: '700', color: '#1e3c72', marginBottom: '8px', display: 'block' }}>
                Location / स्थान *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="e.g., Near Railway Station, Main Road"
                style={{
                  fontSize: '15px',
                  padding: '12px 15px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  transition: 'all 0.3s'
                }}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label style={{ fontSize: '15px', fontWeight: '700', color: '#1e3c72', marginBottom: '8px', display: 'block' }}>
                  District / जिला *
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Enter district name"
                  style={{
                    fontSize: '15px',
                    padding: '12px 15px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    transition: 'all 0.3s'
                  }}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '15px', fontWeight: '700', color: '#1e3c72', marginBottom: '8px', display: 'block' }}>
                  State / राज्य *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Enter state name"
                  style={{
                    fontSize: '15px',
                    padding: '12px 15px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    transition: 'all 0.3s'
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '35px', textAlign: 'center' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ 
                  minWidth: '220px',
                  padding: '14px 30px',
                  fontSize: '16px',
                  fontWeight: '700',
                  background: loading ? '#ccc' : 'linear-gradient(135deg, #4CAF50 0%, #2196F3 100%)',
                  border: 'none',
                  borderRadius: '10px',
                  boxShadow: loading ? 'none' : '0 6px 20px rgba(76, 175, 80, 0.35)',
                  transition: 'all 0.3s',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
                disabled={loading}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 8px 25px rgba(76, 175, 80, 0.45)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.35)';
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <img 
                      src="/logo.png" 
                      alt="Loading..." 
                      style={{ 
                        width: '20px', 
                        height: '20px',
                        animation: 'spin 1s linear infinite'
                      }} 
                    />
                    Creating Market...
                  </span>
                ) : '✓ Create Market / बाजार बनाएं'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes loading {
          0%, 100% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(200%);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        input:focus {
          border-color: #4CAF50 !important;
          box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1) !important;
          outline: none;
        }

        @media (max-width: 768px) {
          .form-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}

export default CreateMarket;
