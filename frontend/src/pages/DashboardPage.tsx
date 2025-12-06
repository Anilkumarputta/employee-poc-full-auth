import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../auth/authContext";
import { graphqlRequest } from "../lib/graphqlClient";
import { formatRelativeTime } from "../lib/dateUtils";

// Add Props type for navigation
type DashboardPageProps = {
  onNavigate?: (page: string) => void;
};

type Employee = {
  id: number;
  name: string;
  email: string;
  attendance: number;
  status: string;
  role: string;
  flagged: boolean;
  className: string;
  location: string;
  managerId: number | null;
  createdAt: string;
  updatedAt: string;
};

type LeaveRequest = {
  id: number;
  employeeId: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
};

const EMPLOYEES_QUERY = `
  query Employees {
    employees(page: 1, pageSize: 1000) {
      items {
        id
        name
        email
        attendance
        status
        role
        flagged
        className
        location
        managerId
        createdAt
        updatedAt
      }
      total
    }
  }
`;

const LEAVE_REQUESTS_QUERY = `
  query LeaveRequests {
    leaveRequests {
      id
      employeeId
      startDate
      endDate
      reason
      status
    }
  }
`;

const RECENT_ACTIVITIES_QUERY = `
  query RecentActivities {
    accessLogs(page: 1, pageSize: 10) {
      id
      action
      details
      createdAt
    }
  }
`;

const MY_NOTIFICATIONS_QUERY = `
  query MyNotifications {
    notifications {
      id
      title
      message
      type
      createdAt
    }
  }
`;

type Activity = {
  id: string;
  icon: string;
  title: string;
  description: string;
  time: string;
  color: string;
};

type AccessLog = {
  id: number;
  action: string;
  details: string | null;
  createdAt: string;
};

