import React, { useState } from "react";
import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from "./apolloClient";
import { EmployeesPage } from "./pages/EmployeesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { PreferencesPage } from "./pages/PreferencesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AdminsPage } from "./pages/AdminsPage";
import { AccessLogsPage } from "./pages/AccessLogsPage";
import { SendNotePage } from "./pages/SendNotePage";
import { UserManagementDashboard } from "./pages/UserManagementDashboard";
import { LeaveRequestsPage } from "./pages/LeaveRequestsPage";
import ProfileEditPage from "./pages/ProfileEditPage";
import EmployeeLoginsPage from "./pages/EmployeeLoginsPage";
import { MessagesPage } from "./pages/MessagesPage";
import { ReviewRequestsPage } from "./pages/ReviewRequestsPage";
import { HorizontalNav } from "./components/layout/HorizontalNav";
import { LoginPage } from "./auth/LoginPage";
import { RegisterPage } from "./auth/RegisterPage";
import { ForgotPasswordPage } from "./auth/ForgotPasswordPage";
import { AuthContext, AuthUser } from "./auth/authContext";

export type UserRole = "director" | "manager" | "employee";

type View = "login" | "register" | "forgot" | "app";
type AppPage = "employees" | "dashboard" | "notifications" | "reports" | "profile" | "preferences" | "settings" | "admins" | "accessLogs" | "sendNote" | "leaveRequests" | "profileEdit" | "employeeLogins" | "messages" | "review-requests" | "threads" | "userDashboard";

const App: React.FC = () => {
  const [view, setView] = useState<View>("login");
  const [auth, setAuth] = useState<{
    user: AuthUser | null;
    accessToken: string | null;
    refreshToken: string | null;
  }>({
    user: null,
    accessToken: null,
    refreshToken: null,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<AppPage>("dashboard");

  const handleAuthChange = (data: {
    user: AuthUser | null;
    accessToken: string | null;
    refreshToken: string | null;
  }) => {
    setAuth(data);
    if (data.user && data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken || '');
      setCurrentPage("dashboard"); // Always start at dashboard after login
      setView("app");
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setView("login");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setAuth({ user: null, accessToken: null, refreshToken: null });
    setView("login");
  };

  return (
    <ApolloProvider client={apolloClient}>
      <AuthContext.Provider
      value={{
        user: auth.user,
        accessToken: auth.accessToken,
        refreshToken: auth.refreshToken,
        setAuth: handleAuthChange,
        logout: handleLogout,
      }}
    >
      {view !== "app" || !auth.user ? (
        <div className="auth-shell">
          {view === "login" && (
            <LoginPage
              goRegister={() => setView("register")}
              goForgot={() => setView("forgot")}
            />
          )}
          {view === "register" && (
            <RegisterPage goLogin={() => setView("login")} />
          )}
          {view === "forgot" && (
            <ForgotPasswordPage goLogin={() => setView("login")} />
          )}
        </div>
      ) : (
        <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
          <HorizontalNav
            currentPage={currentPage}
            onNavigate={(page) => {
              setCurrentPage(page);
              setSidebarOpen(false); // Close sidebar on navigation (mobile)
            }}
            onLogout={handleLogout}
          />
          {/* Mobile overlay to close sidebar */}
          {sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              style={{
                position: 'fixed',
                top: '56px',
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 25,
                display: window.innerWidth > 768 ? 'none' : 'block'
              }}
            />
          )}
          <main style={{ padding: '0' }}>
            {currentPage === "employees" && <EmployeesPage currentRole={auth.user.role} />}
            {currentPage === "dashboard" && <DashboardPage onNavigate={(page) => setCurrentPage(page as AppPage)} />}
            {currentPage === "notifications" && <NotificationsPage />}
            {currentPage === "reports" && <ReportsPage />}
            {currentPage === "profile" && <ProfilePage />}
            {currentPage === "profileEdit" && <ProfileEditPage />}
            {currentPage === "preferences" && <PreferencesPage onBack={() => setCurrentPage("dashboard")} />}
            {currentPage === "settings" && <SettingsPage />}
            {currentPage === "admins" && <AdminsPage />}
            {currentPage === "userDashboard" && <UserManagementDashboard />}
            {currentPage === "accessLogs" && <AccessLogsPage />}
            {currentPage === "sendNote" && <SendNotePage />}
            {currentPage === "leaveRequests" && <LeaveRequestsPage />}
            {currentPage === "employeeLogins" && <EmployeeLoginsPage />}
            {currentPage === "messages" && <MessagesPage />}
            {currentPage === "review-requests" && <ReviewRequestsPage />}
          </main>
        </div>
      )}
      </AuthContext.Provider>
    </ApolloProvider>
  );
};

export default App;
