import React, { useState } from 'react';
import { usePatientProfile } from '../helpers/usePatientProfile';
import { PatientForm } from './PatientForm';
import { useSuccessToast } from '../helpers/useSuccessToast';
import { Skeleton } from './Skeleton';
import { Button } from './Button';
import { Badge } from './Badge';
import { User, Mail, Phone, Home, Gift, Shield, HeartPulse, AlertTriangle, Edit, X } from 'lucide-react';
import styles from './PatientProfileCard.module.css';

interface PatientProfileCardProps {
  patientId?: number;
  className?: string;
}

const ProfileSkeleton: React.FC = () => (
  <div className={styles.card}>
    <div className={styles.header}>
      <Skeleton style={{ width: '64px', height: '64px', borderRadius: '50%' }} />
      <div className={styles.headerInfo}>
        <Skeleton style={{ width: '200px', height: '24px' }} />
        <Skeleton style={{ width: '150px', height: '16px' }} />
      </div>
    </div>
    <div className={styles.section}>
      <Skeleton style={{ width: '180px', height: '20px', marginBottom: 'var(--spacing-4)' }} />
      <div className={styles.infoGrid}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={styles.infoItem}>
            <Skeleton style={{ width: '24px', height: '24px' }} />
            <Skeleton style={{ width: '120px', height: '16px' }} />
          </div>
        ))}
      </div>
    </div>
    <div className={styles.section}>
      <Skeleton style={{ width: '180px', height: '20px', marginBottom: 'var(--spacing-4)' }} />
      <Skeleton style={{ width: '100%', height: '40px' }} />
    </div>
  </div>
);

export const PatientProfileCard: React.FC<PatientProfileCardProps> = ({ patientId, className }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { data: patient, isFetching, error } = usePatientProfile({ patientId }, { enabled: !isEditing });
  const { showSuccessToast } = useSuccessToast();

  if (isFetching) {
    return <ProfileSkeleton />;
  }

  if (error) {
    return (
      <div className={`${styles.card} ${styles.errorCard} ${className || ''}`}>
        <AlertTriangle className={styles.errorIcon} />
        <p>Error al cargar el perfil del paciente.</p>
        <p className={styles.errorMessage}>{error.message}</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className={`${styles.card} ${className || ''}`}>
        <p>No se encontró información del paciente.</p>
      </div>
    );
  }

  const handleEditSuccess = () => {
    setIsEditing(false);
  };

  return (
    <div className={`${styles.card} ${className || ''}`}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          <User size={32} />
        </div>
        <div className={styles.headerInfo}>
          <h2 className={styles.displayName}>{patient.displayName}</h2>
          <p className={styles.email}>{patient.email}</p>
        </div>
        <div className={styles.actions}>
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? <X size={20} /> : <Edit size={20} />}
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className={styles.formContainer}>
          <PatientForm mode="edit" patient={patient} onSuccess={handleEditSuccess} />
        </div>
      ) : (
        <>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Información Personal</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <Gift size={18} className={styles.infoIcon} />
                <span>{patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('es-AR') : 'No especificado'}</span>
              </div>
              <div className={styles.infoItem}>
                <Phone size={18} className={styles.infoIcon} />
                <span>{patient.phone || 'No especificado'}</span>
              </div>
              <div className={styles.infoItem} style={{ gridColumn: '1 / -1' }}>
                <Home size={18} className={styles.infoIcon} />
                <span>{patient.address || 'No especificado'}</span>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Información Médica</h3>
            <div className={styles.medicalInfo}>
              <h4>Alergias</h4>
              {patient.allergies ? (
                <Badge variant="warning">{patient.allergies}</Badge>
              ) : (
                <p>Ninguna reportada.</p>
              )}
            </div>
            <div className={styles.medicalInfo}>
              <h4>Historial Médico Relevante</h4>
              <p>{patient.medicalHistory || 'Ninguno reportado.'}</p>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Contacto de Emergencia</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <Shield size={18} className={styles.infoIcon} />
                <span>{patient.emergencyContactName || 'No especificado'}</span>
              </div>
              <div className={styles.infoItem}>
                <HeartPulse size={18} className={styles.infoIcon} />
                <span>{patient.emergencyContactPhone || 'No especificado'}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};