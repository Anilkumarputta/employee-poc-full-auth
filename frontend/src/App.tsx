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
import { AuthContext, type AuthUser } from "./auth/authContext";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import { BulkActionsPage } from "./pages/BulkActionsPage";
import { AdvancedEmployeeSearch } from "./pages/AdvancedEmployeeSearch";
import { NotificationInbox } from "./pages/NotificationInbox";
import MessagingInbox from "./pages/MessagingInbox";
import SlackIntegrationPage from "./pages/SlackIntegrationPage";
import EmployeeSelfServicePortal from "./pages/EmployeeSelfServicePortal";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import type { AppPage } from "./types/navigation";
import { getStorageItem, removeStorageItem, setStorageItem } from "./lib/safeStorage";

export type UserRole = "director" | "manager" | "employee";

type View = "login" | "register" | "forgot" | "app";
const VALID_USER_ROLES: readonly UserRole[] = ["director", "manager", "employee"];

function isValidStoredUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<AuthUser>;
  return (
    typeof candidate.id === "number" &&
    Number.isFinite(candidate.id) &&
    typeof candidate.email === "string" &&
    candidate.email.length > 3 &&
    typeof candidate.role === "string" &&
    VALID_USER_ROLES.includes(candidate.role as UserRole)
  );
}

function clearPersistedAuth() {
  removeStorageItem("accessToken");
  removeStorageItem("refreshToken");
  removeStorageItem("user");
}

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
  const [currentPage, setCurrentPage] = useState<AppPage>("dashboard");

  React.useEffect(() => {
    const accessToken = getStorageItem("accessToken");
    const refreshToken = getStorageItem("refreshToken");
    const userStr = getStorageItem("user");

    if (accessToken && userStr) {
      try {
        const parsedUser: unknown = JSON.parse(userStr);
        if (!isValidStoredUser(parsedUser)) {
          throw new Error("Invalid persisted user");
        }

        setAuth({ user: parsedUser, accessToken, refreshToken: refreshToken || null });
        setView("app");
      } catch {
        clearPersistedAuth();
      }
    }
  }, []);

  const handleAuthChange = (data: {
    user: AuthUser | null;
    accessToken: string | null;
    refreshToken: string | null;
  }) => {
    setAuth(data);
    if (data.user && data.accessToken) {
      setStorageItem("accessToken", data.accessToken);
      if (data.refreshToken) {
        setStorageItem("refreshToken", data.refreshToken);
      } else {
        removeStorageItem("refreshToken");
      }
      setStorageItem("user", JSON.stringify(data.user));
      setCurrentPage("dashboard");
      setView("app");
    } else {
      clearPersistedAuth();
      setView("login");
    }
  };

  const handleLogout = () => {
    clearPersistedAuth();
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
              <LoginPage goRegister={() => setView("register")} goForgot={() => setView("forgot")} />
            )}
            {view === "register" && <RegisterPage goLogin={() => setView("login")} />}
            {view === "forgot" && <ForgotPasswordPage goLogin={() => setView("login")} />}
          </div>
        ) : (
          <div style={{ minHeight: "100vh", background: "#f5f7fa" }}>
            <HorizontalNav currentPage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout} />
            <main style={{ padding: "0" }}>
              {currentPage === "employees" && <EmployeesPage currentRole={auth.user.role} />}
              {currentPage === "dashboard" && <DashboardPage onNavigate={setCurrentPage} />}
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
              {currentPage === "leaveRequests" && <LeaveRequestsPage onNavigate={setCurrentPage} />}
              {currentPage === "employeeLogins" && <EmployeeLoginsPage />}
              {currentPage === "messages" && <MessagesPage />}
              {currentPage === "review-requests" && <ReviewRequestsPage />}
              {currentPage === "auditLogs" && <AuditLogsPage />}
              {currentPage === "bulkActions" && <BulkActionsPage />}
              {currentPage === "advancedEmployeeSearch" && <AdvancedEmployeeSearch />}
              {currentPage === "notificationInbox" && <NotificationInbox onNavigate={setCurrentPage} />}
              {currentPage === "messagingInbox" && <MessagingInbox onNavigate={setCurrentPage} />}
              {currentPage === "analyticsDashboard" && <AnalyticsDashboard />}
              {currentPage === "employeeSelfServicePortal" && <EmployeeSelfServicePortal />}
              {currentPage === "slackIntegration" && <SlackIntegrationPage />}
            </main>
          </div>
        )}
      </AuthContext.Provider>
    </ApolloProvider>
  );
};

export default App;
