import React from "react";
import { useAuth } from "../helpers/useAuth";
import { usePatients } from "../helpers/usePatients";
import { PatientProfileCard } from "../components/PatientProfileCard";
import { Button } from "../components/Button";
import { Download, User, Users } from "lucide-react";
import { Spinner } from "../components/Spinner";
import { Skeleton } from "../components/Skeleton";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import styles from "./profile.module.css";

export default function ProfilePage() {
  const { authState } = useAuth();
  const { data: patientsData, isFetching: isLoadingPatients } = usePatients();

  const handleDownloadData = () => {
    // This would need to be implemented to fetch the current user's data
    // For now, we'll show a placeholder
    console.log("Download data functionality would be implemented here");
  };

  if (authState.type === "loading") {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (authState.type === "unauthenticated") {
    return (
      <div className={styles.errorContainer}>
        <h2>Acceso no autorizado</h2>
        <p>Debe iniciar sesión para ver su perfil.</p>
      </div>
    );
  }

  const { user } = authState;

  // Patient view - show their own profile
  if (user.role === "patient") {
    return (
      <>
        <Helmet>
          <title>Mi Perfil - Agenda Odontológica</title>
          <meta
            name="description"
            content="Vea y actualice su información personal, de contacto y médica."
          />
        </Helmet>
        <div className={styles.pageContainer}>
          <div className={styles.header}>
            <h1 className={styles.title}>Mi Perfil</h1>
            <div className={styles.headerActions}>
              <Button variant="outline" onClick={handleDownloadData}>
                <Download size={16} />
                Descargar mis datos
              </Button>
            </div>
          </div>

          <PatientProfileCard />
        </div>
      </>
    );
  }

  // Dentist/Admin view - show patient list
  return (
    <>
      <Helmet>
        <title>Gestión de Pacientes - Agenda Odontológica</title>
        <meta name="description" content="Administre y vea los perfiles de los pacientes." />
      </Helmet>
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            <Users size={24} />
            Gestión de Pacientes
          </h1>
        </div>

        {isLoadingPatients ? (
          <div className={styles.patientsGrid}>
            {[...Array(6)].map((_, index) => (
              <div key={index} className={styles.patientCardSkeleton}>
                <Skeleton style={{ width: "64px", height: "64px", borderRadius: "50%" }} />
                <div className={styles.patientInfoSkeleton}>
                  <Skeleton style={{ width: "150px", height: "20px" }} />
                  <Skeleton style={{ width: "120px", height: "16px" }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.patientsGrid}>
            {patientsData?.patients?.map((patient) => (
              <Link
                key={patient.id}
                to={`/profile?patientId=${patient.id}`}
                className={styles.patientCard}
              >
                <div className={styles.patientAvatar}>
                  <User size={24} />
                </div>
                <div className={styles.patientInfo}>
                  <h3 className={styles.patientName}>{patient.displayName}</h3>
                  <p className={styles.patientEmail}>{patient.email}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {patientsData?.patients?.length === 0 && (
          <div className={styles.emptyState}>
            <Users size={48} />
            <h3>No hay pacientes registrados</h3>
            <p>Los pacientes aparecerán aquí una vez que se registren en el sistema.</p>
          </div>
        )}
      </div>
    </>
  );
}
