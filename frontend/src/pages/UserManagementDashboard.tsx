import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  recentLogins: number;
  roleDistribution: {
    directors: number;
    managers: number;
    employees: number;
  };
  recentActions: AccessControlLog[];
}

interface AccessControlLog {
  id: number;
  action: string;
  reason?: string;
  blockedUntil?: string;
  createdAt: string;
  user: {
    email: string;
  };
  admin: {
    email: string;
  };
}

const DASHBOARD_QUERY = `
  query DashboardStats {
    dashboardStats {
      totalUsers
      activeUsers
      blockedUsers
      recentLogins
      roleDistribution {
        directors
        managers
        employees
      }
      recentActions {
        id
        action
        reason
        blockedUntil
        createdAt
        user {
          email
        }
        admin {
          email
        }
      }
    }
  }
`;

export const UserManagementDashboard: React.FC = () => {
  const { accessToken, user } = useContext(AuthContext);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await graphqlRequest(DASHBOARD_QUERY, {}, accessToken!);
      setStats(data.dashboardStats);
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: "2rem" }}>
        <h1>Error loading dashboard</h1>
      </div>
    );
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case "GRANTED": return "#10b981";
      case "DENIED": return "#ef4444";
      case "TEMP_BLOCK": return "#f59e0b";
      case "UNBLOCK": return "#3b82f6";
      default: return "#6b7280";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "GRANTED": return "✅";
      case "DENIED": return "🚫";
      case "TEMP_BLOCK": return "⏰";
      case "UNBLOCK": return "🔓";
      default: return "📝";
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return "N/A";
    }
  };

  return (
    <div style={{ padding: "2rem", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", color: "white", marginBottom: "2rem" }}>
          📊 User Management Dashboard
        </h1>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
          {/* Total Users */}
          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>👥</div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#667eea" }}>{stats.totalUsers}</div>
            <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>Total Users</div>
          </div>

          {/* Active Users */}
          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✅</div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#10b981" }}>{stats.activeUsers}</div>
            <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>Active Users</div>
          </div>

          {/* Blocked Users */}
          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🚫</div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#ef4444" }}>{stats.blockedUsers}</div>
            <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>Blocked Users</div>
          </div>

          {/* Recent Logins */}
          <div className="glass-card" style={{ padding: "1.5rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔐</div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#3b82f6" }}>{stats.recentLogins}</div>
            <div style={{ color: "#6b7280", fontSize: "0.9rem" }}>Logins (24h)</div>
          </div>
        </div>

        {/* Role Distribution */}
        <div className="glass-card" style={{ padding: "2rem", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem", color: "#1f2937" }}>
            👔 Role Distribution
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            <div style={{ textAlign: "center", padding: "1rem", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", borderRadius: "12px", color: "white" }}>
              <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{stats.roleDistribution.directors}</div>
              <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>Directors</div>
            </div>
            <div style={{ textAlign: "center", padding: "1rem", background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)", borderRadius: "12px", color: "white" }}>
              <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{stats.roleDistribution.managers}</div>
              <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>Managers</div>
            </div>
            <div style={{ textAlign: "center", padding: "1rem", background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)", borderRadius: "12px", color: "white" }}>
              <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{stats.roleDistribution.employees}</div>
              <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>Employees</div>
            </div>
          </div>
        </div>

        {/* Recent Access Control Actions */}
        <div className="glass-card" style={{ padding: "2rem" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem", color: "#1f2937" }}>
            📋 Recent Access Control Actions
          </h2>
          
          {stats.recentActions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#6b7280" }}>
              No access control actions yet
            </div>
          ) : (
            <div style={{ maxHeight: "600px", overflowY: "auto" }}>
              {stats.recentActions.map((action) => (
                <div
                  key={action.id}
                  className="hover-lift"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    padding: "1rem",
                    background: "white",
                    borderRadius: "8px",
                    marginBottom: "0.75rem",
                    borderLeft: `4px solid ${getActionColor(action.action)}`,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                  }}
                >
                  <div style={{ fontSize: "1.5rem" }}>{getActionIcon(action.action)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "600", color: "#1f2937", marginBottom: "0.25rem" }}>
                      {action.admin.email}
                      <span style={{ color: getActionColor(action.action), fontWeight: "bold", margin: "0 0.5rem" }}>
                        {action.action === "GRANTED" ? "granted access to" :
                         action.action === "DENIED" ? "denied access to" :
                         action.action === "TEMP_BLOCK" ? "temporarily blocked" :
                         "unblocked"}
                      </span>
                      {action.user.email}
                    </div>
                    {action.reason && (
                      <div style={{ fontSize: "0.875rem", color: "#6b7280", fontStyle: "italic" }}>
                        Reason: {action.reason}
                      </div>
                    )}
                    {action.blockedUntil && (
                      <div style={{ fontSize: "0.875rem", color: "#f59e0b", marginTop: "0.25rem" }}>
                        ⏰ Blocked until: {new Date(action.blockedUntil).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#9ca3af", whiteSpace: "nowrap" }}>
                    {formatDate(action.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
