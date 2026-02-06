import React from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "../helpers/useAuth";
import { useDashboardStats } from "../helpers/useDashboardStats";
import { Skeleton } from "../components/Skeleton";
import { AlertTriangle, Calendar, Users, Stethoscope, FileText } from "lucide-react";
import styles from "./dashboard.module.css";

const DashboardPage: React.FC = () => {
  const { authState } = useAuth();
  const { data, isFetching, error } = useDashboardStats();

  const renderLoading = () => (
    <div className={styles.grid}>
      <Skeleton className={styles.statCard} style={{ height: '120px' }} />
      <Skeleton className={styles.statCard} style={{ height: '120px' }} />
      <Skeleton className={styles.statCard} style={{ height: '120px' }} />
    </div>
  );

  const renderError = () => (
    <div className={styles.errorContainer}>
      <AlertTriangle size={48} className={styles.errorIcon} />
      <h2 className={styles.errorTitle}>Error al cargar el dashboard</h2>
      <p className={styles.errorMessage}>
        {error instanceof Error ? error.message : "Ocurrió un error inesperado. Por favor, intenta de nuevo más tarde."}
      </p>
    </div>
  );

  const renderDentistDashboard = (stats: Extract<typeof data, { role: 'dentist' }>) => (
    <div className={styles.grid}>
      <div className={styles.statCard}>
        <div className={styles.cardHeader}>
          <Calendar className={styles.cardIcon} />
          <h3 className={styles.cardTitle}>Turnos de Hoy</h3>
        </div>
        <p className={styles.cardValue}>{stats.appointmentsToday}</p>
      </div>
      <div className={styles.statCard}>
        <div className={styles.cardHeader}>
          <Users className={styles.cardIcon} />
          <h3 className={styles.cardTitle}>Pacientes Totales</h3>
        </div>
        <p className={styles.cardValue}>{stats.totalPatients}</p>
      </div>
      <div className={styles.statCard}>
        <div className={styles.cardHeader}>
          <Stethoscope className={styles.cardIcon} />
          <h3 className={styles.cardTitle}>Próximos Turnos</h3>
        </div>
        <p className={styles.cardValue}>{stats.upcomingAppointments}</p>
      </div>
    </div>
  );

  const renderPatientDashboard = (stats: Extract<typeof data, { role: 'patient' }>) => (
    <div className={styles.grid}>
      <div className={styles.statCard}>
        <div className={styles.cardHeader}>
          <Calendar className={styles.cardIcon} />
          <h3 className={styles.cardTitle}>Próximo Turno</h3>
        </div>
        <p className={styles.cardValue}>
          {stats.nextAppointmentDate 
            ? new Date(stats.nextAppointmentDate).toLocaleDateString('es-AR', {
                year: 'numeric', month: 'long', day: 'numeric' 
              }) 
            : 'No hay turnos'}
        </p>
      </div>
      <div className={styles.statCard}>
        <div className={styles.cardHeader}>
          <FileText className={styles.cardIcon} />
          <h3 className={styles.cardTitle}>Tratamientos</h3>
        </div>
        <p className={styles.cardValue}>{stats.treatmentsCount}</p>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isFetching) return renderLoading();
    if (error) return renderError();
    if (!data) return <p>No hay datos disponibles.</p>;

    switch (data.role) {
      case 'dentist':
        return renderDentistDashboard(data);
      case 'patient':
        return renderPatientDashboard(data);
      default:
        return <p>Bienvenido. Su rol ({data.role}) no tiene un dashboard específico.</p>;
    }
  };

  return (
    <>
      <Helmet>
        <title>Dashboard | Agenda Odontológica</title>
        <meta name="description" content="Your personal dashboard for Agenda Odontológica." />
      </Helmet>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            Bienvenido, {authState.type === 'authenticated' ? authState.user.displayName : 'Usuario'}.
          </p>
        </header>
        <main>
          {renderContent()}
        </main>
      </div>
    </>
  );
};

export default DashboardPage;