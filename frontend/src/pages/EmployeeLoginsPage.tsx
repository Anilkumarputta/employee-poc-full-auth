import React, { useEffect, useMemo, useState } from 'react';
import { graphqlRequest } from '../lib/graphqlClient';
import { useAuth } from '../auth/authContext';

type Employee = {
  id: number;
  name: string;
  email: string | null;
  userId: number | null;
  role: string;
  status: string;
};

type EmployeesQueryResult = {
  employees: {
    items: Employee[];
  };
};

type GenerateLoginsResult = {
  generateEmployeeLogins: {
    success: boolean;
    message: string;
    created: number;
    skipped: number;
    failed: number;
  };
};

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

  const employeesWithLogins = useMemo(
    () => employees.filter((employee) => employee.userId !== null),
    [employees],
  );

  const employeesWithoutLogins = useMemo(
    () => employees.filter((employee) => employee.userId === null),
    [employees],
  );

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    void fetchEmployees();
  }, [accessToken]);

  const fetchEmployees = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const data = await graphqlRequest<EmployeesQueryResult>(
        EMPLOYEES_QUERY,
        {},
        accessToken,
        { bypassCache: true },
      );

      setEmployees(data.employees.items || []);
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Failed to load employees.' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLogins = async () => {
    const confirmed = window.confirm(
      'Generate login credentials for employees without accounts?\n\nDefault password: employee123',
    );
    if (!confirmed) {
      return;
    }

    if (!accessToken) {
      setMessage({ type: 'error', text: 'You are not authenticated. Please sign in again.' });
      return;
    }

    setGenerating(true);
    setMessage(null);

    try {
      const data = await graphqlRequest<GenerateLoginsResult>(
        GENERATE_LOGINS_MUTATION,
        {},
        accessToken,
      );

      const result = data.generateEmployeeLogins;
      if (!result.success) {
        setMessage({ type: 'error', text: result.message || 'Unable to generate logins.' });
        return;
      }

      setMessage({
        type: 'success',
        text: `Completed. Created: ${result.created}, Linked: ${result.skipped}, Failed: ${result.failed}.`,
      });

      await fetchEmployees();
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Unable to generate logins.' });
    } finally {
      setGenerating(false);
    }
  };

  if (!isDirector) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Access denied</h2>
        <p style={{ color: '#6b7280', margin: 0 }}>Only directors can manage employee logins.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      <div
        style={{
          background: 'white',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          padding: '1.5rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Employee Logins</h1>
          <p style={{ margin: '0.4rem 0 0', color: '#6b7280' }}>
            Generate and verify employee sign-in credentials.
          </p>
        </div>

        <button
          type="button"
          onClick={handleGenerateLogins}
          disabled={generating || employeesWithoutLogins.length === 0}
          style={{
            border: 'none',
            borderRadius: 10,
            padding: '0.7rem 1rem',
            background: generating || employeesWithoutLogins.length === 0 ? '#cbd5e1' : '#2563eb',
            color: 'white',
            fontWeight: 600,
            cursor: generating || employeesWithoutLogins.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          {generating ? 'Generating...' : `Generate Missing Logins (${employeesWithoutLogins.length})`}
        </button>
      </div>

      {message && (
        <div
          style={{
            background: message.type === 'success' ? '#dcfce7' : message.type === 'error' ? '#fee2e2' : '#e0f2fe',
            border: `1px solid ${message.type === 'success' ? '#22c55e' : message.type === 'error' ? '#ef4444' : '#38bdf8'}`,
            color: '#1f2937',
            borderRadius: 10,
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
          }}
        >
          {message.text}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          marginBottom: '1rem',
        }}
      >
        <StatCard label="Total Employees" value={employees.length} />
        <StatCard label="With Login" value={employeesWithLogins.length} tone="ok" />
        <StatCard label="Without Login" value={employeesWithoutLogins.length} tone="warn" />
      </div>

      <div
        style={{
          background: '#fff7ed',
          border: '1px solid #fdba74',
          borderRadius: 10,
          padding: '0.85rem 1rem',
          marginBottom: '1rem',
          color: '#7c2d12',
          fontSize: '0.9rem',
        }}
      >
        New accounts are generated with password: <strong>employee123</strong>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: '#6b7280' }}>Loading employees...</div>
      ) : (
        <div
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '1rem 1rem 0.75rem', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Employee Accounts</h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <Th>ID</Th>
                  <Th>Name</Th>
                  <Th>Status</Th>
                  <Th>Role</Th>
                  <Th>Email</Th>
                  <Th>Login Account</Th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <Td>#{employee.id}</Td>
                    <Td>{employee.name}</Td>
                    <Td>{employee.status}</Td>
                    <Td>{employee.role}</Td>
                    <Td>{employee.email || '-'}</Td>
                    <Td>
                      {employee.userId ? (
                        <span style={{ color: '#16a34a', fontWeight: 600 }}>Ready</span>
                      ) : (
                        <span style={{ color: '#dc2626', fontWeight: 600 }}>Missing</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = 'base',
}: {
  label: string;
  value: number;
  tone?: 'base' | 'ok' | 'warn';
}) {
  const color = tone === 'ok' ? '#16a34a' : tone === 'warn' ? '#dc2626' : '#111827';
  return (
    <div
      style={{
        background: 'white',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        padding: '1rem',
      }}
    >
      <div style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '0.35rem' }}>{label}</div>
      <div style={{ color, fontSize: '1.6rem', fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th
      style={{
        textAlign: 'left',
        padding: '0.7rem 0.8rem',
        color: '#334155',
        fontSize: '0.85rem',
        fontWeight: 700,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td
      style={{
        padding: '0.7rem 0.8rem',
        fontSize: '0.9rem',
        color: '#111827',
      }}
    >
      {children}
    </td>
  );
}
