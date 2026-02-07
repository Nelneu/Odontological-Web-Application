import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../helpers/useAuth";
import { Button } from "./Button";
import { Stethoscope, LogOut, User, LayoutDashboard, Calendar } from "lucide-react";
import styles from "./SharedLayout.module.css";
import { Spinner } from "./Spinner";

export const SharedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authState, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const renderAuthControls = () => {
    switch (authState.type) {
      case "loading":
        return <Spinner size="sm" />;
      case "authenticated":
        return (
          <div className={styles.authControls}>
            <span className={styles.userName}>{authState.user.displayName}</span>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard">
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/calendar">
                <Calendar size={16} />
                Calendario
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/profile">
                <User size={16} />
                Perfil
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut size={16} />
              Cerrar Sesión
            </Button>
          </div>
        );
      case "unauthenticated":
        return (
          <div className={styles.authControls}>
            <Button variant="ghost" asChild>
              <Link to="/register-patient">Registrarse</Link>
            </Button>
            <Button asChild>
              <Link to="/login">Iniciar Sesión</Link>
            </Button>
          </div>
        );
    }
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Link to="/" className={styles.logo}>
            <Stethoscope className={styles.logoIcon} size={28} />
            <span className={styles.logoText}>Agenda Odontológica</span>
          </Link>
          <nav className={styles.nav}>{renderAuthControls()}</nav>
        </div>
      </header>
      <main className={styles.mainContent}>{children}</main>
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Agenda Odontológica. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};
