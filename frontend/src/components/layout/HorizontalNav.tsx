import React, { useState } from 'react';
import { useAuth } from '../../auth/authContext';

type AppPage = "employees" | "dashboard" | "notifications" | "reports" | "profile" | "preferences" | "settings" | "admins" | "accessLogs" | "sendNote" | "leaveRequests" | "profileEdit" | "employeeLogins";

type Props = {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
};

export const HorizontalNav: React.FC<Props> = ({ currentPage, onNavigate, onLogout }) => {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const isDirector = user?.role === 'director';
  const isManager = user?.role === 'manager';
  const isManagerOrAbove = isDirector || isManager;
  const isEmployee = user?.role === 'employee';

  const getPortalTitle = () => {
    if (isDirector) return '🏢 Director Portal';
    if (isManager) return '👔 Manager Portal';
    return '👤 Employee Portal';
  };

  return (
    <>
      {/* Top Horizontal Menu */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 30px',
          height: '70px'
        }}>
          {/* Left: Hamburger + Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
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
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{
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
              <div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>Employee POC</div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>{getPortalTitle()}</div>
              </div>
            </div>
          </div>

          {/* Center: Main Navigation */}
          <div style={{ display: 'flex', gap: '5px' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ 
              background: 'rgba(255,255,255,0.2)', 
              padding: '10px 20px', 
              borderRadius: '25px',
              fontSize: '14px'
            }}>
              {user?.email}
            </div>
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
      <div style={{
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
                💬 Send Message
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
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
};
