import React, { useState } from "react";
import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "./apolloClient";
import { EmployeesPage } from "./pages/EmployeesPage";
import { Topbar } from "./components/layout/Topbar";
import { Sidebar } from "./components/layout/Sidebar";
import { LoginPage } from "./auth/LoginPage";
import { RegisterPage } from "./auth/RegisterPage";
import { ForgotPasswordPage } from "./auth/ForgotPasswordPage";
import { AuthContext, AuthUser } from "./auth/authContext";

export type UserRole = "admin" | "employee";

type View = "login" | "register" | "forgot" | "app";

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
          <Sidebar open={sidebarOpen} />
          <main className="app-main">
            <EmployeesPage currentRole={auth.user.role} />
          </main>
        </div>
      )}
      </AuthContext.Provider>
    </ApolloProvider>
  );
};

export default App;
