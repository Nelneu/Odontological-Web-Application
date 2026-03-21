import React, { useState } from "react";
import { Button } from "./Button";
import { X } from "lucide-react";
import { UserRole, UserRoleArrayValues } from "../helpers/schema";
import styles from "./UserFormModal.module.css";

type UserFormData = {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
};

type EditUserFormData = {
  displayName: string;
  role: UserRole;
};

type Props =
  | {
      mode: "create";
      isOpen: boolean;
      onClose: () => void;
      onSubmit: (data: UserFormData) => void;
      isLoading: boolean;
      error: string | null;
    }
  | {
      mode: "edit";
      isOpen: boolean;
      onClose: () => void;
      onSubmit: (data: EditUserFormData) => void;
      isLoading: boolean;
      error: string | null;
      initialData: { displayName: string; role: UserRole };
    };

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  dentist: "Dentista",
  patient: "Paciente",
  user: "Usuario",
};

export const UserFormModal: React.FC<Props> = (props) => {
  const { mode, isOpen, onClose, isLoading, error } = props;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState(
    mode === "edit" ? props.initialData.displayName : "",
  );
  const [role, setRole] = useState<UserRole>(mode === "edit" ? props.initialData.role : "user");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "create") {
      props.onSubmit({ email, password, displayName, role });
    } else {
      props.onSubmit({ displayName, role });
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {mode === "create" ? "Crear Usuario" : "Editar Usuario"}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {mode === "create" && (
            <>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className={styles.input}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="usuario@ejemplo.com"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="password">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  className={styles.input}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
            </>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="displayName">
              Nombre
            </label>
            <input
              id="displayName"
              type="text"
              className={styles.input}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="Nombre completo"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="role">
              Rol
            </label>
            <select
              id="role"
              className={styles.select}
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              {UserRoleArrayValues.map((r) => (
                <option key={r} value={r}>
                  {roleLabels[r]}
                </option>
              ))}
            </select>
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
                  ? "Crear Usuario"
                  : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
