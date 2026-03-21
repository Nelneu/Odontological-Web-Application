import React, { useState } from "react";
import { Button } from "./Button";
import { X } from "lucide-react";
import {
  treatmentStatusValues,
  treatmentStatusLabels,
  TreatmentStatus,
} from "../helpers/treatmentTypes";
import styles from "./UserFormModal.module.css";

type CreateData = {
  treatmentType: string;
  patientId: number;
  dentistId: number;
  appointmentId?: number;
  description?: string;
  toothNumber?: string;
  cost?: number;
  status?: string;
  notes?: string;
};

type EditData = {
  treatmentType?: string;
  description?: string;
  toothNumber?: string;
  cost?: number;
  status?: string;
  notes?: string;
};

type Patient = { id: number; displayName: string };
type Dentist = { id: number; displayName: string };

type Props =
  | {
      mode: "create";
      isOpen: boolean;
      onClose: () => void;
      onSubmit: (data: CreateData) => void;
      isLoading: boolean;
      error: string | null;
      patients: Patient[];
      dentists: Dentist[];
      currentUserRole: string;
      currentUserId: number;
    }
  | {
      mode: "edit";
      isOpen: boolean;
      onClose: () => void;
      onSubmit: (data: EditData) => void;
      isLoading: boolean;
      error: string | null;
      initialData: {
        treatmentType: string;
        description: string;
        toothNumber: string;
        cost: number;
        status: string;
        notes: string;
      };
    };

export const TreatmentFormModal: React.FC<Props> = (props) => {
  const { mode, isOpen, onClose, isLoading, error } = props;

  const [treatmentType, setTreatmentType] = useState(
    mode === "edit" ? props.initialData.treatmentType : "",
  );
  const [patientId, setPatientId] = useState<number>(0);
  const [dentistId, setDentistId] = useState<number>(
    mode === "create" && props.currentUserRole === "dentist" ? props.currentUserId : 0,
  );
  const [description, setDescription] = useState(
    mode === "edit" ? props.initialData.description : "",
  );
  const [toothNumber, setToothNumber] = useState(
    mode === "edit" ? props.initialData.toothNumber : "",
  );
  const [cost, setCost] = useState<string>(
    mode === "edit" ? (props.initialData.cost > 0 ? props.initialData.cost.toString() : "") : "",
  );
  const [status, setStatus] = useState(mode === "edit" ? props.initialData.status : "pending");
  const [notes, setNotes] = useState(mode === "edit" ? props.initialData.notes : "");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "create") {
      props.onSubmit({
        treatmentType,
        patientId,
        dentistId,
        description: description || undefined,
        toothNumber: toothNumber || undefined,
        cost: cost ? parseFloat(cost) : undefined,
        status,
        notes: notes || undefined,
      });
    } else {
      props.onSubmit({
        treatmentType: treatmentType || undefined,
        description: description || undefined,
        toothNumber: toothNumber || undefined,
        cost: cost ? parseFloat(cost) : undefined,
        status,
        notes: notes || undefined,
      });
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {mode === "create" ? "Nuevo Tratamiento" : "Editar Tratamiento"}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === "create" && (
            <>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="patientId">
                  Paciente
                </label>
                <select
                  id="patientId"
                  className={styles.select}
                  value={patientId}
                  onChange={(e) => setPatientId(parseInt(e.target.value) || 0)}
                  required
                >
                  <option value={0}>Seleccione un paciente</option>
                  {props.patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="dentistId">
                  Dentista
                </label>
                <select
                  id="dentistId"
                  className={styles.select}
                  value={dentistId}
                  onChange={(e) => setDentistId(parseInt(e.target.value) || 0)}
                  required
                  disabled={props.currentUserRole === "dentist"}
                >
                  <option value={0}>Seleccione un dentista</option>
                  {props.dentists.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="treatmentType">
              Tipo de Tratamiento
            </label>
            <input
              id="treatmentType"
              type="text"
              className={styles.input}
              value={treatmentType}
              onChange={(e) => setTreatmentType(e.target.value)}
              required
              placeholder="Ej: Limpieza, Extracción, Ortodoncia..."
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="toothNumber">
              Diente (opcional)
            </label>
            <input
              id="toothNumber"
              type="text"
              className={styles.input}
              value={toothNumber}
              onChange={(e) => setToothNumber(e.target.value)}
              placeholder="Ej: 14, 23, 36..."
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="description">
              Descripción
            </label>
            <textarea
              id="description"
              className={styles.input}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Descripción del tratamiento..."
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="status">
              Estado
            </label>
            <select
              id="status"
              className={styles.select}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {treatmentStatusValues.map((s) => (
                <option key={s} value={s}>
                  {treatmentStatusLabels[s]}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="cost">
              Costo
            </label>
            <input
              id="cost"
              type="number"
              className={styles.input}
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="notes">
              Notas
            </label>
            <textarea
              id="notes"
              className={styles.input}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Notas adicionales..."
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? mode === "create"
                  ? "Creando..."
                  : "Guardando..."
                : mode === "create"
                  ? "Crear Tratamiento"
                  : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
