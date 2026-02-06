import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { useAuth } from "../helpers/useAuth";
import { CheckCircle, Calendar, User, FileText } from "lucide-react";
import styles from "./_index.module.css";

const IndexPage: React.FC = () => {
  const { authState } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authState.type === "authenticated") {
      navigate("/dashboard", { replace: true });
    }
  }, [authState, navigate]);

  if (authState.type === "loading" || authState.type === "authenticated") {
    // Render a minimal loading state or nothing to avoid flashing content before redirect
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Agenda Odontológica | Modern Dental Practice Management</title>
        <meta
          name="description"
          content="Streamline your dental practice with our modern, intuitive management system. Handle appointments, patient records, and clinical history with ease."
        />
      </Helmet>
      <div className={styles.pageContainer}>
        <main>
          <section className={styles.hero}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                Transformando la gestión de tu consultorio dental.
              </h1>
              <p className={styles.heroSubtitle}>
                Agenda Odontológica es la solución integral para administrar
                turnos, pacientes e historiales clínicos de forma simple y
                eficiente.
              </p>
              <div className={styles.heroActions}>
                <Button asChild size="lg">
                  <Link to="/login">Comenzar ahora</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="#features">Conocer más</Link>
                </Button>
              </div>
            </div>
            <div className={styles.heroImageContainer}>
              <img
                src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80"
                alt="Dentist working with a patient"
                className={styles.heroImage}
              />
            </div>
          </section>

          <section id="features" className={styles.features}>
            <h2 className={styles.sectionTitle}>Todo lo que necesitas, en un solo lugar</h2>
            <p className={styles.sectionSubtitle}>
              Herramientas poderosas diseñadas para odontólogos y pacientes.
            </p>
            <div className={styles.featuresGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <Calendar size={24} />
                </div>
                <h3 className={styles.featureTitle}>Gestión de Turnos</h3>
                <p className={styles.featureDescription}>
                  Agenda inteligente con recordatorios automáticos para minimizar
                  ausencias y optimizar tu tiempo.
                </p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <User size={24} />
                </div>
                <h3 className={styles.featureTitle}>Registro de Pacientes</h3>
                <p className={styles.featureDescription}>
                  Centraliza la información de tus pacientes de forma segura y
                  accesible desde cualquier dispositivo.
                </p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>
                  <FileText size={24} />
                </div>
                <h3 className={styles.featureTitle}>Historial Clínico Digital</h3>
                <p className={styles.featureDescription}>
                  Registra tratamientos, sube imágenes y sigue la evolución de
                  cada caso de manera ordenada y profesional.
                </p>
              </div>
            </div>
          </section>

          <section className={styles.ctaSection}>
            <h2 className={styles.ctaTitle}>Listo para simplificar tu práctica?</h2>
            <p className={styles.ctaText}>
              Únete a los profesionales que ya están optimizando su consultorio.
            </p>
            <Button asChild size="lg" className={styles.ctaButton}>
              <Link to="/login">Empezar gratis</Link>
            </Button>
          </section>
        </main>
      </div>
    </>
  );
};

export default IndexPage;