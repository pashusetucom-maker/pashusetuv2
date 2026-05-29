import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();

  // Auto-redirect if user is already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'super-admin') {
        navigate('/super-admin', { replace: true });
      } else if (user.role === 'market-admin') {
        navigate('/market-admin', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      
      if (user.role === 'super-admin') {
        navigate('/super-admin');
      } else if (user.role === 'market-admin') {
        navigate('/market-admin');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('User not found. Please check your email.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email format.');
      } else if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      background: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%)',
      position: 'relative',
      overflowY: 'auto'
    }}>
      {/* Header Section with Logo and Description */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        paddingTop: '20px'
      }}>
        {/* Large Logo */}
        <img 
          src="/logo.png" 
          alt="PashuSetu Logo" 
          style={{ 
            width: '140px', 
            height: '140px',
            marginBottom: '20px',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))'
          }} 
        />
        
        {/* PashuSetu Title */}
        <h1 style={{
          fontSize: '48px',
          fontWeight: '800',
          marginBottom: '12px',
          letterSpacing: '-1px'
        }}>
          <span style={{ color: '#2196F3' }}>Pashu</span>
          <span style={{ color: '#4CAF50' }}>Setu</span>
        </h1>
        
        {/* Description */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          maxWidth: '800px',
          margin: '0 auto 20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
        }}>
          <p style={{
            color: '#1e3c72',
            fontSize: '16px',
            fontWeight: '700',
            marginBottom: '8px',
            lineHeight: '1.5',
            textAlign: 'center'
          }}>
            पशु बाजार डिजिटल रसीद प्रणाली | Livestock Market Digital Receipt System
          </p>
          <p style={{
            color: '#555',
            fontSize: '14px',
            lineHeight: '1.6',
            marginBottom: '0',
            textAlign: 'justify',
            textJustify: 'inter-word'
          }}>
            PashuSetu एक government-grade web application है जो livestock (पशु) markets में होने वाले buying/selling और transport transactions को digitally manage और verify करने के लिए बनाया गया है। यह system traditional paper-based receipt system को replace करता है और एक secure, centralized और audit-proof digital platform प्रदान करता है।
          </p>
        </div>
      </div>

      {/* Login Card - Centered and Compact */}
      <div style={{
        maxWidth: '420px',
        margin: '0 auto 40px',
        width: '100%'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '35px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          position: 'relative'
        }}>
        {/* Logo and Title */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: '700',
            marginBottom: '6px',
            color: '#1e3c72'
          }}>
            Admin Login
          </h2>
          <p style={{
            color: '#666',
            fontSize: '13px'
          }}>
            प्रशासक लॉगिन | Administrator Access
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: '12px 16px',
            background: '#ffebee',
            border: '1px solid #ffcdd2',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="#f44336"/>
            </svg>
            <span style={{ color: '#c62828', fontSize: '13px', flex: 1 }}>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#333',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#999"/>
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 44px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '15px',
                  transition: 'all 0.3s',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#333',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="#999"/>
                </svg>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 44px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '15px',
                  transition: 'all 0.3s',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#2196F3'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" fill="#999"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="#999"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#ccc' : 'linear-gradient(135deg, #2196F3 0%, #4CAF50 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(33, 150, 243, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(33, 150, 243, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.3)';
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round"/>
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Instagram-style OR Separator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '25px 0',
          gap: '15px'
        }}>
          <div style={{
            flex: 1,
            height: '1px',
            background: '#e0e0e0'
          }}></div>
          <span style={{
            color: '#999',
            fontSize: '13px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            OR
          </span>
          <div style={{
            flex: 1,
            height: '1px',
            background: '#e0e0e0'
          }}></div>
        </div>

        {/* Verify Receipt Link */}
        <div style={{ textAlign: 'center' }}>
          <Link
            to="/verify"
            style={{
              color: 'white',
              background: 'linear-gradient(135deg, #4CAF50 0%, #2196F3 100%)',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 24px',
              borderRadius: '8px',
              transition: 'all 0.3s',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(76, 175, 80, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.3)';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white"/>
            </svg>
            Verify Receipt / रसीद सत्यापित करें
          </Link>
        </div>
        </div>
      </div>

      {/* Guidelines Section - Dual Row on PC, Single Row on Mobile */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div className="guidelines-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px'
        }}>
          {/* Buyer Guidelines Card */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '30px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }}>
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          {/* Instagram-style Cow SVG for Buyers */}
          <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '15px' }}>
            <circle cx="50" cy="50" r="48" fill="#E3F2FD" stroke="#2196F3" strokeWidth="2"/>
            <path d="M30 45 Q25 35 20 40 L25 50 Z" fill="#2196F3"/>
            <path d="M70 45 Q75 35 80 40 L75 50 Z" fill="#2196F3"/>
            <ellipse cx="50" cy="55" rx="25" ry="20" fill="#2196F3"/>
            <ellipse cx="50" cy="50" rx="28" ry="22" fill="#64B5F6"/>
            <circle cx="42" cy="48" r="3" fill="white"/>
            <circle cx="58" cy="48" r="3" fill="white"/>
            <circle cx="43" cy="48" r="1.5" fill="#1976D2"/>
            <circle cx="59" cy="48" r="1.5" fill="#1976D2"/>
            <path d="M45 58 Q50 62 55 58" stroke="#1976D2" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <ellipse cx="48" cy="55" rx="2" ry="3" fill="#1976D2"/>
            <ellipse cx="52" cy="55" rx="2" ry="3" fill="#1976D2"/>
            <path d="M35 42 Q40 38 45 42" stroke="#1976D2" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            <path d="M55 42 Q60 38 65 42" stroke="#1976D2" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
          </svg>
          
          <h3 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#2196F3',
            marginBottom: '8px'
          }}>
            खरीदार दिशानिर्देश
          </h3>
          <p style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#1976D2'
          }}>
            Buyer Guidelines
          </p>
        </div>

        <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#333' }}>
          <div style={{ marginBottom: '15px', padding: '12px', background: '#E3F2FD', borderRadius: '8px', borderLeft: '4px solid #2196F3' }}>
            <strong style={{ color: '#1976D2' }}>✓ रसीद सत्यापन | Receipt Verification</strong>
            <p style={{ margin: '5px 0 0 0', color: '#555' }}>
              खरीदारी के बाद डिजिटल रसीद और QR कोड की जांच अवश्य करें। हमेशा रसीद की प्रामाणिकता सुनिश्चित करें।
              <br/>
              <em>Always verify the digital receipt and QR code after purchase. Ensure receipt authenticity.</em>
            </p>
          </div>

          <div style={{ marginBottom: '15px', padding: '12px', background: '#E3F2FD', borderRadius: '8px', borderLeft: '4px solid #2196F3' }}>
            <strong style={{ color: '#1976D2' }}>✓ पशु स्वास्थ्य जांच | Animal Health Check</strong>
            <p style={{ margin: '5px 0 0 0', color: '#555' }}>
              खरीदने से पहले पशु की स्वास्थ्य स्थिति, फिटनेस सर्टिफिकेट और टीकाकरण रिकॉर्ड की जांच करें।
              <br/>
              <em>Check animal's health condition, fitness certificate, and vaccination records before buying.</em>
            </p>
          </div>

          <div style={{ marginBottom: '15px', padding: '12px', background: '#E3F2FD', borderRadius: '8px', borderLeft: '4px solid #2196F3' }}>
            <strong style={{ color: '#1976D2' }}>✓ विक्रेता विवरण | Seller Details</strong>
            <p style={{ margin: '5px 0 0 0', color: '#555' }}>
              विक्रेता का नाम, संपर्क नंबर और पता रसीद में सही दर्ज हो, यह सुनिश्चित करें।
              <br/>
              <em>Ensure seller's name, contact number, and address are correctly recorded in the receipt.</em>
            </p>
          </div>

          <div style={{ marginBottom: '15px', padding: '12px', background: '#E3F2FD', borderRadius: '8px', borderLeft: '4px solid #2196F3' }}>
            <strong style={{ color: '#1976D2' }}>✓ परिवहन व्यवस्था | Transport Arrangement</strong>
            <p style={{ margin: '5px 0 0 0', color: '#555' }}>
              पशु परिवहन के लिए उचित वाहन और समय सीमा का पालन करें। क्रूरता से बचें।
              <br/>
              <em>Use proper vehicle for animal transport and follow time limits. Avoid cruelty.</em>
            </p>
          </div>

          <div style={{ marginBottom: '15px', padding: '12px', background: '#E3F2FD', borderRadius: '8px', borderLeft: '4px solid #2196F3' }}>
            <strong style={{ color: '#1976D2' }}>✓ मूल्य पारदर्शिता | Price Transparency</strong>
            <p style={{ margin: '5px 0 0 0', color: '#555' }}>
              रसीद में दर्ज मूल्य और भुगतान विवरण की जांच करें। किसी भी विसंगति की रिपोर्ट करें।
              <br/>
              <em>Check the price and payment details recorded in receipt. Report any discrepancies.</em>
            </p>
          </div>

          <div style={{ padding: '12px', background: '#FFF3E0', borderRadius: '8px', borderLeft: '4px solid #FF9800' }}>
            <strong style={{ color: '#F57C00' }}>⚠️ महत्वपूर्ण | Important</strong>
            <p style={{ margin: '5px 0 0 0', color: '#555' }}>
              बिना डिजिटल रसीद के पशु खरीदारी अमान्य है। किसी भी समस्या के लिए तुरंत अधिकारियों से संपर्क करें।
              <br/>
              <em>Animal purchase without digital receipt is invalid. Contact authorities immediately for any issues.</em>
            </p>
          </div>
        </div>
      </div>

      {/* Seller Guidelines Card */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          {/* Instagram-style Cow SVG for Sellers */}
          <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '15px' }}>
            <circle cx="50" cy="50" r="48" fill="#F1F8E9" stroke="#4CAF50" strokeWidth="2"/>
            <path d="M30 45 Q25 35 20 40 L25 50 Z" fill="#4CAF50"/>
            <path d="M70 45 Q75 35 80 40 L75 50 Z" fill="#4CAF50"/>
            <ellipse cx="50" cy="55" rx="25" ry="20" fill="#4CAF50"/>
            <ellipse cx="50" cy="50" rx="28" ry="22" fill="#81C784"/>
            <circle cx="42" cy="48" r="3" fill="white"/>
            <circle cx="58" cy="48" r="3" fill="white"/>
            <circle cx="43" cy="48" r="1.5" fill="#2E7D32"/>
            <circle cx="59" cy="48" r="1.5" fill="#2E7D32"/>
            <path d="M45 58 Q50 62 55 58" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <ellipse cx="48" cy="55" rx="2" ry="3" fill="#2E7D32"/>
            <ellipse cx="52" cy="55" rx="2" ry="3" fill="#2E7D32"/>
            <path d="M35 42 Q40 38 45 42" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            <path d="M55 42 Q60 38 65 42" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
            <circle cx="35" cy="52" r="4" fill="#A5D6A7"/>
            <circle cx="65" cy="52" r="4" fill="#A5D6A7"/>
          </svg>
          
          <h3 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#4CAF50',
            marginBottom: '8px'
          }}>
            विक्रेता दिशानिर्देश
          </h3>
          <p style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#2E7D32'
          }}>
            Seller Guidelines
          </p>
        </div>

        <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#333' }}>
          <div style={{ marginBottom: '15px', padding: '12px', background: '#F1F8E9', borderRadius: '8px', borderLeft: '4px solid #4CAF50' }}>
            <strong style={{ color: '#2E7D32' }}>✓ रसीद जनरेशन | Receipt Generation</strong>
            <p style={{ margin: '5px 0 0 0', color: '#555' }}>
              प्रत्येक बिक्री के लिए मार्केट एडमिन से डिजिटल रसीद अवश्य बनवाएं। सभी विवरण सही भरें।
              <br/>
              <em>Generate digital receipt from market admin for every sale. Fill all details correctly.</em>
            </p>
          </div>

          <div style={{ marginBottom: '15px', padding: '12px', background: '#F1F8E9', borderRadius: '8px', borderLeft: '4px solid #4CAF50' }}>
            <strong style={{ color: '#2E7D32' }}>✓ पशु दस्तावेज़ | Animal Documents</strong>
            <p style={{ margin: '5px 0 0 0', color: '#555' }}>
              फिटनेस सर्टिफिकेट, टीकाकरण रिकॉर्ड और पशु की फोटो अपलोड करना अनिवार्य है।
              <br/>
              <em>Uploading fitness certificate, vaccination records, and animal photo is mandatory.</em>
            </p>
          </div>

          <div style={{ marginBottom: '15px', padding: '12px', background: '#F1F8E9', borderRadius: '8px', borderLeft: '4px solid #4CAF50' }}>
            <strong style={{ color: '#2E7D32' }}>✓ सही जानकारी | Accurate Information</strong>
            <p style={{ margin: '5px 0 0 0', color: '#555' }}>
              पशु की नस्ल, आयु, वजन, स्वास्थ्य स्थिति और मूल्य की सही जानकारी दें। गलत जानकारी दंडनीय है।
              <br/>
              <em>Provide accurate information about breed, age, weight, health, and price. False info is punishable.</em>
            </p>
          </div>

          <div style={{ marginBottom: '15px', padding: '12px', background: '#F1F8E9', borderRadius: '8px', borderLeft: '4px solid #4CAF50' }}>
            <strong style={{ color: '#2E7D32' }}>✓ हस्ताक्षर आवश्यक | Signature Required</strong>
            <p style={{ margin: '5px 0 0 0', color: '#555' }}>
              रसीद पर डिजिटल हस्ताक्षर करना अनिवार्य है। यह बिक्री की प्रामाणिकता सुनिश्चित करता है।
              <br/>
              <em>Digital signature on receipt is mandatory. This ensures sale authenticity.</em>
            </p>
          </div>

          <div style={{ marginBottom: '15px', padding: '12px', background: '#F1F8E9', borderRadius: '8px', borderLeft: '4px solid #4CAF50' }}>
            <strong style={{ color: '#2E7D32' }}>✓ खरीदार विवरण | Buyer Details</strong>
            <p style={{ margin: '5px 0 0 0', color: '#555' }}>
              खरीदार का नाम, संपर्क नंबर, गंतव्य और परिवहन विधि की जानकारी सही दर्ज करें।
              <br/>
              <em>Record buyer's name, contact, destination, and transport method correctly.</em>
            </p>
          </div>

          <div style={{ padding: '12px', background: '#FFEBEE', borderRadius: '8px', borderLeft: '4px solid #F44336' }}>
            <strong style={{ color: '#C62828' }}>⚠️ चेतावनी | Warning</strong>
            <p style={{ margin: '5px 0 0 0', color: '#555' }}>
              बिना रसीद के पशु बेचना या गलत जानकारी देना कानूनी कार्यवाही का कारण बन सकता है।
              <br/>
              <em>Selling animals without receipt or providing false information may lead to legal action.</em>
            </p>
          </div>
        </div>
      </div>
        </div>
      </div>

      {/* Support & Contact Section */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        maxWidth: '1200px',
        margin: '30px auto 30px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
      <div style={{ marginBottom: '20px' }}>
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: '10px' }}>
          <circle cx="12" cy="12" r="10" fill="#E3F2FD"/>
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#2196F3"/>
        </svg>
        <h3 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#1e3c72',
          marginBottom: '10px'
        }}>
          सहायता एवं संपर्क | Support & Contact
        </h3>
      </div>
      
      <p style={{
        fontSize: '15px',
        color: '#555',
        lineHeight: '1.8',
        marginBottom: '20px',
        maxWidth: '800px',
        margin: '0 auto 20px'
      }}>
        किसी भी प्रकार की सहायता या जानकारी के लिए अपने district collector office या SPCA office से संपर्क करें।
        <br/>
        <em>For any assistance or information, contact your district collector office or SPCA office.</em>
      </p>
      
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '12px',
        padding: '15px 30px',
        background: 'linear-gradient(135deg, #4CAF50 0%, #2196F3 100%)',
        borderRadius: '12px',
        color: 'white',
        fontSize: '18px',
        fontWeight: '700',
        boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="white"/>
        </svg>
        Emergency Helpline: 1800-XXX-XXXX
        <span style={{ fontSize: '14px', fontWeight: '500' }}>(Toll Free)</span>
      </div>
    </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          h1 {
            font-size: 36px !important;
          }
          
          img[alt="PashuSetu Logo"] {
            width: 100px !important;
            height: 100px !important;
          }
          
          .guidelines-grid {
            grid-template-columns: 1fr !important;
          }
        }
        
        @media (max-width: 480px) {
          h1 {
            font-size: 32px !important;
          }
          
          img[alt="PashuSetu Logo"] {
            width: 80px !important;
            height: 80px !important;
          }
          
          .guidelines-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default Login;
