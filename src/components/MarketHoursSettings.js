import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Header from './Header';

function MarketHoursSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState({
    openTime: '08:00',
    closeTime: '16:00',
    isEnabled: true
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'marketHours'));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data());
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'marketHours'), {
        ...settings,
        updatedAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update market hours / मार्केट समय अपडेट करने में विफल');
    } finally {
      setSaving(false);
    }
  };

  const toggleMarketStatus = async () => {
    setSaving(true);
    try {
      const newSettings = { ...settings, isEnabled: !settings.isEnabled };
      await setDoc(doc(db, 'settings', 'marketHours'), {
        ...newSettings,
        updatedAt: new Date().toISOString()
      });
      setSettings(newSettings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error toggling market status:', error);
      alert('Failed to toggle market status / मार्केट स्थिति बदलने में विफल');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%)' }}>
        <div style={{ textAlign: 'center' }}>
          <img 
            src="/logo.png" 
            alt="Loading..." 
            style={{ width: '80px', height: '80px', animation: 'spin 2s linear infinite' }} 
          />
          <p style={{ color: '#1e3c72', fontSize: '16px', fontWeight: '600', marginTop: '20px' }}>Loading settings...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Market Hours" />

      <div className="container">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z" fill="#1e3c72"/>
              <path d="M12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z" fill="#1e3c72"/>
            </svg>
            <div>
              <h2 style={{ margin: 0, color: '#1e3c72', fontSize: '24px' }}>
                Universal Market Hours / सार्वभौमिक बाजार समय
              </h2>
              <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
                Set operating hours for all markets / सभी बाजारों के लिए संचालन समय निर्धारित करें
              </p>
            </div>
          </div>

          {/* Current Status Banner */}
          <div style={{
            background: settings.isEnabled ? 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' : 'linear-gradient(135deg, #ffebee, #ffcdd2)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '25px',
            border: `3px solid ${settings.isEnabled ? '#4CAF50' : '#f44336'}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '15px'
          }}>
            <div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: '700', 
                color: settings.isEnabled ? '#2e7d32' : '#c62828',
                marginBottom: '5px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {settings.isEnabled ? '🟢 Markets are OPEN' : '🔴 Markets are CLOSED'}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                {settings.isEnabled 
                  ? `Receipt issuance allowed from ${settings.openTime} to ${settings.closeTime}`
                  : 'Receipt issuance is currently disabled for all markets'
                }
              </div>
            </div>
            
            <button
              onClick={toggleMarketStatus}
              disabled={saving}
              style={{
                padding: '12px 24px',
                background: settings.isEnabled ? '#f44336' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '700',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: saving ? 0.6 : 1,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              {settings.isEnabled ? '✗ Disable All Markets' : '✓ Enable All Markets'}
            </button>
          </div>

          {/* Time Settings */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            border: '2px solid #e0e0e0',
            marginBottom: '20px'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              color: '#1e3c72',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 11H7V13H9V11ZM13 11H11V13H13V11ZM17 11H15V13H17V11ZM19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20Z" fill="#1e3c72"/>
              </svg>
              Operating Hours / संचालन समय
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              {/* Opening Time */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#666',
                  marginBottom: '8px'
                }}>
                  🌅 Opening Time / खुलने का समय
                </label>
                <input
                  type="time"
                  value={settings.openTime}
                  onChange={(e) => setSettings({ ...settings, openTime: e.target.value })}
                  disabled={!settings.isEnabled}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '18px',
                    fontWeight: '700',
                    outline: 'none',
                    cursor: !settings.isEnabled ? 'not-allowed' : 'pointer',
                    opacity: !settings.isEnabled ? 0.5 : 1,
                    background: !settings.isEnabled ? '#f5f5f5' : 'white'
                  }}
                />
              </div>

              {/* Closing Time */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#666',
                  marginBottom: '8px'
                }}>
                  🌆 Closing Time / बंद होने का समय
                </label>
                <input
                  type="time"
                  value={settings.closeTime}
                  onChange={(e) => setSettings({ ...settings, closeTime: e.target.value })}
                  disabled={!settings.isEnabled}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '18px',
                    fontWeight: '700',
                    outline: 'none',
                    cursor: !settings.isEnabled ? 'not-allowed' : 'pointer',
                    opacity: !settings.isEnabled ? 0.5 : 1,
                    background: !settings.isEnabled ? '#f5f5f5' : 'white'
                  }}
                />
              </div>
            </div>

            {/* Save Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '25px' }}>
              {success && (
                <span style={{
                  padding: '12px 20px',
                  background: '#e8f5e9',
                  color: '#2e7d32',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ✓ Saved Successfully / सफलतापूर्वक सहेजा गया
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !settings.isEnabled}
                style={{
                  padding: '12px 28px',
                  background: saving ? '#ccc' : 'linear-gradient(135deg, #2196F3, #1976D2)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: (saving || !settings.isEnabled) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: saving ? 'none' : '0 4px 12px rgba(33, 150, 243, 0.3)'
                }}
              >
                {saving ? (
                  <>
                    <img 
                      src="/logo.png" 
                      alt="Saving..." 
                      style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} 
                    />
                    Saving... / सहेजा जा रहा है...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V7L17 3ZM19 19H5V5H16.17L19 7.83V19ZM12 12C10.34 12 9 13.34 9 15C9 16.66 10.34 18 12 18C13.66 18 15 16.66 15 15C15 13.34 13.66 12 12 12ZM6 6H15V10H6V6Z" fill="white"/>
                    </svg>
                    Save Hours / समय सहेजें
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Info Card */}
          <div style={{
            background: 'linear-gradient(135deg, #E3F2FD, #F1F8E9)',
            borderRadius: '12px',
            padding: '20px',
            border: '2px solid #2196F3'
          }}>
            <h3 style={{ 
              margin: '0 0 12px 0', 
              color: '#1e3c72',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V11H13V17ZM13 9H11V7H13V9Z" fill="#2196F3"/>
              </svg>
              Important Information / महत्वपूर्ण जानकारी
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#555', fontSize: '14px', lineHeight: '1.8' }}>
              <li><strong>Universal Settings:</strong> These hours apply to ALL markets in the system</li>
              <li><strong>Receipt Issuance:</strong> Market admins can only create receipts during operating hours</li>
              <li><strong>Disable Feature:</strong> Use the disable button to stop all receipt creation immediately</li>
              <li><strong>Changes Take Effect:</strong> Immediately after saving</li>
              <li><strong>Default Hours:</strong> 8:00 AM to 4:00 PM (24-hour format)</li>
              <li><strong>सार्वभौमिक सेटिंग्स:</strong> ये समय सिस्टम के सभी बाजारों पर लागू होते हैं</li>
              <li><strong>रसीद जारी करना:</strong> मार्केट एडमिन केवल संचालन समय के दौरान रसीद बना सकते हैं</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketHoursSettings;
