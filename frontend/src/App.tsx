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
import { LeaveRequestsPage } from "./pages/LeaveRequestsPage";
import { Topbar } from "./components/layout/Topbar";
import { Sidebar } from "./components/layout/Sidebar";
import { LoginPage } from "./auth/LoginPage";
import { RegisterPage } from "./auth/RegisterPage";
import { ForgotPasswordPage } from "./auth/ForgotPasswordPage";
import { AuthContext, AuthUser } from "./auth/authContext";

export type UserRole = "admin" | "employee";

type View = "login" | "register" | "forgot" | "app";
type AppPage = "employees" | "dashboard" | "notifications" | "reports" | "profile" | "preferences" | "settings" | "admins" | "accessLogs" | "sendNote" | "leaveRequests";

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
  const [currentPage, setCurrentPage] = useState<AppPage>("employees");

  const handleAuthChange = (data: {
    user: AuthUser | null;
    accessToken: string | null;
    refreshToken: string | null;
  }) => {
    setAuth(data);
    if (data.user && data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken || '');
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
        <div className="app-root">
          <Topbar
            onHamburgerClick={() => setSidebarOpen((v) => !v)}
            currentRole={auth.user.role}
            onLogout={handleLogout}
          />
          <Sidebar 
            open={sidebarOpen} 
            currentPage={currentPage}
            onNavigate={(page) => {
              setCurrentPage(page);
              setSidebarOpen(false);
            }}
          />
          <main className="app-main">
            {currentPage === "employees" && <EmployeesPage currentRole={auth.user.role} />}
            {currentPage === "dashboard" && <DashboardPage />}
            {currentPage === "notifications" && <NotificationsPage />}
            {currentPage === "reports" && <ReportsPage />}
            {currentPage === "profile" && <ProfilePage />}
            {currentPage === "preferences" && <PreferencesPage />}
            {currentPage === "settings" && <SettingsPage />}
            {currentPage === "admins" && <AdminsPage />}
            {currentPage === "accessLogs" && <AccessLogsPage />}
            {currentPage === "sendNote" && <SendNotePage />}
            {currentPage === "leaveRequests" && <LeaveRequestsPage />}
          </main>
        </div>
      )}
      </AuthContext.Provider>
    </ApolloProvider>
  );
};

export default App;
