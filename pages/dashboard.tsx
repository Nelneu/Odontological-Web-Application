import React from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "../helpers/useAuth";
import { useDashboardStats } from "../helpers/useDashboardStats";
import { Skeleton } from "../components/Skeleton";
import { OutputType } from "../endpoints/dashboard/stats_GET.schema";
import {
  AlertTriangle,
  Calendar,
  Users,
  Stethoscope,
  FileText,
  UserCheck,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
} from "lucide-react";
import styles from "./dashboard.module.css";

const DashboardPage: React.FC = () => {
  const { authState } = useAuth();
  const { data, isFetching, error } = useDashboardStats();

  const renderLoading = () => (
    <div className={styles.grid}>
      <Skeleton className={styles.statCard} style={{ height: "120px" }} />
      <Skeleton className={styles.statCard} style={{ height: "120px" }} />
      <Skeleton className={styles.statCard} style={{ height: "120px" }} />
    </div>
  );

  const renderError = () => (
    <div className={styles.errorContainer}>
      <AlertTriangle size={48} className={styles.errorIcon} />
      <h2 className={styles.errorTitle}>Error al cargar el dashboard</h2>
      <p className={styles.errorMessage}>
        {error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado. Por favor, intenta de nuevo más tarde."}
      </p>
    </div>
  );

  const renderDentistDashboard = (stats: Extract<typeof data, { role: "dentist" }>) => (
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

  const renderPatientDashboard = (stats: Extract<typeof data, { role: "patient" }>) => (
    <div className={styles.grid}>
      <div className={styles.statCard}>
        <div className={styles.cardHeader}>
          <Calendar className={styles.cardIcon} />
          <h3 className={styles.cardTitle}>Próximo Turno</h3>
        </div>
        <p className={styles.cardValue}>
          {stats.nextAppointmentDate
            ? new Date(stats.nextAppointmentDate).toLocaleDateString("es-AR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "No hay turnos"}
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

  const statusLabels: Record<string, string> = {
    programada: "Programada",
    confirmada: "Confirmada",
    completada: "Completada",
    cancelada: "Cancelada",
    ausente: "Ausente",
  };

  const statusColors: Record<string, string> = {
    programada: "var(--primary)",
    confirmada: "#22c55e",
    completada: "#3b82f6",
    cancelada: "#ef4444",
    ausente: "#f59e0b",
  };

  const renderAdminDashboard = (stats: Extract<OutputType, { role: "admin" }>) => {
    const totalStatusAppointments = Object.values(stats.appointmentsByStatus).reduce(
      (a, b) => a + b,
      0,
    );

    return (
      <div className={styles.adminDashboard}>
        {/* Row 1: Key metrics */}
        <div className={styles.grid}>
          <div className={styles.statCard}>
            <div className={styles.cardHeader}>
              <Users className={styles.cardIcon} />
              <h3 className={styles.cardTitle}>Usuarios Totales</h3>
            </div>
            <p className={styles.cardValue}>{stats.totalUsers}</p>
          </div>
          <div className={styles.statCard}>
            <div className={styles.cardHeader}>
              <UserPlus className={styles.cardIcon} />
              <h3 className={styles.cardTitle}>Pacientes</h3>
            </div>
            <p className={styles.cardValue}>{stats.totalPatients}</p>
          </div>
          <div className={styles.statCard}>
            <div className={styles.cardHeader}>
              <UserCheck className={styles.cardIcon} />
              <h3 className={styles.cardTitle}>Dentistas</h3>
            </div>
            <p className={styles.cardValue}>{stats.totalDentists}</p>
          </div>
          <div className={styles.statCard}>
            <div className={styles.cardHeader}>
              <Stethoscope className={styles.cardIcon} />
              <h3 className={styles.cardTitle}>Tratamientos</h3>
            </div>
            <p className={styles.cardValue}>{stats.totalTreatments}</p>
          </div>
        </div>

        {/* Row 2: Appointments overview */}
        <div className={styles.grid}>
          <div className={styles.statCard}>
            <div className={styles.cardHeader}>
              <Calendar className={styles.cardIcon} />
              <h3 className={styles.cardTitle}>Turnos Hoy</h3>
            </div>
            <p className={styles.cardValue}>{stats.appointmentsToday}</p>
          </div>
          <div className={styles.statCard}>
            <div className={styles.cardHeader}>
              <Clock className={styles.cardIcon} />
              <h3 className={styles.cardTitle}>Turnos Pendientes</h3>
            </div>
            <p className={styles.cardValue}>{stats.upcomingAppointments}</p>
          </div>
          <div className={styles.statCard}>
            <div className={styles.cardHeader}>
              <CheckCircle className={styles.cardIcon} />
              <h3 className={styles.cardTitle}>Completados</h3>
            </div>
            <p className={styles.cardValue}>{stats.completedAppointments}</p>
          </div>
          <div className={styles.statCard}>
            <div className={styles.cardHeader}>
              <XCircle className={styles.cardIcon} />
              <h3 className={styles.cardTitle}>Cancelados</h3>
            </div>
            <p className={styles.cardValue}>{stats.cancelledAppointments}</p>
          </div>
        </div>

        {/* Row 3: Status chart + recent patients */}
        <div className={styles.bottomSection}>
          {/* Appointments by status */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <TrendingUp className={styles.cardIcon} />
              <h3 className={styles.chartTitle}>Turnos por Estado</h3>
            </div>
            {totalStatusAppointments > 0 ? (
              <div className={styles.statusBars}>
                {Object.entries(stats.appointmentsByStatus).map(([status, count]) => (
                  <div key={status} className={styles.statusBarRow}>
                    <span className={styles.statusLabel}>
                      {statusLabels[status] || status}
                    </span>
                    <div className={styles.statusBarTrack}>
                      <div
                        className={styles.statusBarFill}
                        style={{
                          width: `${(count / totalStatusAppointments) * 100}%`,
                          backgroundColor: statusColors[status] || "var(--primary)",
                        }}
                      />
                    </div>
                    <span className={styles.statusCount}>{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyText}>No hay turnos registrados aún.</p>
            )}
          </div>

          {/* Recent patients */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <UserPlus className={styles.cardIcon} />
              <h3 className={styles.chartTitle}>Pacientes Recientes</h3>
            </div>
            {stats.recentPatients.length > 0 ? (
              <ul className={styles.recentList}>
                {stats.recentPatients.map((patient, index) => (
                  <li key={index} className={styles.recentItem}>
                    <div className={styles.recentAvatar}>
                      {patient.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.recentInfo}>
                      <span className={styles.recentName}>{patient.displayName}</span>
                      <span className={styles.recentEmail}>{patient.email}</span>
                    </div>
                    {patient.createdAt && (
                      <span className={styles.recentDate}>
                        {new Date(patient.createdAt).toLocaleDateString("es-AR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyText}>No hay pacientes registrados aún.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isFetching) return renderLoading();
    if (error) return renderError();
    if (!data) return <p>No hay datos disponibles.</p>;

    switch (data.role) {
      case "admin":
        return renderAdminDashboard(data);
      case "dentist":
        return renderDentistDashboard(data);
      case "patient":
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
            Bienvenido,{" "}
            {authState.type === "authenticated" ? authState.user.displayName : "Usuario"}.
          </p>
        </header>
        <main>{renderContent()}</main>
      </div>
    </>
  );
};

export default DashboardPage;
