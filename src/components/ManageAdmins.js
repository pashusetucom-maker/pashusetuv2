import React, { useState, useEffect } from 'react';
import { getAllUsers, deleteUser, blockUser, suspendUser, activateUser } from '../firebase/firestoreService';
import Header from './Header';

function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoading, setActionLoading] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && !event.target.closest('button')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdown]);

  const fetchAdmins = async () => {
    try {
      const users = await getAllUsers();
      // Filter only market admins
      const marketAdmins = users.filter(user => user.role === 'market-admin');
      setAdmins(marketAdmins);
    } catch (error) {
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId, action, adminName) => {
    const confirmMessage = {
      delete: `क्या आप ${adminName} को delete करना चाहते हैं?\nAre you sure you want to delete ${adminName}?`,
      block: `क्या आप ${adminName} को block करना चाहते हैं?\nAre you sure you want to block ${adminName}?`,
      suspend: `क्या आप ${adminName} को suspend करना चाहते हैं?\nAre you sure you want to suspend ${adminName}?`,
      activate: `क्या आप ${adminName} को activate करना चाहते हैं?\nAre you sure you want to activate ${adminName}?`
    };

    if (!window.confirm(confirmMessage[action])) {
      return;
    }

    setActionLoading(userId);
    try {
      switch (action) {
        case 'delete':
          await deleteUser(userId);
          break;
        case 'block':
          await blockUser(userId);
          break;
        case 'suspend':
          await suspendUser(userId);
          break;
        case 'activate':
          await activateUser(userId);
          break;
        default:
          break;
      }
      
      // Refresh admin list
      await fetchAdmins();
      alert(`Admin ${action}d successfully! / Admin सफलतापूर्वक ${action} किया गया!`);
    } catch (error) {
      console.error(`Error ${action}ing admin:`, error);
      alert(`Failed to ${action} admin. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { text: 'Active', color: '#4CAF50', bg: '#e8f5e9', icon: '✓', animation: 'pulse' },
      blocked: { text: 'Blocked', color: '#f44336', bg: '#ffebee', icon: '🚫', animation: 'shake' },
      suspended: { text: 'Suspended', color: '#ff9800', bg: '#fff3e0', icon: '⏸', animation: 'fade' },
      deleted: { text: 'Deleted', color: '#9e9e9e', bg: '#f5f5f5', icon: '🗑', animation: 'none' }
    };
    
    const badge = badges[status] || badges.active;
    
    return (
      <span 
        className={`status-badge status-${badge.animation}`}
        style={{
          padding: '6px 14px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          color: badge.color,
          backgroundColor: badge.bg,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          border: `1px solid ${badge.color}40`
        }}
      >
        <span style={{ fontSize: '14px' }}>{badge.icon}</span>
        {badge.text}
      </span>
    );
  };

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = 
      admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.marketName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.marketId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || admin.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '20px' }}>
            <img 
              src="/logo.png" 
              alt="Loading..." 
              style={{ 
                width: '80px', 
                height: '80px',
                animation: 'spin 2s linear infinite'
              }} 
            />
          </div>
          <p style={{ color: '#1e3c72', fontSize: '16px', fontWeight: '600' }}>Loading admins...</p>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Manage Market Admins" />

      <div className="container">
        <div className="card">
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#1e3c72', margin: 0 }}>
                All Market Admins ({filteredAdmins.length})
              </h2>
            </div>
            
            {/* Search and Filter */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input
                  type="text"
                  placeholder="Search by name, email, market name, or market ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ fontSize: '15px' }}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">All Status</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                  <option value="suspended">Suspended</option>
                  <option value="deleted">Deleted</option>
                </select>
              </div>
            </div>
          </div>

          {filteredAdmins.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
              No admins found
            </p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Admin ID</th>
                    <th>Market Name</th>
                    <th>Market ID</th>
                    <th>Current Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmins.map(admin => (
                    <tr key={admin.id}>
                      <td><strong>{admin.name || 'N/A'}</strong></td>
                      <td>{admin.email}</td>
                      <td><strong style={{ letterSpacing: '0.5px' }}>{admin.adminId || 'N/A'}</strong></td>
                      <td>{admin.marketName || 'N/A'}</td>
                      <td><strong>{admin.marketId || 'N/A'}</strong></td>
                      <td>{getStatusBadge(admin.status || 'active')}</td>
                      <td>
                        <div style={{ position: 'relative' }}>
                          {/* Three Dot Menu Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(openDropdown === admin.id ? null : admin.id);
                            }}
                            disabled={actionLoading === admin.id}
                            style={{
                              background: 'transparent',
                              border: '2px solid #e0e0e0',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              cursor: 'pointer',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              color: '#666',
                              transition: 'all 0.3s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.borderColor = '#2196F3';
                              e.target.style.color = '#2196F3';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.borderColor = '#e0e0e0';
                              e.target.style.color = '#666';
                            }}
                          >
                            {actionLoading === admin.id ? (
                              <img 
                                src="/logo.png" 
                                alt="Loading..." 
                                style={{ 
                                  width: '18px', 
                                  height: '18px',
                                  animation: 'spin 1s linear infinite'
                                }} 
                              />
                            ) : '⋮'}
                          </button>

                          {/* Dropdown Menu with Overlay */}
                          {openDropdown === admin.id && (
                            <>
                              {/* Backdrop Overlay */}
                              <div 
                                style={{
                                  position: 'fixed',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  background: 'rgba(0, 0, 0, 0.3)',
                                  zIndex: 999,
                                  animation: 'fadeIn 0.2s ease'
                                }}
                                onClick={() => setOpenDropdown(null)}
                              />
                              
                              {/* Dropdown Menu */}
                              <div style={{
                                position: 'fixed',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                background: 'white',
                                border: '2px solid #e0e0e0',
                                borderRadius: '12px',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                                zIndex: 1000,
                                minWidth: '200px',
                                overflow: 'hidden',
                                animation: 'scaleIn 0.2s ease'
                              }}>
                                {/* Header */}
                                <div style={{
                                  padding: '12px 15px',
                                  background: 'linear-gradient(135deg, #2196F3 0%, #4CAF50 100%)',
                                  color: 'white',
                                  fontWeight: '700',
                                  fontSize: '14px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  <span>Actions / कार्यवाही</span>
                                  <button
                                    onClick={() => setOpenDropdown(null)}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      color: 'white',
                                      fontSize: '20px',
                                      cursor: 'pointer',
                                      padding: '0',
                                      lineHeight: '1'
                                    }}
                                  >
                                    ×
                                  </button>
                                </div>

                                {/* Menu Items */}
                                <div style={{ padding: '8px 0' }}>
                                  {admin.status !== 'active' && (
                                    <button
                                      onClick={() => {
                                        handleAction(admin.id, 'activate', admin.name);
                                        setOpenDropdown(null);
                                      }}
                                      disabled={actionLoading === admin.id}
                                      style={{
                                        width: '100%',
                                        padding: '12px 15px',
                                        border: 'none',
                                        background: 'white',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#4CAF50',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        transition: 'background 0.2s'
                                      }}
                                      onMouseEnter={(e) => e.target.style.background = '#e8f5e9'}
                                      onMouseLeave={(e) => e.target.style.background = 'white'}
                                    >
                                      <span style={{ fontSize: '16px' }}>✓</span> 
                                      <span>Activate / सक्रिय करें</span>
                                    </button>
                                  )}
                                  
                                  {admin.status === 'active' && (
                                    <>
                                      <button
                                        onClick={() => {
                                          handleAction(admin.id, 'block', admin.name);
                                          setOpenDropdown(null);
                                        }}
                                        disabled={actionLoading === admin.id}
                                        style={{
                                          width: '100%',
                                          padding: '12px 15px',
                                          border: 'none',
                                          background: 'white',
                                          textAlign: 'left',
                                          cursor: 'pointer',
                                          fontSize: '14px',
                                          fontWeight: '600',
                                          color: '#f44336',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '10px',
                                          transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = '#ffebee'}
                                        onMouseLeave={(e) => e.target.style.background = 'white'}
                                      >
                                        <span style={{ fontSize: '16px' }}>🚫</span> 
                                        <span>Block / ब्लॉक करें</span>
                                      </button>
                                      
                                      <button
                                        onClick={() => {
                                          handleAction(admin.id, 'suspend', admin.name);
                                          setOpenDropdown(null);
                                        }}
                                        disabled={actionLoading === admin.id}
                                        style={{
                                          width: '100%',
                                          padding: '12px 15px',
                                          border: 'none',
                                          background: 'white',
                                          textAlign: 'left',
                                          cursor: 'pointer',
                                          fontSize: '14px',
                                          fontWeight: '600',
                                          color: '#ff9800',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '10px',
                                          transition: 'background 0.2s',
                                          borderTop: '1px solid #f0f0f0'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = '#fff3e0'}
                                        onMouseLeave={(e) => e.target.style.background = 'white'}
                                      >
                                        <span style={{ fontSize: '16px' }}>⏸</span> 
                                        <span>Suspend / निलंबित करें</span>
                                      </button>
                                    </>
                                  )}
                                  
                                  {admin.status !== 'deleted' && (
                                    <button
                                      onClick={() => {
                                        handleAction(admin.id, 'delete', admin.name);
                                        setOpenDropdown(null);
                                      }}
                                      disabled={actionLoading === admin.id}
                                      style={{
                                        width: '100%',
                                        padding: '12px 15px',
                                        border: 'none',
                                        background: 'white',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#9e9e9e',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        transition: 'background 0.2s',
                                        borderTop: '1px solid #f0f0f0'
                                      }}
                                      onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                                      onMouseLeave={(e) => e.target.style.background = 'white'}
                                    >
                                      <span style={{ fontSize: '16px' }}>🗑</span> 
                                      <span>Delete / हटाएं</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Status Legend */}
        <div className="card status-legend" style={{ marginTop: '20px' }}>
          <h3 style={{ color: '#1e3c72', marginBottom: '15px', fontSize: '18px' }}>Status Information / स्थिति जानकारी</h3>
          <div className="status-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div style={{ padding: '15px', background: '#e8f5e9', borderRadius: '8px' }}>
              <strong style={{ color: '#4CAF50', fontSize: '15px' }}>✓ Active</strong>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '5px', marginBottom: '0' }}>
                Admin can login and create receipts
              </p>
            </div>
            
            <div style={{ padding: '15px', background: '#ffebee', borderRadius: '8px' }}>
              <strong style={{ color: '#f44336', fontSize: '15px' }}>🚫 Blocked</strong>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '5px', marginBottom: '0' }}>
                Admin cannot login (permanent)
              </p>
            </div>
            
            <div style={{ padding: '15px', background: '#fff3e0', borderRadius: '8px' }}>
              <strong style={{ color: '#ff9800', fontSize: '15px' }}>⏸ Suspended</strong>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '5px', marginBottom: '0' }}>
                Admin cannot login (temporary)
              </p>
            </div>
            
            <div style={{ padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
              <strong style={{ color: '#9e9e9e', fontSize: '15px' }}>🗑 Deleted</strong>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '5px', marginBottom: '0' }}>
                Admin marked as deleted
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Badge Animations */}
      <style>{`
        .status-badge {
          transition: all 0.3s ease;
        }

        .status-badge:hover {
          transform: scale(1.05);
        }

        /* Active Status - Pulse Animation */
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }

        .status-pulse {
          animation: pulse 2s ease-in-out infinite;
        }

        /* Blocked Status - Shake Animation */
        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-2px);
          }
          75% {
            transform: translateX(2px);
          }
        }

        .status-shake:hover {
          animation: shake 0.5s ease-in-out;
        }

        /* Suspended Status - Fade Animation */
        @keyframes fade {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .status-fade {
          animation: fade 2.5s ease-in-out infinite;
        }

        /* Deleted Status - No Animation */
        .status-none {
          opacity: 0.7;
        }

        /* Overlay Animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        /* Mobile Responsive Styles */
        @media (max-width: 768px) {
          .status-legend h3 {
            font-size: 16px !important;
            margin-bottom: 12px !important;
          }

          .status-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }

          .status-grid > div {
            padding: 10px 12px !important;
          }

          .status-grid strong {
            font-size: 14px !important;
            display: block;
            margin-bottom: 4px;
          }

          .status-grid p {
            font-size: 12px !important;
            margin-top: 4px !important;
            line-height: 1.4;
          }
        }

        @media (max-width: 480px) {
          .status-legend {
            padding: 15px !important;
          }

          .status-legend h3 {
            font-size: 15px !important;
            margin-bottom: 10px !important;
          }

          .status-grid {
            gap: 8px !important;
          }

          .status-grid > div {
            padding: 8px 10px !important;
            border-radius: 6px !important;
          }

          .status-grid strong {
            font-size: 13px !important;
          }

          .status-grid p {
            font-size: 11px !important;
            margin-top: 3px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default ManageAdmins;
