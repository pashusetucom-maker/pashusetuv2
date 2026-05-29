import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function VerifyReceiptInput() {
  const [receiptId, setReceiptId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!receiptId.trim()) {
      setError('कृपया रसीद नंबर दर्ज करें / Please enter receipt number');
      return;
    }

    // Navigate to verify page with receipt ID
    navigate(`/verify/${receiptId.trim()}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%)'
    }}>
      {/* Header with Large Logo */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <img 
          src="/logo.png" 
          alt="PashuSetu Logo" 
          style={{ 
            width: '120px', 
            height: '120px',
            marginBottom: '20px',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))'
          }} 
        />
        
        <h1 style={{
          fontSize: '42px',
          fontWeight: '800',
          marginBottom: '8px',
          letterSpacing: '-0.5px'
        }}>
          <span style={{ color: '#2196F3' }}>Pashu</span>
          <span style={{ color: '#4CAF50' }}>Setu</span>
        </h1>
        
        <p style={{
          color: '#1e3c72',
          fontSize: '16px',
          fontWeight: '600',
          marginBottom: '4px'
        }}>
          पशु बाजार डिजिटल रसीद प्रणाली
        </p>
        <p style={{
          color: '#555',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Livestock Market Digital Receipt System
        </p>
      </div>

      {/* Main Card */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '35px',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 15px 50px rgba(0,0,0,0.12)'
      }}>
        {/* Title Section */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #4CAF50 0%, #2196F3 100%)',
            marginBottom: '15px',
            boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white" strokeWidth="1.5"/>
            </svg>
          </div>
          
          <h2 style={{
            fontSize: '24px',
            color: '#1e3c72',
            marginBottom: '6px',
            fontWeight: '700'
          }}>
            Verify Receipt
          </h2>
          <p style={{
            color: '#666',
            fontSize: '15px',
            fontWeight: '600'
          }}>
            रसीद सत्यापित करें
          </p>
        </div>

        {/* Info Box */}
        <div style={{
          background: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%)',
          border: '2px solid #4CAF50',
          borderRadius: '10px',
          padding: '15px',
          marginBottom: '22px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, marginTop: '2px' }}>
            <circle cx="12" cy="12" r="10" fill="#4CAF50"/>
            <path d="M12 6v6m0 4h.01" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <div style={{ fontSize: '13px', color: '#1e3c72', lineHeight: '1.5' }}>
            <strong style={{ fontSize: '14px', display: 'block', marginBottom: '4px' }}>
              📋 रसीद आईडी दर्ज करें
            </strong>
            <div style={{ color: '#555', fontSize: '12px' }}>
              Format: <strong>PS123456</strong> • रसीद पर छपी ID दर्ज करें
            </div>
          </div>
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

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '22px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#1e3c72',
              fontSize: '14px',
              fontWeight: '700'
            }}>
              Receipt ID / रसीद नंबर *
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="#4CAF50"/>
                </svg>
              </div>
              <input
                type="text"
                value={receiptId}
                onChange={(e) => setReceiptId(e.target.value.toUpperCase())}
                placeholder="रसीद नंबर दर्ज करें (जैसे: PS123456)"
                required
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 46px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  fontSize: '15px',
                  transition: 'all 0.3s',
                  outline: 'none',
                  boxSizing: 'border-box',
                  textTransform: 'uppercase',
                  fontWeight: '600',
                  letterSpacing: '0.5px'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4CAF50';
                  e.target.style.boxShadow = '0 0 0 3px rgba(76, 175, 80, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e0e0e0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '14px' }}>💡</span>
              <span>रसीद पर छपी ID नंबर यहाँ दर्ज करें</span>
            </p>
          </div>

          {/* Verify Button */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #4CAF50 0%, #2196F3 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: '0 6px 20px rgba(76, 175, 80, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 8px 25px rgba(76, 175, 80, 0.45)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.35)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white" strokeWidth="1"/>
            </svg>
            Verify Receipt / सत्यापित करें
          </button>
        </form>

        {/* Footer Links */}
        <div style={{
          marginTop: '25px',
          paddingTop: '20px',
          borderTop: '2px solid #f0f0f0',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <Link
            to="/login"
            style={{
              color: 'white',
              background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '11px 20px',
              borderRadius: '8px',
              transition: 'all 0.3s',
              boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 16px rgba(33, 150, 243, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.3)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="white"/>
            </svg>
            Back to Login / लॉगिन पर वापस जाएं
          </Link>
        </div>
      </div>

      {/* Responsive Styles */}
      <style>{`
        @media (max-width: 768px) {
          h1 {
            font-size: 36px !important;
          }
          
          img[alt="PashuSetu Logo"] {
            width: 90px !important;
            height: 90px !important;
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
          
          .verify-container {
            padding: 30px 20px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default VerifyReceiptInput;
