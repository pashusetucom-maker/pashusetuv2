import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Header({ title, showBackButton = false, backLink = '/' }) {
  const { user, logout } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'blocked': return '#f44336';
      case 'suspended': return '#ff9800';
      default: return '#666';
    }
  };

  return (
    <header style={{
      background: 'white',
      borderBottom: '1px solid #e0e0e0',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '8px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '15px'
      }}>
        {/* Left Section: Logo + Title */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: '0 0 auto'
        }}>
          {/* Logo */}
          <img 
            src="/logo.png" 
            alt="PashuSetu" 
            style={{ 
              height: '48px',
              width: 'auto'
            }} 
          />
          
          {/* Title & Tagline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <h1 style={{
              fontSize: '18px',
              fontWeight: '700',
              margin: 0,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ color: '#2196F3' }}>Pashu</span>
              <span style={{ color: '#4CAF50' }}>Setu</span>
            </h1>
            {title && (
              <p style={{
                fontSize: '12px',
                color: '#666',
                margin: 0,
                lineHeight: 1,
                fontWeight: '600'
              }}>
                {title}
              </p>
            )}
            <p style={{
              fontSize: '9px',
              color: '#999',
              margin: 0,
              lineHeight: 1,
              display: window.innerWidth > 768 ? 'block' : 'none'
            }}>
              पशु बाजार डिजिटल रसीद प्रणाली
            </p>
          </div>
        </div>

        {/* Right Section: User Info + Actions */}
        {user && (
          <>
            {/* Desktop View */}
            <div style={{
              display: window.innerWidth > 768 ? 'flex' : 'none',
              alignItems: 'center',
              gap: '15px'
            }}>
              {/* Dashboard Button */}
              <Link
                to={user.role === 'super-admin' ? '/super-admin' : '/market-admin'}
                style={{
                  padding: '8px',
                  background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  boxShadow: '0 2px 6px rgba(33, 150, 243, 0.3)',
                  width: '36px',
                  height: '36px'
                }}
                title="Dashboard"
                onMouseEnter={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #1976D2, #1565C0)';
                  e.target.style.boxShadow = '0 4px 10px rgba(33, 150, 243, 0.4)';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'linear-gradient(135deg, #2196F3, #1976D2)';
                  e.target.style.boxShadow = '0 2px 6px rgba(33, 150, 243, 0.3)';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="white"/>
                </svg>
              </Link>

              {/* User Info */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 12px',
                background: '#f5f5f5',
                borderRadius: '20px',
                border: '1px solid #e0e0e0'
              }}>
                {/* Avatar */}
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2196F3, #4CAF50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '700'
                }}>
                  {user.email?.charAt(0).toUpperCase()}
                </div>
                
                {/* User Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#333',
                    lineHeight: 1
                  }}>
                    {user.email?.split('@')[0]}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: '#666',
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {user.role === 'super-admin' ? (
                      <span style={{ color: '#2196F3', fontWeight: '600' }}>Super Admin</span>
                    ) : (
                      <>
                        <span>{user.marketName || 'Market Admin'}</span>
                        {user.status && (
                          <>
                            <span style={{ color: '#ccc' }}>•</span>
                            <span style={{
                              color: getStatusColor(user.status),
                              fontWeight: '600',
                              textTransform: 'capitalize'
                            }}>
                              {user.status}
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                style={{
                  padding: '6px 16px',
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#666',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f44336';
                  e.target.style.color = 'white';
                  e.target.style.borderColor = '#f44336';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = '#666';
                  e.target.style.borderColor = '#e0e0e0';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="currentColor"/>
                </svg>
                Logout
              </button>
            </div>

            {/* Mobile View - Dashboard + Hamburger */}
            <div style={{
              display: window.innerWidth <= 768 ? 'flex' : 'none',
              alignItems: 'center',
              gap: '10px'
            }}>
              {/* Dashboard Button Mobile */}
              <Link
                to={user.role === 'super-admin' ? '/super-admin' : '/market-admin'}
                style={{
                  padding: '8px',
                  background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  boxShadow: '0 2px 6px rgba(33, 150, 243, 0.3)',
                  width: '36px',
                  height: '36px'
                }}
                title="Dashboard"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="white"/>
                </svg>
              </Link>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" fill="#666"/>
                </svg>
              </button>
            </div>
          </>
        )}

        {/* Back Button for non-authenticated pages */}
        {!user && showBackButton && (
          <Link
            to={backLink}
            style={{
              padding: '6px 16px',
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#666',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/>
            </svg>
            Back
          </Link>
        )}
      </div>

      {/* Mobile Dropdown Menu */}
      {user && showMobileMenu && (
        <div style={{
          display: window.innerWidth <= 768 ? 'block' : 'none',
          background: 'white',
          borderTop: '1px solid #e0e0e0',
          padding: '12px 20px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          {/* User Info Mobile */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px',
            background: '#f5f5f5',
            borderRadius: '8px',
            marginBottom: '10px'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2196F3, #4CAF50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
              fontWeight: '700'
            }}>
              {user.email?.charAt(0).toUpperCase()}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#333',
                marginBottom: '3px'
              }}>
                {user.email}
              </div>
              <div style={{
                fontSize: '11px',
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {user.role === 'super-admin' ? (
                  <span style={{ color: '#2196F3', fontWeight: '600' }}>Super Admin</span>
                ) : (
                  <>
                    <span>{user.marketName || 'Market Admin'}</span>
                    {user.status && (
                      <>
                        <span style={{ color: '#ccc' }}>•</span>
                        <span style={{
                          color: getStatusColor(user.status),
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}>
                          {user.status}
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Logout Button Mobile */}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px',
              background: '#f44336',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" fill="white"/>
            </svg>
            Logout
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;
