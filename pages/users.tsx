import React, { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "../helpers/useUsers";
import { UserFormModal } from "../components/UserFormModal";
import { Button } from "../components/Button";
import { Spinner } from "../components/Spinner";
import { Skeleton } from "../components/Skeleton";
import { toast } from "sonner";
import { Users, Plus, Pencil, Trash2, Search } from "lucide-react";
import { UserRole } from "../helpers/schema";
import { UserRecord } from "../endpoints/users_GET.schema";
import styles from "./users.module.css";

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  dentist: "Dentista",
  patient: "Paciente",
  user: "Usuario",
};

const roleStyleMap: Record<UserRole, string> = {
  admin: styles.roleAdmin,
  dentist: styles.roleDentist,
  patient: styles.rolePatient,
  user: styles.roleUser,
};

export default function UsersPage() {
  const { data, isFetching } = useUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const [modalState, setModalState] = useState<
    | { type: "closed" }
    | { type: "create" }
    | { type: "edit"; user: UserRecord }
  >({ type: "closed" });

  const [deleteConfirm, setDeleteConfirm] = useState<UserRecord | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    if (!data?.users) return [];
    return data.users.filter((u) => {
      const matchesSearch =
        searchTerm === "" ||
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [data, searchTerm, roleFilter]);

  const handleCreate = async (formData: {
    email: string;
    password: string;
    displayName: string;
    role: UserRole;
  }) => {
    setFormError(null);
    try {
      await createMutation.mutateAsync(formData);
      toast.success("Usuario creado exitosamente");
      setModalState({ type: "closed" });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al crear usuario");
    }
  };

  const handleUpdate = async (
    userId: number,
    formData: { displayName: string; role: UserRole },
  ) => {
    setFormError(null);
    try {
      await updateMutation.mutateAsync({ userId, ...formData });
      toast.success("Usuario actualizado exitosamente");
      setModalState({ type: "closed" });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al actualizar usuario");
    }
  };

  const handleDelete = async (userId: number) => {
    try {
      await deleteMutation.mutateAsync({ userId });
      toast.success("Usuario eliminado exitosamente");
      setDeleteConfirm(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar usuario");
      setDeleteConfirm(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Gestión de Usuarios | Agenda Odontológica</title>
        <meta name="description" content="Administre los usuarios del sistema." />
      </Helmet>

      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>
              <Users size={28} />
              Gestión de Usuarios
            </h1>
            <p className={styles.subtitle}>
              {data?.users ? `${data.users.length} usuarios registrados` : "Cargando..."}
            </p>
          </div>
          <Button onClick={() => { setFormError(null); setModalState({ type: "create" }); }}>
            <Plus size={16} />
            Crear Usuario
          </Button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className={styles.filterSelect}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="dentist">Dentista</option>
            <option value="patient">Paciente</option>
            <option value="user">Usuario</option>
          </select>
        </div>

        {/* Table */}
        {isFetching && !data ? (
          <div className={styles.loadingContainer}>
            <Spinner size="lg" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className={styles.emptyState}>
            <Search size={48} />
            <h3>No se encontraron usuarios</h3>
            <p>
              {searchTerm || roleFilter !== "all"
                ? "Intente ajustar los filtros de búsqueda."
                : "No hay usuarios registrados en el sistema."}
            </p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Fecha de Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.userAvatar}>
                          {u.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.userInfo}>
                          <span className={styles.userName}>{u.displayName}</span>
                          <span className={styles.userEmail}>{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.roleBadge} ${roleStyleMap[u.role] || styles.roleUser}`}>
                        {roleLabels[u.role] || u.role}
                      </span>
                    </td>
                    <td>
                      <span className={styles.dateText}>
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString("es-AR", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "-"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          className={styles.iconButton}
                          title="Editar usuario"
                          onClick={() => {
                            setFormError(null);
                            setModalState({ type: "edit", user: u });
                          }}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                          title="Eliminar usuario"
                          onClick={() => setDeleteConfirm(u)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create modal */}
      {modalState.type === "create" && (
        <UserFormModal
          mode="create"
          isOpen
          onClose={() => setModalState({ type: "closed" })}
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
          error={formError}
        />
      )}

      {/* Edit modal */}
      {modalState.type === "edit" && (
        <UserFormModal
          mode="edit"
          isOpen
          onClose={() => setModalState({ type: "closed" })}
          onSubmit={(data) => handleUpdate(modalState.user.id, data)}
          isLoading={updateMutation.isPending}
          error={formError}
          initialData={{
            displayName: modalState.user.displayName,
            role: modalState.user.role,
          }}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>Confirmar Eliminación</h3>
            <p className={styles.confirmMessage}>
              ¿Está seguro de que desea eliminar al usuario{" "}
              <strong>{deleteConfirm.displayName}</strong> ({deleteConfirm.email})? Esta acción no
              se puede deshacer.
            </p>
            <div className={styles.confirmActions}>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
