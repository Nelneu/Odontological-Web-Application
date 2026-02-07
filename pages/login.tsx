import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { PasswordLoginForm } from "../components/PasswordLoginForm";
import { Stethoscope } from "lucide-react";
import styles from "./login.module.css";

const LoginPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Login | Agenda Odontológica</title>
        <meta name="description" content="Login to your Agenda Odontológica account." />
      </Helmet>
      <div className={styles.pageContainer}>
        <div className={styles.loginCard}>
          <div className={styles.header}>
            <Link to="/" className={styles.logoLink}>
              <Stethoscope size={32} className={styles.logoIcon} />
              <h1 className={styles.title}>Agenda Odontológica</h1>
            </Link>
            <p className={styles.subtitle}>Bienvenido de nuevo. Inicia sesión para continuar.</p>
          </div>

          <PasswordLoginForm />

          <div className={styles.testCredentials}>
            <h3 className={styles.testTitle}>Credenciales de Prueba</h3>
            <p className={styles.testInfo}>
              <strong>Email:</strong> nelsonpullella@gmail.com
            </p>
            <p className={styles.testInfo}>
              <strong>Password:</strong> Round-Gamma-Toast-6-Light
            </p>
          </div>

          <div className={styles.footer}>
            <p>
              ¿No tienes una cuenta?{" "}
              <Link to="/register" className={styles.link}>
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
