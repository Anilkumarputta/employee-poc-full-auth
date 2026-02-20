import React, { Suspense, useEffect, useState } from "react";
import { ApolloProvider } from "@apollo/client/react";
import { apolloClient } from "./apolloClient";
import { HorizontalNav } from "./components/layout/HorizontalNav";
import { LoginPage } from "./auth/LoginPage";
import { RegisterPage } from "./auth/RegisterPage";
import { ForgotPasswordPage } from "./auth/ForgotPasswordPage";
import { AuthContext, type AuthUser } from "./auth/authContext";
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

const APP_PREFERENCES_UPDATED_EVENT = "app-preferences-updated";

function applyUiPreferences() {
  if (typeof document === "undefined") {
    return;
  }

  const savedTheme = getStorageItem("theme");
  const prefersDark =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolvedTheme =
    savedTheme === "dark" || (savedTheme === "auto" && prefersDark) ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", resolvedTheme);
  document.documentElement.style.colorScheme = resolvedTheme;

  const savedLanguage = getStorageItem("language") || "en-US";
  document.documentElement.lang = savedLanguage.toLowerCase().startsWith("en")
    ? savedLanguage
    : "en-US";
}

const EmployeesPage = React.lazy(() =>
  import("./pages/EmployeesPage").then((module) => ({ default: module.EmployeesPage })),
);
const DashboardPage = React.lazy(() =>
  import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage })),
);
const NotificationsPage = React.lazy(() =>
  import("./pages/NotificationsPage").then((module) => ({ default: module.NotificationsPage })),
);
const ReportsPage = React.lazy(() => import("./pages/ReportsPage").then((module) => ({ default: module.ReportsPage })));
const ProfilePage = React.lazy(() => import("./pages/ProfilePage").then((module) => ({ default: module.ProfilePage })));
const PreferencesPage = React.lazy(() =>
  import("./pages/PreferencesPage").then((module) => ({ default: module.PreferencesPage })),
);
const SettingsPage = React.lazy(() =>
  import("./pages/SettingsPage").then((module) => ({ default: module.SettingsPage })),
);
const AdminsPage = React.lazy(() => import("./pages/AdminsPage").then((module) => ({ default: module.AdminsPage })));
const AccessLogsPage = React.lazy(() =>
  import("./pages/AccessLogsPage").then((module) => ({ default: module.AccessLogsPage })),
);
const SendNotePage = React.lazy(() =>
  import("./pages/SendNotePage").then((module) => ({ default: module.SendNotePage })),
);
const UserManagementDashboard = React.lazy(() =>
  import("./pages/UserManagementDashboard").then((module) => ({ default: module.UserManagementDashboard })),
);
const LeaveRequestsPage = React.lazy(() =>
  import("./pages/LeaveRequestsPage").then((module) => ({ default: module.LeaveRequestsPage })),
);
const ProfileEditPage = React.lazy(() => import("./pages/ProfileEditPage"));
const EmployeeLoginsPage = React.lazy(() => import("./pages/EmployeeLoginsPage"));
const MessagesPage = React.lazy(() => import("./pages/MessagesPage").then((module) => ({ default: module.MessagesPage })));
const ReviewRequestsPage = React.lazy(() =>
  import("./pages/ReviewRequestsPage").then((module) => ({ default: module.ReviewRequestsPage })),
);
const AuditLogsPage = React.lazy(() => import("./pages/AuditLogsPage").then((module) => ({ default: module.AuditLogsPage })));
const BulkActionsPage = React.lazy(() =>
  import("./pages/BulkActionsPage").then((module) => ({ default: module.BulkActionsPage })),
);
const AdvancedEmployeeSearch = React.lazy(() =>
  import("./pages/AdvancedEmployeeSearch").then((module) => ({ default: module.AdvancedEmployeeSearch })),
);
const NotificationInbox = React.lazy(() =>
  import("./pages/NotificationInbox").then((module) => ({ default: module.NotificationInbox })),
);
const MessagingInbox = React.lazy(() => import("./pages/MessagingInbox"));
const SlackIntegrationPage = React.lazy(() => import("./pages/SlackIntegrationPage"));
const EmployeeSelfServicePortal = React.lazy(() => import("./pages/EmployeeSelfServicePortal"));
const AnalyticsDashboard = React.lazy(() => import("./pages/AnalyticsDashboard"));

const AppPageFallback = () => (
  <div style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>Loading page...</div>
);

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

  useEffect(() => {
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

  useEffect(() => {
    applyUiPreferences();

    const handlePreferencesChanged = () => {
      applyUiPreferences();
    };

    window.addEventListener(APP_PREFERENCES_UPDATED_EVENT, handlePreferencesChanged);
    window.addEventListener("storage", handlePreferencesChanged);

    return () => {
      window.removeEventListener(APP_PREFERENCES_UPDATED_EVENT, handlePreferencesChanged);
      window.removeEventListener("storage", handlePreferencesChanged);
    };
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
          <div style={{ minHeight: "100vh", background: "var(--app-shell-bg, #f5f7fa)" }}>
            <HorizontalNav currentPage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout} />
            <main style={{ padding: "0", paddingTop: "72px" }}>
              <Suspense fallback={<AppPageFallback />}>
                {currentPage === "employees" && <EmployeesPage currentRole={auth.user.role} />}
                {currentPage === "dashboard" && <DashboardPage onNavigate={setCurrentPage} />}
                {currentPage === "notifications" && <NotificationsPage />}
                {currentPage === "reports" && <ReportsPage />}
                {currentPage === "profile" && <ProfilePage onNavigate={setCurrentPage} />}
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
              </Suspense>
            </main>
          </div>
        )}
      </AuthContext.Provider>
    </ApolloProvider>
  );
};

export default App;
