import React, { useState, useEffect } from 'react';
import { graphqlRequest } from '../lib/graphqlClient';
import { useAuth } from '../auth/authContext';

interface Employee {
  id: number;
  name: string;
  email: string | null;
  age: number;
  className: string;
  subjects: string[];
  attendance: number;
  role: string;
  status: string;
  location: string;
  lastLogin: string;
}

const MY_PROFILE_QUERY = `
  query MyProfile {
    myProfile {
      id
      name
      email
      age
      className
      subjects
      attendance
      role
      status
      location
      lastLogin
    }
  }
`;

const UPDATE_MY_PROFILE_MUTATION = `
  mutation UpdateMyProfile($input: ProfileUpdateInput!) {
    updateMyProfile(input: $input) {
      id
      name
      email
      age
      location
    }
  }
`;

export default function ProfileEditPage() {
  const { user, accessToken } = useAuth();
  const [profile, setProfile] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: 0,
    location: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await graphqlRequest(MY_PROFILE_QUERY, {}, accessToken!);
      setProfile(data.myProfile);
      setFormData({
        name: data.myProfile.name,
        email: data.myProfile.email || '',
        age: data.myProfile.age,
        location: data.myProfile.location
      });
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setMessage(null);
      
      await graphqlRequest(UPDATE_MY_PROFILE_MUTATION, {
        input: {
          name: formData.name,
          email: formData.email,
          age: parseInt(formData.age.toString()),
          location: formData.location
        }
      }, accessToken!);
      
      setMessage({ type: 'success', text: '✅ Profile updated successfully!' });
      fetchProfile(); // Refresh profile data
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ 
          fontSize: '48px',
          animation: 'spin 1s linear infinite',
          display: 'inline-block'
        }}>⚙️</div>
        <p style={{ marginTop: '20px', fontSize: '18px', color: '#666' }}>Loading your profile...</p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
        <h2 style={{ color: '#e74c3c' }}>Profile Not Found</h2>
        <p style={{ color: '#666', marginTop: '10px' }}>Unable to load your profile information.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '30px',
        borderRadius: '15px',
        color: 'white',
        marginBottom: '30px',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            border: '3px solid rgba(255,255,255,0.5)'
          }}>
            👤
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>
              My Profile
            </h1>
            <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '16px' }}>
              Edit your personal information
            </p>
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div style={{
          padding: '15px 20px',
          borderRadius: '10px',
          marginBottom: '25px',
          background: message.type === 'success' ? '#d4edda' : '#f8d7da',
          border: `2px solid ${message.type === 'success' ? '#28a745' : '#dc3545'}`,
          color: message.type === 'success' ? '#155724' : '#721c24',
          fontSize: '16px',
          fontWeight: '500'
        }}>
          {message.text}
        </div>
      )}

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Editable Information */}
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '2px solid #e3e8ef'
        }}>
          <h2 style={{ 
            margin: '0 0 25px 0', 
            fontSize: '24px',
            color: '#2c3e50',
            borderBottom: '3px solid #667eea',
            paddingBottom: '10px'
          }}>
            ✏️ Editable Information
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600',
                color: '#34495e',
                fontSize: '15px'
              }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  fontSize: '15px',
                  border: '2px solid #e3e8ef',
                  borderRadius: '8px',
                  transition: 'all 0.3s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e3e8ef'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600',
                color: '#34495e',
                fontSize: '15px'
              }}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  fontSize: '15px',
                  border: '2px solid #e3e8ef',
                  borderRadius: '8px',
                  transition: 'all 0.3s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e3e8ef'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600',
                color: '#34495e',
                fontSize: '15px'
              }}>
                Age
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
                min="18"
                max="100"
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  fontSize: '15px',
                  border: '2px solid #e3e8ef',
                  borderRadius: '8px',
                  transition: 'all 0.3s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e3e8ef'}
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600',
                color: '#34495e',
                fontSize: '15px'
              }}>
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  fontSize: '15px',
                  border: '2px solid #e3e8ef',
                  borderRadius: '8px',
                  transition: 'all 0.3s',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e3e8ef'}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                background: saving 
                  ? 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '10px',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                opacity: saving ? 0.7 : 1
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
              }}
            >
              {saving ? '💾 Saving...' : '💾 Save Changes'}
            </button>
          </form>
        </div>

        {/* Read-Only Information */}
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '2px solid #e3e8ef'
        }}>
          <h2 style={{ 
            margin: '0 0 25px 0', 
            fontSize: '24px',
            color: '#2c3e50',
            borderBottom: '3px solid #95a5a6',
            paddingBottom: '10px'
          }}>
            🔒 System Information
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                color: '#7f8c8d',
                marginBottom: '5px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Employee ID
              </label>
              <div style={{ 
                fontSize: '16px', 
                color: '#2c3e50',
                fontWeight: '500',
                padding: '10px 15px',
                background: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e3e8ef'
              }}>
                #{profile.id}
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                color: '#7f8c8d',
                marginBottom: '5px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Role
              </label>
              <div style={{ 
                fontSize: '16px', 
                color: '#2c3e50',
                fontWeight: '500',
                padding: '10px 15px',
                background: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e3e8ef',
                display: 'inline-block'
              }}>
                <span style={{
                  background: profile.role === 'director' 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : profile.role === 'manager'
                    ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                    : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  padding: '5px 12px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  textTransform: 'capitalize'
                }}>
                  {profile.role}
                </span>
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                color: '#7f8c8d',
                marginBottom: '5px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Status
              </label>
              <div style={{ 
                fontSize: '16px', 
                color: '#2c3e50',
                fontWeight: '500',
                padding: '10px 15px',
                background: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e3e8ef'
              }}>
                <span style={{
                  color: profile.status === 'active' ? '#27ae60' : '#e74c3c',
                  fontWeight: '600'
                }}>
                  ● {profile.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                color: '#7f8c8d',
                marginBottom: '5px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Class/Department
              </label>
              <div style={{ 
                fontSize: '16px', 
                color: '#2c3e50',
                fontWeight: '500',
                padding: '10px 15px',
                background: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e3e8ef'
              }}>
                {profile.className}
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                color: '#7f8c8d',
                marginBottom: '5px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Attendance
              </label>
              <div style={{ 
                fontSize: '16px', 
                color: '#2c3e50',
                fontWeight: '500',
                padding: '10px 15px',
                background: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e3e8ef'
              }}>
                <span style={{
                  color: profile.attendance >= 90 ? '#27ae60' : profile.attendance >= 75 ? '#f39c12' : '#e74c3c',
                  fontWeight: '700',
                  fontSize: '18px'
                }}>
                  {profile.attendance}%
                </span>
              </div>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                fontSize: '13px', 
                color: '#7f8c8d',
                marginBottom: '5px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Last Login
              </label>
              <div style={{ 
                fontSize: '14px', 
                color: '#2c3e50',
                fontWeight: '500',
                padding: '10px 15px',
                background: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e3e8ef'
              }}>
                {new Date(profile.lastLogin).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        background: '#e8f4f8',
        border: '2px solid #3498db',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'start',
        gap: '15px'
      }}>
        <div style={{ fontSize: '24px' }}>💡</div>
        <div>
          <h3 style={{ margin: '0 0 8px 0', color: '#2c3e50', fontSize: '16px' }}>Profile Update Tips</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#34495e', fontSize: '14px', lineHeight: '1.6' }}>
            <li>Keep your email address up to date for important notifications</li>
            <li>Your name will appear in all communications and reports</li>
            <li>System information (Role, Status, Department) can only be changed by administrators</li>
            <li>Changes are saved immediately and reflected across the system</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
