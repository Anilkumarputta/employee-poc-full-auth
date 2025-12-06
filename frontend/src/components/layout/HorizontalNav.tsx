import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/authContext';
import { graphqlRequest } from '../../lib/graphqlClient';
import { NotificationBell } from '../NotificationBell';

type AppPage = "employees" | "dashboard" | "notifications" | "reports" | "profile" | "preferences" | "settings" | "admins" | "accessLogs" | "sendNote" | "leaveRequests" | "profileEdit" | "employeeLogins" | "messages" | "review-requests" | "threads";

type Props = {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
};

const UNREAD_MESSAGE_COUNT_QUERY = `
  query GetUnreadMessageCount {
    messageStats {
      unread
    }
  }
`;

export const HorizontalNav: React.FC<Props> = ({ currentPage, onNavigate, onLogout }) => {
  const { user, accessToken } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  
  const isDirector = user?.role === 'director';
  const isManager = user?.role === 'manager';
  const isManagerOrAbove = isDirector || isManager;
  const isEmployee = user?.role === 'employee';

  const getPortalTitle = () => {
    if (isDirector) return '🏢 Director Portal';
    if (isManager) return '👔 Manager Portal';
    return '👤 Employee Portal';
  };

  // Poll for unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!accessToken) return;
      
      try {
        const data = await graphqlRequest<{ messageStats: { unread: number } }>(
          UNREAD_MESSAGE_COUNT_QUERY,
          {},
          accessToken
        );
        setUnreadMessageCount(data.messageStats.unread);
      } catch (error) {
        console.error('Error fetching unread message count:', error);
      }
    };

    fetchUnreadCount(); // Initial fetch
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [accessToken]);

  return (
    <>
      {/* Top Horizontal Menu */}
      <div className="horizontal-nav-container" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div className="horizontal-nav-inner" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 30px',
          height: '70px'
        }}>
          {/* Left: Hamburger + Logo */}
          <div className="horizontal-nav-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="hamburger-btn"
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '8px',
                width: '45px',
                height: '45px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '24px',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              ☰
            </button>
            
            <div className="horizontal-nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div className="logo-icon" style={{
                width: '45px',
                height: '45px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                👥
              </div>
              <div className="logo-text">
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>Employee POC</div>
                <div className="portal-subtitle" style={{ fontSize: '12px', opacity: 0.9 }}>{getPortalTitle()}</div>
              </div>
            </div>
          </div>

          {/* Center: Main Navigation */}
          <div className="horizontal-nav-center" style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={() => onNavigate('dashboard')}
              style={{
                background: currentPage === 'dashboard' ? 'rgba(255,255,255,0.3)' : 'transparent',
                border: 'none',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 'dashboard') e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 'dashboard') e.currentTarget.style.background = 'transparent';
              }}
            >
              📊 Dashboard
            </button>

            <button
              onClick={() => onNavigate('employees')}
              style={{
                background: currentPage === 'employees' ? 'rgba(255,255,255,0.3)' : 'transparent',
                border: 'none',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 'employees') e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 'employees') e.currentTarget.style.background = 'transparent';
              }}
            >
              {isManagerOrAbove ? '👥 Employees' : '👥 Team'}
            </button>

            {isManagerOrAbove && (
              <button
                onClick={() => onNavigate('reports')}
                style={{
                  background: currentPage === 'reports' ? 'rgba(255,255,255,0.3)' : 'transparent',
                  border: 'none',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 'reports') e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 'reports') e.currentTarget.style.background = 'transparent';
                }}
              >
                📄 Reports
              </button>
            )}

            <button
              onClick={() => onNavigate('settings')}
              style={{
                background: currentPage === 'settings' ? 'rgba(255,255,255,0.3)' : 'transparent',
                border: 'none',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 'settings') e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              }}
              onMouseLeave={(e) => {
                if (currentPage !== 'settings') e.currentTarget.style.background = 'transparent';
              }}
            >
              ⚙️ Settings
            </button>
          </div>

          {/* Right: User Profile + Logout */}
          <div className="horizontal-nav-right" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div className="user-email-badge" style={{ 
              background: 'rgba(255,255,255,0.2)', 
              padding: '10px 20px', 
              borderRadius: '25px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              position: 'relative'
            }}>
              <span className="email-text">{user?.email}</span>
              {unreadMessageCount > 0 && (
                <span style={{
                  background: '#e74c3c',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 6px rgba(231, 76, 60, 0.4)',
                  animation: 'pulse 2s infinite'
                }}>
                  {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                </span>
              )}
            </div>
            
            {/* Notification Bell */}
            <NotificationBell onNavigate={onNavigate} />
            
            <button
              onClick={onLogout}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1100,
            animation: 'fadeIn 0.3s'
          }}
        />
      )}

      {/* Drawer */}
      <div className="drawer-mobile" style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: '320px',
        background: 'white',
        boxShadow: '4px 0 20px rgba(0,0,0,0.2)',
        transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
        zIndex: 1200,
        overflowY: 'auto'
      }}>
        <div style={{ padding: '30px' }}>
          {/* Drawer Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '30px',
            paddingBottom: '20px',
            borderBottom: '2px solid #e3e8ef'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }}>
              Navigation
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#7f8c8d'
              }}
            >
              ✕
            </button>
          </div>

          {/* Main Section */}
          <div style={{ marginBottom: '25px' }}>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: '700', 
              color: '#7f8c8d', 
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Main
            </div>
            
            <button
              onClick={() => { onNavigate('dashboard'); setDrawerOpen(false); }}
              style={{
                width: '100%',
                background: currentPage === 'dashboard' ? '#f0f4ff' : 'transparent',
                border: 'none',
                color: currentPage === 'dashboard' ? '#667eea' : '#2c3e50',
                padding: '14px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                textAlign: 'left',
                marginBottom: '8px',
                transition: 'all 0.3s'
              }}
            >
              📊 Dashboard
            </button>

            <button
              onClick={() => { onNavigate('employees'); setDrawerOpen(false); }}
              style={{
                width: '100%',
                background: currentPage === 'employees' ? '#f0f4ff' : 'transparent',
                border: 'none',
                color: currentPage === 'employees' ? '#667eea' : '#2c3e50',
                padding: '14px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                textAlign: 'left',
                marginBottom: '8px',
                transition: 'all 0.3s'
              }}
            >
              👥 {isManagerOrAbove ? 'Manage Employees' : 'Team'}
            </button>

            <button
              onClick={() => { onNavigate('notifications'); setDrawerOpen(false); }}
              style={{
                width: '100%',
                background: currentPage === 'notifications' ? '#f0f4ff' : 'transparent',
                border: 'none',
                color: currentPage === 'notifications' ? '#667eea' : '#2c3e50',
                padding: '14px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                textAlign: 'left',
                marginBottom: '8px',
                transition: 'all 0.3s'
              }}
            >
              🔔 Notifications
            </button>

            {isManagerOrAbove && (
              <button
                onClick={() => { onNavigate('reports'); setDrawerOpen(false); }}
                style={{
                  width: '100%',
                  background: currentPage === 'reports' ? '#f0f4ff' : 'transparent',
                  border: 'none',
                  color: currentPage === 'reports' ? '#667eea' : '#2c3e50',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  textAlign: 'left',
                  marginBottom: '8px',
                  transition: 'all 0.3s'
                }}
              >
                📄 Reports
              </button>
            )}
          </div>

          {/* Actions Section */}
          <div style={{ marginBottom: '25px' }}>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: '700', 
              color: '#7f8c8d', 
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Actions
            </div>
            
            <button
              onClick={() => { onNavigate('messages'); setDrawerOpen(false); }}
              style={{
                width: '100%',
                background: currentPage === 'messages' ? '#f0f4ff' : 'transparent',
                border: 'none',
                color: currentPage === 'messages' ? '#667eea' : '#2c3e50',
                padding: '14px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                textAlign: 'left',
                marginBottom: '8px',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>💬 Messages</span>
              {unreadMessageCount > 0 && (
                <span style={{
                  background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '3px 9px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 8px rgba(231, 76, 60, 0.3)'
                }}>
                  {unreadMessageCount}
                </span>
              )}
            </button>
            
            {isManagerOrAbove && (
              <button
                onClick={() => { onNavigate('sendNote'); setDrawerOpen(false); }}
                style={{
                  width: '100%',
                  background: currentPage === 'sendNote' ? '#f0f4ff' : 'transparent',
                  border: 'none',
                  color: currentPage === 'sendNote' ? '#667eea' : '#2c3e50',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  textAlign: 'left',
                  marginBottom: '8px',
                  transition: 'all 0.3s'
                }}
              >
                📝 Send Note
              </button>
            )}

            <button
              onClick={() => { onNavigate('leaveRequests'); setDrawerOpen(false); }}
              style={{
                width: '100%',
                background: currentPage === 'leaveRequests' ? '#f0f4ff' : 'transparent',
                border: 'none',
                color: currentPage === 'leaveRequests' ? '#667eea' : '#2c3e50',
                padding: '14px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                textAlign: 'left',
                marginBottom: '8px',
                transition: 'all 0.3s'
              }}
            >
              📝 {isManagerOrAbove ? 'Leave Requests' : 'My Leave'}
            </button>
          </div>

          {/* Administration Section */}
          {isManagerOrAbove && (
            <div style={{ marginBottom: '25px' }}>
              <div style={{ 
                fontSize: '12px', 
                fontWeight: '700', 
                color: '#7f8c8d', 
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Administration
              </div>

              {isDirector && (
                <>
                  <button
                    onClick={() => { onNavigate('review-requests'); setDrawerOpen(false); }}
                    style={{
                      width: '100%',
                      background: currentPage === 'review-requests' ? '#f0f4ff' : 'transparent',
                      border: 'none',
                      color: currentPage === 'review-requests' ? '#667eea' : '#2c3e50',
                      padding: '14px 16px 14px 28px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      textAlign: 'left',
                      marginBottom: '8px',
                      transition: 'all 0.3s'
                    }}
                  >
                    ✅ Review Requests
                  </button>

                  <button
                    onClick={() => { onNavigate('admins'); setDrawerOpen(false); }}
                    style={{
                      width: '100%',
                      background: currentPage === 'admins' ? '#f0f4ff' : 'transparent',
                      border: 'none',
                      color: currentPage === 'admins' ? '#667eea' : '#2c3e50',
                      padding: '14px 16px 14px 28px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      textAlign: 'left',
                      marginBottom: '8px',
                      transition: 'all 0.3s'
                    }}
                  >
                    👤 Users Management
                  </button>

                  <button
                    onClick={() => { onNavigate('accessLogs'); setDrawerOpen(false); }}
                    style={{
                      width: '100%',
                      background: currentPage === 'accessLogs' ? '#f0f4ff' : 'transparent',
                      border: 'none',
                      color: currentPage === 'accessLogs' ? '#667eea' : '#2c3e50',
                      padding: '14px 16px 14px 28px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      textAlign: 'left',
                      marginBottom: '8px',
                      transition: 'all 0.3s'
                    }}
                  >
                    📝 Access Logs
                  </button>

                  <button
                    onClick={() => { onNavigate('employeeLogins'); setDrawerOpen(false); }}
                    style={{
                      width: '100%',
                      background: currentPage === 'employeeLogins' ? '#f0f4ff' : 'transparent',
                      border: 'none',
                      color: currentPage === 'employeeLogins' ? '#667eea' : '#2c3e50',
                      padding: '14px 16px 14px 28px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      textAlign: 'left',
                      marginBottom: '8px',
                      transition: 'all 0.3s'
                    }}
                  >
                    🔑 Employee Logins
                  </button>
                </>
              )}
            </div>
          )}

          {/* Settings Section */}
          <div>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: '700', 
              color: '#7f8c8d', 
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Settings
            </div>

            <button
              onClick={() => { onNavigate('profile'); setDrawerOpen(false); }}
              style={{
                width: '100%',
                background: currentPage === 'profile' ? '#f0f4ff' : 'transparent',
                border: 'none',
                color: currentPage === 'profile' ? '#667eea' : '#2c3e50',
                padding: '14px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                textAlign: 'left',
                marginBottom: '8px',
                transition: 'all 0.3s'
              }}
            >
              👤 Profile
            </button>

            <button
              onClick={() => { onNavigate('profileEdit'); setDrawerOpen(false); }}
              style={{
                width: '100%',
                background: currentPage === 'profileEdit' ? '#f0f4ff' : 'transparent',
                border: 'none',
                color: currentPage === 'profileEdit' ? '#667eea' : '#2c3e50',
                padding: '14px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                textAlign: 'left',
                marginBottom: '8px',
                transition: 'all 0.3s'
              }}
            >
              ✏️ Edit My Profile
            </button>

            <button
              onClick={() => { onNavigate('settings'); setDrawerOpen(false); }}
              style={{
                width: '100%',
                background: currentPage === 'settings' ? '#f0f4ff' : 'transparent',
                border: 'none',
                color: currentPage === 'settings' ? '#667eea' : '#2c3e50',
                padding: '14px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                textAlign: 'left',
                marginBottom: '8px',
                transition: 'all 0.3s'
              }}
            >
              ⚙️ Account Settings
            </button>

            <button
              onClick={() => { onNavigate('preferences'); setDrawerOpen(false); }}
              style={{
                width: '100%',
                background: currentPage === 'preferences' ? '#f0f4ff' : 'transparent',
                border: 'none',
                color: currentPage === 'preferences' ? '#667eea' : '#2c3e50',
                padding: '14px 16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                textAlign: 'left',
                marginBottom: '8px',
                transition: 'all 0.3s'
              }}
            >
              🎨 Preferences
            </button>
          </div>

          {/* Emergency Alert Section */}
          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '2px solid #ffe0e0' }}>
            <div style={{ 
              fontSize: '12px', 
              fontWeight: '700', 
              color: '#e74c3c', 
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Emergency
            </div>

            <button
              onClick={() => {
                // Play emergency sound for 5 seconds
                const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGmi77eifTRAMUqfj8LJeHAU7k9X1y3gsBS+CzvLYijYIG2u87OmeTxELUaXi8LFYGgQ9lNTyy3YnBSuBzvLZizUIGmy97OmeUBELUaXh8LJXGgU+ltT0yXMnBSx+0fLaizcIF2y+7OieTBANU6fi8K9ZGgRAltT0yXMnBS1/0fLajTUIGW3A7OieTBENU6bi8K9aGQVBl9T0yHMnBTKC0PLZjjYIGm7A7OidTREMUqXh8K9bGQZCmNT0yHInBTOE0PLYjjYIG2++7OieTRANUaXi8K9bGwVCmNT0xXMnBTSG0PLYjDUIHHDB7OieTBEMUaXj8LBbGwVDmNT1xnMnBTSH0PLYjTUIHHDD7OibTBENUKTj8LBbGwZDmNT1xXInBTSI0fLYjDUIHXDD7OibSxENU6Th8LBcGwdEmNX1xXQnBjOI0fHajDUJHHHD7OicSxINVKPi8LBcHAdFmdX1xHMoBjOJ0fHZjTYJHXHD7OmdSxEOVKPh8LBcHAdGmdX1xXMphzWJ0fHajDYIHXHD7OmdSxEPVKPh8K9cHQdGmtX1xXQph ');
                audio.volume = 1.0;
                audio.play();
                
                // Stop after 5 seconds
                setTimeout(() => {
                  audio.pause();
                  audio.currentTime = 0;
                }, 5000);
                
                // Visual feedback
                const button = document.getElementById('emergency-alert-btn');
                if (button) {
                  button.style.background = '#c0392b';
                  setTimeout(() => {
                    button.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
                  }, 5000);
                }
                
                setDrawerOpen(false);
              }}
              id="emergency-alert-btn"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                border: 'none',
                color: 'white',
                padding: '16px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '700',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)',
                transition: 'all 0.3s',
                animation: 'pulse 2s infinite'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(231, 76, 60, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(231, 76, 60, 0.3)';
              }}
            >
              🚨 EMERGENCY ALERT
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 4px 15px rgba(231, 76, 60, 0.3);
          }
          50% {
            box-shadow: 0 4px 25px rgba(231, 76, 60, 0.6);
          }
        }
      `}</style>
    </>
  );
};