type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  createdAt: string;
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { accessToken, user } = useContext(AuthContext);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [weather, setWeather] = useState<{temp: number, condition: string, icon: string, location: string} | null>(null);

  const isDirector = user?.role === 'director';
  const isManager = user?.role === 'manager';
  const isEmployee = user?.role === 'employee';

  useEffect(() => {
    fetchData();
    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      // Using wttr.in - a simple weather API that doesn't require API key
      const response = await fetch('https://wttr.in/?format=j1');
      const data = await response.json();
      
      const current = data.current_condition[0];
      setWeather({
        temp: Math.round(parseFloat(current.temp_C)),
        condition: current.weatherDesc[0].value,
        icon: getWeatherIcon(current.weatherCode),
        location: data.nearest_area[0].areaName[0].value
      });
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      // Fallback weather data
      setWeather({
        temp: 22,
        condition: 'Partly Cloudy',
        icon: '⛅',
        location: 'Local'
      });
    }
  };

  const getWeatherIcon = (code: string): string => {
    const weatherCode = parseInt(code);
    if (weatherCode === 113) return '☀️'; // Sunny
    if (weatherCode === 116) return '⛅'; // Partly cloudy
    if (weatherCode === 119 || weatherCode === 122) return '☁️'; // Cloudy
    if (weatherCode >= 176 && weatherCode <= 299) return '🌧️'; // Rainy
    if (weatherCode >= 323 && weatherCode <= 395) return '🌨️'; // Snowy
    if (weatherCode >= 200 && weatherCode <= 299) return '⛈️'; // Thunderstorm
    return '🌤️'; // Default
  };

  const getActivityIcon = (action: string): string => {
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return '🔐';
    if (action.includes('UPDATE') || action.includes('EDIT')) return '✏️';
    if (action.includes('CREATE') || action.includes('ADD')) return '➕';
    if (action.includes('DELETE') || action.includes('REMOVE')) return '🗑️';
    if (action.includes('ROLE')) return '👤';
    if (action.includes('STATUS')) return '🔄';
    if (action.includes('FLAG')) return '🚩';
    return '📝';
  };

  const formatActivityTitle = (action: string): string => {
    return action.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ');
  };

  const getActivityColor = (action: string): string => {
    if (action.includes('LOGIN')) return '#27ae60';
    if (action.includes('LOGOUT')) return '#95a5a6';
    if (action.includes('UPDATE') || action.includes('EDIT')) return '#3498db';
    if (action.includes('CREATE')) return '#2ecc71';
    if (action.includes('DELETE')) return '#e74c3c';
    if (action.includes('ROLE')) return '#9b59b6';
    if (action.includes('FLAG')) return '#e67e22';
    return '#34495e';
  };

  const getNotificationIcon = (type: string): string => {
    if (type === 'MESSAGE') return '💬';
    if (type === 'APPROVAL') return '✅';
    if (type === 'WARNING') return '⚠️';
    if (type === 'CRITICAL') return '🚨';
    return 'ℹ️';
  };

  const getNotificationColor = (type: string): string => {
    if (type === 'MESSAGE') return '#3498db';
    if (type === 'APPROVAL') return '#27ae60';
    if (type === 'WARNING') return '#f39c12';
    if (type === 'CRITICAL') return '#e74c3c';
    return '#95a5a6';
  };

  const fetchData = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      const [employeesData, leaveData, logsData, notificationsData] = await Promise.all([
        graphqlRequest(EMPLOYEES_QUERY, {}, accessToken),
        graphqlRequest(LEAVE_REQUESTS_QUERY, {}, accessToken).catch(() => ({ leaveRequests: [] })),
        graphqlRequest(RECENT_ACTIVITIES_QUERY, {}, accessToken).catch(() => ({ accessLogs: [] })),
        graphqlRequest(MY_NOTIFICATIONS_QUERY, {}, accessToken).catch(() => ({ notifications: [] }))
      ]);
      
      setEmployees(employeesData.employees.items);
      setLeaveRequests(leaveData.leaveRequests || []);
      
      // Combine activities from access logs and notifications
      const recentActivities: Activity[] = [];
      
      // Add access logs
      (logsData.accessLogs || []).forEach((log: AccessLog) => {
        recentActivities.push({
          id: `log-${log.id}`,
          icon: getActivityIcon(log.action),
          title: formatActivityTitle(log.action),
          description: log.details || log.action,
          time: log.createdAt,
          color: getActivityColor(log.action)
        });
      });
      
      // Add notifications
      (notificationsData.notifications || []).slice(0, 5).forEach((notif: Notification) => {
        recentActivities.push({
          id: `notif-${notif.id}`,
          icon: getNotificationIcon(notif.type),
          title: notif.title,
          description: notif.message.substring(0, 80) + (notif.message.length > 80 ? '...' : ''),
          time: notif.createdAt,
          color: getNotificationColor(notif.type)
        });
      });
      
      // Sort by time (most recent first) and take top 8
      recentActivities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setActivities(recentActivities.slice(0, 8));
      
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ 
          fontSize: '48px',
          animation: 'spin 1s linear infinite',
          display: 'inline-block'
        }}>⚙️</div>
        <p style={{ marginTop: '20px', fontSize: '18px', color: '#666' }}>Loading dashboard...</p>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Calculate stats for all roles
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.status === 'active').length;
  const inactiveEmployees = employees.filter(e => e.status !== 'active').length;
  const flaggedEmployees = employees.filter(e => e.flagged).length;
  const avgAttendance = employees.length > 0 
    ? Math.round(employees.reduce((sum, e) => sum + e.attendance, 0) / employees.length) 
    : 0;

  // Calculate month-related stats
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newHiresThisMonth = employees.filter(e => 
    new Date(e.createdAt) >= firstDayOfMonth
  ).length;

  // Leave requests
  const pendingLeaves = leaveRequests.filter(lr => lr.status === 'pending').length;
  const todayStr = now.toISOString().split('T')[0];
  const onLeaveToday = leaveRequests.filter(lr => 
    lr.status === 'approved' && 
    lr.startDate <= todayStr && 
    lr.endDate >= todayStr
  ).length;

  // Department grouping
  const departmentCounts = employees.reduce((acc, e) => {
    acc[e.className] = (acc[e.className] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Manager-specific: filter to team members
  const myTeam = isManager 
    ? employees.filter(e => e.managerId === user?.id) 
    : [];
  const myTeamSize = myTeam.length;
  const myTeamAvgAttendance = myTeam.length > 0
    ? Math.round(myTeam.reduce((sum, e) => sum + e.attendance, 0) / myTeam.length)
    : 0;
  const myTeamLowAttendance = myTeam
    .filter(e => e.attendance < 75)
    .sort((a, b) => a.attendance - b.attendance)
    .slice(0, 5);

  // Employee-specific: find my record
  const myRecord = isEmployee 
    ? employees.find(e => e.email === user?.email)
    : null;
  const myLeaveBalance = 20; // TODO: Calculate from leave requests
  const myNextLeave = leaveRequests
    .filter(lr => lr.status === 'approved' && lr.startDate > todayStr)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];

  // DIRECTOR DASHBOARD
  if (isDirector) {
    return (
      <div style={{ padding: '40px', background: 'linear-gradient(135deg, #f5f7fa 0%, #e0e7ff 50%, #f5f7fa 100%)', minHeight: '100vh' }}>
        {/* Title */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '32px', 
            fontWeight: 'bold',
            color: '#2c3e50',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <span style={{
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>🏢</span>
            Director Dashboard - Company Control
          </h1>
          <p style={{ margin: '10px 0 0 65px', color: '#7f8c8d', fontSize: '16px' }}>
            Complete oversight of all employees and operations
          </p>
        </div>

        {/* Hero Metrics Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          {weather && (
            <MetricCard
              icon={weather.icon}
              title="Weather"
              value={`${weather.temp}°C`}
              subtitle={`${weather.condition} in ${weather.location}`}
              color="#3498db"
            />
          )}
          <MetricCard
            icon="👥"
            title="Total Employees"
            value={totalEmployees}
            subtitle="All employees"
            color="#667eea"
            trend="+5% vs last month"
          />
          <MetricCard
            icon="✅"
            title="Active vs Inactive"
            value={`${activeEmployees}/${inactiveEmployees}`}
            subtitle="Active / Inactive"
            color="#27ae60"
          />
          <MetricCard
            icon="🆕"
            title="New Hires"
            value={newHiresThisMonth}
            subtitle="This month"
            color="#3498db"
          />
          <MetricCard
            icon="📊"
            title="Avg Attendance"
            value={`${avgAttendance}%`}
            subtitle="Company average"
            color="#f39c12"
          />
          <MetricCard
            icon="🏖️"
            title="On Leave Today"
            value={onLeaveToday}
            subtitle="Currently out"
            color="#e74c3c"
          />
        </div>

        {/* Charts and Tables Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
          {/* Employees by Department */}
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#2c3e50' }}>
              📊 Employees by Department
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {Object.entries(departmentCounts).slice(0, 5).map(([dept, count]) => (
                <div key={dept} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ minWidth: '120px', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                    {dept}
                  </div>
                  <div style={{ flex: 1, height: '30px', background: '#f0f4ff', borderRadius: '15px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      width: `${(count / totalEmployees) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '15px',
                      transition: 'width 0.5s'
                    }} />
                  </div>
                  <div style={{ minWidth: '60px', textAlign: 'right', fontSize: '16px', fontWeight: 'bold', color: '#667eea' }}>
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recently Changed Employees */}
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#2c3e50' }}>
              🕒 Recently Changed Records
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {employees
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .slice(0, 5)
                .map(emp => (
                  <div key={emp.id} style={{
                    padding: '12px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    borderLeft: '4px solid #667eea'
                  }}>
                    <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>
                      {emp.name}
                    </div>
                    <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                      Updated {formatRelativeTime(emp.updatedAt)} • {emp.role}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Flagged Employees and Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
          {/* Flagged Employees Panel */}
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: flaggedEmployees > 0 ? '2px solid #e74c3c' : '2px solid #e3e8ef'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#e74c3c', display: 'flex', alignItems: 'center', gap: '10px' }}>
              🚩 Flagged Employees <span style={{
                background: '#e74c3c',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>{flaggedEmployees}</span>
            </h3>
            {flaggedEmployees === 0 ? (
              <p style={{ color: '#95a5a6', textAlign: 'center', padding: '20px 0' }}>
                No employees flagged for review
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {employees.filter(e => e.flagged).slice(0, 5).map(emp => (
                  <div key={emp.id} style={{
                    padding: '15px',
                    background: '#fff5f5',
                    borderRadius: '10px',
                    border: '2px solid #ffebee',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#2c3e50' }}>{emp.name}</div>
                      <div style={{ fontSize: '13px', color: '#7f8c8d' }}>{emp.role} • {emp.className}</div>
                    </div>
                    <button style={{
                      padding: '8px 16px',
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      Review
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#2c3e50' }}>
              ⚡ Quick Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <QuickActionButton 
                icon="➕" 
                text="Add Employee" 
                color="#27ae60" 
                onClick={() => onNavigate?.('employees')}
              />
              <QuickActionButton 
                icon="🔐" 
                text="Manage Users" 
                color="#9b59b6" 
                onClick={() => onNavigate?.('admins')}
              />
              <QuickActionButton 
                icon="👥" 
                text="View All Employees" 
                color="#667eea" 
                onClick={() => onNavigate?.('employees')}
              />
              <QuickActionButton 
                icon="📊" 
                text="Generate Reports" 
                color="#f39c12" 
                onClick={() => onNavigate?.('reports')}
              />
              <QuickActionButton 
                icon="✅" 
                text="Review Requests" 
                color="#e74c3c" 
                onClick={() => onNavigate?.('review-requests')}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MANAGER DASHBOARD
  if (isManager) {
    const upcomingLeaves = leaveRequests.filter(lr => {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      return lr.status === 'approved' && 
             lr.startDate > todayStr && 
             lr.startDate <= sevenDaysFromNow.toISOString().split('T')[0];
    }).length;

    return (
      <div style={{ padding: '40px', background: 'linear-gradient(135deg, #f5f7fa 0%, #fef3c7 50%, #f5f7fa 100%)', minHeight: '100vh' }}>
        {/* Title */}
        <div style={{ marginBottom: '30px' }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '32px', 
            fontWeight: 'bold',
            color: '#2c3e50',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <span style={{
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>👔</span>
            Manager Dashboard - Team Performance
          </h1>
          <p style={{ margin: '10px 0 0 65px', color: '#7f8c8d', fontSize: '16px' }}>
            Monitor and support your team's success
          </p>
        </div>

        {/* Hero Metrics Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '20px',
          marginBottom: '30px'
        }}>
          {weather && (
            <MetricCard
              icon={weather.icon}
              title="Weather"
              value={`${weather.temp}°C`}
              subtitle={`${weather.condition} in ${weather.location}`}
              color="#3498db"
            />
          )}
          <MetricCard
            icon="👥"
            title="My Team Size"
            value={myTeamSize}
            subtitle="Direct reports"
            color="#f093fb"
          />
          <MetricCard
            icon="📊"
            title="Team Attendance"
            value={`${myTeamAvgAttendance}%`}
            subtitle="Team average"
            color="#27ae60"
          />
          <MetricCard
            icon="📅"
            title="Upcoming Leaves"
            value={upcomingLeaves}
            subtitle="Next 7 days"
            color="#3498db"
          />
          <MetricCard
            icon="⏰"
            title="Pending Approvals"
            value={pendingLeaves}
            subtitle="Awaiting action"
            color="#e74c3c"
          />
        </div>

        {/* Charts and Team Widgets */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
          {/* At-Risk Attendance */}
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#2c3e50' }}>
              ⚠️ At-Risk Attendance
            </h3>
            {myTeamLowAttendance.length === 0 ? (
              <p style={{ color: '#95a5a6', textAlign: 'center', padding: '20px 0' }}>
                All team members have good attendance! 🎉
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {myTeamLowAttendance.map(emp => (
                  <div key={emp.id} style={{
                    padding: '15px',
                    background: emp.attendance < 50 ? '#fff5f5' : '#fffbf0',
                    borderRadius: '10px',
                    border: `2px solid ${emp.attendance < 50 ? '#ffebee' : '#fff3cd'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#2c3e50' }}>{emp.name}</div>
                      <div style={{ fontSize: '13px', color: '#7f8c8d' }}>{emp.role}</div>
                    </div>
                    <div style={{
                      padding: '8px 16px',
                      background: emp.attendance < 50 ? '#e74c3c' : '#f39c12',
                      color: 'white',
                      borderRadius: '20px',
                      fontSize: '16px',
                      fontWeight: 'bold'
                    }}>
                      {emp.attendance}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Approvals Panel */}
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '15px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: pendingLeaves > 0 ? '2px solid #f39c12' : '2px solid #e3e8ef'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '10px' }}>
              📋 My Approvals <span style={{
                background: '#f39c12',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>{pendingLeaves}</span>
            </h3>
            {pendingLeaves === 0 ? (
              <p style={{ color: '#95a5a6', textAlign: 'center', padding: '20px 0' }}>
                No pending approvals
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {leaveRequests.filter(lr => lr.status === 'pending').slice(0, 5).map(req => (
                  <div key={req.id} style={{
                    padding: '15px',
                    background: '#fffbf0',
                    borderRadius: '10px',
                    border: '2px solid #fff3cd'
                  }}>
                    <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '8px' }}>
                      Leave Request #{req.id}
                    </div>
                    <div style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '12px' }}>
                      {req.startDate} to {req.endDate}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button style={{
                        flex: 1,
                        padding: '8px',
                        background: '#27ae60',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        ✓ Approve
                      </button>
                      <button style={{
                        flex: 1,
                        padding: '8px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#2c3e50' }}>
            ⚡ Quick Actions
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            <QuickActionButton 
              icon="✓" 
              text="Approve Leaves" 
              color="#27ae60" 
              onClick={() => onNavigate?.('leaveRequests')}
            />
            <QuickActionButton 
              icon="📊" 
              text="View Team Grid" 
              color="#3498db" 
              onClick={() => onNavigate?.('employees')}
            />
            <QuickActionButton 
              icon="🚩" 
              text="Flag Team Member" 
              color="#e74c3c" 
              onClick={() => onNavigate?.('employees')}
            />
            <QuickActionButton 
              icon="📈" 
              text="Team Performance Report" 
              color="#f39c12" 
              onClick={() => onNavigate?.('reports')}
            />
          </div>
        </div>
      </div>
    );
  }

  // EMPLOYEE DASHBOARD
  return (
    <div style={{ padding: '40px', background: 'linear-gradient(135deg, #f5f7fa 0%, #dbeafe 50%, #f5f7fa 100%)', minHeight: '100vh' }}>
      {/* Welcome Hero Card */}
      <div style={{
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        padding: '40px',
        borderRadius: '20px',
        color: 'white',
        marginBottom: '30px',
        boxShadow: '0 10px 30px rgba(79, 172, 254, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
          <div style={{
            width: '100px',
            height: '100px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            border: '4px solid rgba(255,255,255,0.5)'
          }}>
            👤
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: '36px', fontWeight: 'bold' }}>
              Hi, {myRecord?.name || user?.email}! 👋
            </h1>
            <div style={{ fontSize: '18px', marginTop: '10px', opacity: 0.95 }}>
              {myRecord?.role || 'Employee'} • {myRecord?.className || 'Department'} • Manager: {myRecord?.managerId ? `ID ${myRecord.managerId}` : 'Not assigned'}
            </div>
            <div style={{ 
              marginTop: '15px',
              display: 'inline-block',
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.25)',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              Today's Status: <span style={{ marginLeft: '10px' }}>✅ Working</span>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Stats Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        {weather && (
          <MetricCard
            icon={weather.icon}
            title="Weather"
            value={`${weather.temp}°C`}
            subtitle={`${weather.condition} in ${weather.location}`}
            color="#3498db"
          />
        )}
        <MetricCard
          icon="🏖️"
          title="Leave Balance"
          value={myLeaveBalance}
          subtitle="Days remaining"
          color="#3498db"
        />
        <MetricCard
          icon="📊"
          title="My Attendance"
          value={`${myRecord?.attendance || 0}%`}
          subtitle="Current streak"
          color={myRecord && myRecord.attendance >= 90 ? '#27ae60' : myRecord && myRecord.attendance >= 75 ? '#f39c12' : '#e74c3c'}
        />
        <MetricCard
          icon="📅"
          title="Next Leave"
          value={myNextLeave ? new Date(myNextLeave.startDate).toLocaleDateString() : 'None'}
          subtitle={myNextLeave ? 'Approved' : 'No upcoming leave'}
          color="#9b59b6"
        />
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        {/* Recent Activity Timeline */}
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#2c3e50' }}>
            📜 Recent Activity
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {activities.length > 0 ? (
              activities.map(activity => (
                <ActivityItem 
                  key={activity.id}
                  icon={activity.icon}
                  title={activity.title}
                  description={activity.description}
                  time={formatRelativeTime(activity.time)}
                  color={activity.color}
                />
              ))
            ) : (
              <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem' }}>No recent activities</p>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '15px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '20px', color: '#2c3e50' }}>
            ⚡ Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <QuickActionButton 
              icon="🏖️" 
              text="Request Leave" 
              color="#3498db" 
              onClick={() => onNavigate?.('leaveRequests')}
            />
            <QuickActionButton 
              icon="✏️" 
              text="Update Profile" 
              color="#27ae60" 
              onClick={() => onNavigate?.('profileEdit')}
            />
            <QuickActionButton 
              icon="👤" 
              text="View My Record" 
              color="#667eea" 
              onClick={() => onNavigate?.('profile')}
            />
            <QuickActionButton 
              icon="💬" 
              text="My Messages" 
              color="#f39c12" 
              onClick={() => onNavigate?.('messages')}
            />
            <QuickActionButton 
              icon="⚙️" 
              text="Preferences" 
              color="#9b59b6" 
              onClick={() => onNavigate?.('preferences')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const MetricCard: React.FC<{
  icon: string;
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
  trend?: string;
}> = ({ icon, title, value, subtitle, color, trend }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    padding: '25px',
    borderRadius: '15px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
    e.currentTarget.style.borderColor = `${color}40`;
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0) scale(1)';
    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
  }}>
    <div style={{ 
      fontSize: '36px', 
      marginBottom: '12px',
      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
      transition: 'transform 0.3s'
    }}>{icon}</div>
    <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {title}
    </div>
    <div style={{ 
      fontSize: '32px', 
      fontWeight: 'bold', 
      background: `linear-gradient(135deg, ${color}, ${color}dd)`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      marginBottom: '8px' 
    }}>
      {value}
    </div>
    <div style={{ fontSize: '13px', color: '#95a5a6' }}>
      {subtitle}
    </div>
    {trend && (
      <div style={{ fontSize: '12px', color: '#27ae60', marginTop: '8px', fontWeight: '600' }}>
        {trend}
      </div>
    )}
  </div>
);

const QuickActionButton: React.FC<{
  icon: string;
  text: string;
  color: string;
  onClick?: () => void;
}> = ({ icon, text, color, onClick }) => (
  <button 
    onClick={onClick}
    style={{
      padding: '16px 20px',
      background: 'white',
      border: `2px solid ${color}`,
      borderRadius: '12px',
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: '600',
      color: color,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      transition: 'all 0.3s',
      width: '100%',
      textAlign: 'left'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = color;
      e.currentTarget.style.color = 'white';
      e.currentTarget.style.transform = 'translateX(5px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'white';
      e.currentTarget.style.color = color;
      e.currentTarget.style.transform = 'translateX(0)';
    }}>
    <span style={{ fontSize: '20px' }}>{icon}</span>
    {text}
  </button>
);

const ActivityItem: React.FC<{
  icon: string;
  title: string;
  description: string;
  time: string;
  color: string;
}> = ({ icon, title, description, time, color }) => (
  <div style={{
    display: 'flex',
    gap: '15px',
    padding: '15px',
    background: '#f8f9fa',
    borderRadius: '10px',
    borderLeft: `4px solid ${color}`
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      background: color,
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      flexShrink: 0
    }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '5px' }}>
        {title}
      </div>
      <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>
        {description}
      </div>
      <div style={{ fontSize: '12px', color: '#95a5a6' }}>
        {time}
      </div>
    </div>
  </div>
);
