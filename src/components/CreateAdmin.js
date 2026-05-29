import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUser } from '../firebase/authService';
import { getAllMarkets } from '../firebase/firestoreService';
import Header from './Header';

function CreateAdmin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    marketId: '',
    mobile: ''
  });
  const [markets, setMarkets] = useState([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMarkets, setLoadingMarkets] = useState(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const marketsData = await getAllMarkets();
        setMarkets(marketsData);
      } catch (error) {
        console.error('Error fetching markets:', error);
        setError('Failed to load markets');
      } finally {
        setLoadingMarkets(false);
      }
    };

    fetchMarkets();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (!formData.marketId) {
      setError('Please select a market');
      setLoading(false);
      return;
    }

    try {
      const selectedMarket = markets.find(m => m.id === formData.marketId || m.marketId === formData.marketId);
      
      if (!selectedMarket) {
        setError('Selected market not found. Please try again.');
        setLoading(false);
        return;
      }
      
      console.log('Creating admin with data:', {
        name: formData.name,
        email: formData.email,
        marketId: selectedMarket.marketId || selectedMarket.id,
        marketName: selectedMarket.name
      });
      
      const newUser = await createUser(formData.email, formData.password, {
        name: formData.name,
        role: 'market-admin',
        marketId: selectedMarket.marketId || selectedMarket.id,
        marketName: selectedMarket.name,
        mobile: formData.mobile,
        email: formData.email
      });
      
      console.log('Admin created successfully with UID:', newUser.uid);

      setSuccess(true);
      
      // Redirect to admin list after 2 seconds
      setTimeout(() => {
        navigate('/manage-admins');
      }, 2000);
    } catch (error) {
      console.error('Error creating admin:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      
      if (error.code === 'auth/email-already-in-use') {
        setError('Email already in use. Please use a different email.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email format.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Use at least 6 characters.');
      } else if (error.code === 'permission-denied') {
        setError('Permission denied. Please check Firestore rules and try again.');
      } else if (error.message.includes('Firestore')) {
        setError('Failed to save admin data. Please check Firestore rules and try again.');
      } else {
        setError(`Failed to create admin: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header title="Create Market Admin" />

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
                Admin Created Successfully!
              </h2>
              <p style={{ 
                color: '#666', 
                marginBottom: '20px',
                fontSize: '15px'
              }}>
                एडमिन सफलतापूर्वक बनाया गया!
              </p>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#155724',
                padding: '15px 20px',
                background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
                borderRadius: '12px',
                marginBottom: '20px',
                border: '2px solid #28a745'
              }}>
                {formData.email}
              </div>
              <p style={{ 
                color: '#666',
                fontSize: '14px',
                marginBottom: '15px'
              }}>
                👤 Redirecting to admin list...
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

        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          {success && (
            <div className="alert alert-success" style={{ display: 'none' }}>
              <strong>Success!</strong> Market Admin created successfully. 
              Email: <strong>{formData.email}</strong>
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}

          {loadingMarkets ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
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
              <p style={{ color: '#1e3c72', fontSize: '15px', fontWeight: '600' }}>Loading markets...</p>
              <style>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
            </div>
          ) : markets.length === 0 ? (
            <div className="alert alert-warning">
              <strong>No markets found!</strong> Please create a market first before creating an admin.
              <div style={{ marginTop: '15px' }}>
                <Link to="/create-market" className="btn btn-primary">
                  Create Market
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 style={{ marginBottom: '20px', color: '#1e3c72' }}>Admin Details</h2>
              
              <div className="form-group">
                <label>Full Name <span className="required-star">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Enter full name"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email <span className="required-star">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="admin@example.com"
                  />
                </div>

                <div className="form-group">
                  <label>Mobile Number <span className="required-star">*</span></label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    pattern="[0-9]{10}"
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Password <span className="required-star">*</span></label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    minLength="6"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div className="form-group">
                  <label>Confirm Password <span className="required-star">*</span></label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="Re-enter password"
                  />
                </div>
              </div>

              <h2 style={{ marginTop: '30px', marginBottom: '20px', color: '#1e3c72' }}>
                Market Assignment
              </h2>

              <div className="form-group">
                <label>Assign to Market <span className="required-star">*</span></label>
                <select
                  name="marketId"
                  value={formData.marketId}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="">Select a market</option>
                  {markets.map(market => (
                    <option key={market.id} value={market.marketId || market.id}>
                      {market.name} ({market.marketId || market.id}) - {market.location}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: '30px', textAlign: 'center' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ minWidth: '200px' }}
                  disabled={loading}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                      <img 
                        src="/logo.png" 
                        alt="Loading..." 
                        style={{ 
                          width: '18px', 
                          height: '18px',
                          animation: 'spin 1s linear infinite'
                        }} 
                      />
                      Creating...
                    </span>
                  ) : 'Create Admin'}
                </button>
              </div>
            </form>
          )}

          <div style={{ marginTop: '40px', padding: '20px', background: '#f9f9f9', borderRadius: '8px' }}>
            <h3 style={{ marginBottom: '15px', color: '#1e3c72' }}>Important Notes:</h3>
            <ul style={{ color: '#666', lineHeight: '1.8' }}>
              <li>Each admin can only manage one market</li>
              <li>Admin will have access to create and view receipts for their assigned market only</li>
              <li>Email must be unique across the system</li>
              <li>Password should be strong and secure</li>
              <li>Admin credentials should be shared securely with the assigned person</li>
            </ul>
          </div>
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

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default CreateAdmin;
