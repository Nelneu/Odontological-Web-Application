import React, { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../helpers/useAuth";
import { PatientForm } from "../components/PatientForm";
import { Stethoscope } from "lucide-react";
import { Spinner } from "../components/Spinner";
import { Helmet } from "react-helmet";
import styles from "./register-patient.module.css";

export default function RegisterPatientPage() {
  const navigate = useNavigate();
  const { authState } = useAuth();

  useEffect(() => {
    // Only redirect "user" role as they shouldn't have access to patient registration
    // Allow patients to register family members, dentists/admins to register for their practice
    if (authState.type === "authenticated") {
      if (authState.user.role === "user") {
        navigate("/profile");
      }
    }
  }, [authState, navigate]);

  const handleRegistrationSuccess = () => {
    // The useRegisterPatient hook already handles login and navigation
    // This is just a placeholder for any additional success handling
  };

  if (authState.type === "loading") {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Registro de Paciente - Agenda Odontológica</title>
        <meta
          name="description"
          content="Cree su cuenta de paciente para gestionar sus turnos y acceder a su historial clínico."
        />
      </Helmet>
      <div className={styles.pageContainer}>
        <div className={styles.formWrapper}>
          <div className={styles.header}>
            <Stethoscope className={styles.logoIcon} />
            <h1 className={styles.title}>
              {authState.type === "authenticated"
                ? authState.user.role === "patient"
                  ? "Registrar familiar o conocido"
                  : "Registrar nuevo paciente"
                : "Crear una cuenta de paciente"}
            </h1>
            <p className={styles.subtitle}>
              {authState.type === "authenticated" ? (
                authState.user.role === "patient" ? (
                  "Complete el formulario para registrar a un familiar o conocido como nuevo paciente"
                ) : (
                  "Complete el formulario para agregar un nuevo paciente a la práctica"
                )
              ) : (
                <>
                  ¿Ya tiene una cuenta?{" "}
                  <Link to="/login" className={styles.link}>
                    Inicie sesión
                  </Link>
                </>
              )}
            </p>
          </div>

          <PatientForm mode="register" onSuccess={handleRegistrationSuccess} />
        </div>
      </div>
    </>
  );
}
