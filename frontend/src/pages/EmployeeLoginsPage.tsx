import React, { useState, useEffect } from 'react';
import { graphqlRequest } from '../lib/graphqlClient';
import { useAuth } from '../auth/authContext';

interface Employee {
  id: number;
  name: string;
  email: string | null;
  userId: number | null;
  role: string;
  status: string;
}

const EMPLOYEES_QUERY = `
  query Employees {
    employees(pageSize: 1000) {
      items {
        id
        name
        email
        userId
        role
        status
      }
    }
  }
`;

const GENERATE_LOGINS_MUTATION = `
  mutation GenerateEmployeeLogins {
    generateEmployeeLogins {
      success
      message
      created
      skipped
      failed
    }
  }
`;

export default function EmployeeLoginsPage() {
  const { user, accessToken } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const isDirector = user?.role === 'director';

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await graphqlRequest(EMPLOYEES_QUERY, {}, accessToken!);
      setEmployees(data.employees.items);
    } catch (error: any) {
      console.error('Failed to fetch employees:', error);
      setMessage({ type: 'error', text: 'Failed to load employees' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLogins = async () => {
    if (!confirm('Generate login credentials for all employees without accounts?\n\nFormat: name@gmail.com\nPassword: employee123')) {
      return;
    }

    try {
      setGenerating(true);
      setMessage(null);
      
      const data = await graphqlRequest(GENERATE_LOGINS_MUTATION, {}, accessToken!);
      const result = data.generateEmployeeLogins;
      
      if (result.success) {
        setMessage({
          type: 'success',
          text: `✅ ${result.message}`
        });
        fetchEmployees(); // Refresh list
      } else {
        setMessage({
          type: 'error',
          text: `❌ ${result.message}`
        });
      }
    } catch (error: any) {
      console.error('Failed to generate logins:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to generate login credentials'
      });
    } finally {
      setGenerating(false);
    }
  };

  if (!isDirector) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚫</div>
        <h2 style={{ color: '#e74c3c' }}>Access Denied</h2>
        <p style={{ color: '#666', marginTop: '10px' }}>
          This page is only accessible to Directors.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ 
          fontSize: '48px',
          animation: 'spin 1s linear infinite',
          display: 'inline-block'
        }}>⚙️</div>
        <p style={{ marginTop: '20px', fontSize: '18px', color: '#666' }}>Loading employees...</p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const employeesWithLogins = employees.filter(e => e.userId !== null);
  const employeesWithoutLogins = employees.filter(e => e.userId === null);

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '30px',
        borderRadius: '15px',
        color: 'white',
        marginBottom: '30px',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
              🔑
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>
                Employee Login Management
              </h1>
              <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '16px' }}>
                Auto-generate login credentials for employees
              </p>
            </div>
          </div>
          <button
            onClick={handleGenerateLogins}
            disabled={generating || employeesWithoutLogins.length === 0}
            style={{
              padding: '15px 30px',
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              background: generating 
                ? 'rgba(255,255,255,0.3)'
                : employeesWithoutLogins.length === 0
                ? 'rgba(255,255,255,0.2)'
                : 'rgba(255,255,255,0.25)',
              border: '2px solid rgba(255,255,255,0.5)',
              borderRadius: '10px',
              cursor: generating || employeesWithoutLogins.length === 0 ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              opacity: generating || employeesWithoutLogins.length === 0 ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!generating && employeesWithoutLogins.length > 0) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.35)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {generating ? '⏳ Generating...' : `🔑 Generate Logins (${employeesWithoutLogins.length})`}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          padding: '15px 20px',
          borderRadius: '10px',
          marginBottom: '25px',
          background: message.type === 'success' 
            ? '#d4edda' 
            : message.type === 'error'
            ? '#f8d7da'
            : '#d1ecf1',
          border: `2px solid ${
            message.type === 'success' 
              ? '#28a745' 
              : message.type === 'error'
              ? '#dc3545'
              : '#17a2b8'
          }`,
          color: message.type === 'success' 
            ? '#155724' 
            : message.type === 'error'
            ? '#721c24'
            : '#0c5460',
          fontSize: '16px',
          fontWeight: '500'
        }}>
          {message.text}
        </div>
      )}

      {/* Statistics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: '2px solid #e3e8ef'
        }}>
          <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '8px', fontWeight: '600' }}>
            TOTAL EMPLOYEES
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#2c3e50' }}>
            {employees.length}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: '2px solid #27ae60'
        }}>
          <div style={{ fontSize: '14px', color: '#27ae60', marginBottom: '8px', fontWeight: '600' }}>
            WITH LOGIN
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#27ae60' }}>
            {employeesWithLogins.length}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          border: '2px solid #e74c3c'
        }}>
          <div style={{ fontSize: '14px', color: '#e74c3c', marginBottom: '8px', fontWeight: '600' }}>
            WITHOUT LOGIN
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#e74c3c' }}>
            {employeesWithoutLogins.length}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div style={{
        marginBottom: '30px',
        padding: '20px',
        background: '#fff3cd',
        border: '2px solid #ffc107',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'start',
        gap: '15px'
      }}>
        <div style={{ fontSize: '24px' }}>💡</div>
        <div>
          <h3 style={{ margin: '0 0 8px 0', color: '#856404', fontSize: '16px' }}>How Auto-Generate Works</h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404', fontSize: '14px', lineHeight: '1.6' }}>
            <li><strong>Email Format:</strong> Employee name converted to email (e.g., "John Doe" → "john.doe@gmail.com")</li>
            <li><strong>Password:</strong> All employees get the same password: <code style={{ background: '#fff', padding: '2px 6px', borderRadius: '4px' }}>employee123</code></li>
            <li><strong>Role:</strong> All generated accounts have "employee" role</li>
            <li><strong>Safe:</strong> If email already exists, it just links the existing account</li>
          </ul>
        </div>
      </div>

      {/* Employees Without Logins */}
      {employeesWithoutLogins.length > 0 && (
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '2px solid #e74c3c',
          marginBottom: '30px'
        }}>
          <h2 style={{ 
            margin: '0 0 20px 0', 
            fontSize: '24px',
            color: '#e74c3c',
            borderBottom: '3px solid #e74c3c',
            paddingBottom: '10px'
          }}>
            ⚠️ Employees Without Login ({employeesWithoutLogins.length})
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '15px'
          }}>
            {employeesWithoutLogins.map(employee => (
              <div
                key={employee.id}
                style={{
                  padding: '15px',
                  background: '#f8f9fa',
                  borderRadius: '10px',
                  border: '2px solid #e3e8ef'
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '16px', color: '#2c3e50', marginBottom: '5px' }}>
                  {employee.name}
                </div>
                <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                  ID: #{employee.id} | {employee.role} | {employee.status}
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  color: '#e74c3c',
                  marginTop: '8px',
                  fontWeight: '600'
                }}>
                  🚫 No login account
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employees With Logins */}
      {employeesWithLogins.length > 0 && (
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '2px solid #27ae60'
        }}>
          <h2 style={{ 
            margin: '0 0 20px 0', 
            fontSize: '24px',
            color: '#27ae60',
            borderBottom: '3px solid #27ae60',
            paddingBottom: '10px'
          }}>
            ✅ Employees With Login ({employeesWithLogins.length})
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '15px'
          }}>
            {employeesWithLogins.map(employee => (
              <div
                key={employee.id}
                style={{
                  padding: '15px',
                  background: '#f8f9fa',
                  borderRadius: '10px',
                  border: '2px solid #e3e8ef'
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '16px', color: '#2c3e50', marginBottom: '5px' }}>
                  {employee.name}
                </div>
                <div style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '8px' }}>
                  ID: #{employee.id} | {employee.role} | {employee.status}
                </div>
                {employee.email && (
                  <div style={{ 
                    fontSize: '13px', 
                    color: '#27ae60',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}>
                    <span>📧</span>
                    <span>{employee.email}</span>
                  </div>
                )}
                <div style={{ 
                  fontSize: '13px', 
                  color: '#27ae60',
                  marginTop: '5px',
                  fontWeight: '600'
                }}>
                  ✅ User ID: #{employee.userId}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
