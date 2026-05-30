import React, { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "../helpers/useAuth";
import {
  useTreatments,
  useCreateTreatment,
  useUpdateTreatment,
  useDeleteTreatment,
} from "../helpers/useTreatments";
import { usePatients } from "../helpers/usePatients";
import { useQuery } from "@tanstack/react-query";
import { getDentists } from "../endpoints/dentists_GET.schema";
import { TreatmentFormModal } from "../components/TreatmentFormModal";
import { Button } from "../components/Button";
import { Spinner } from "../components/Spinner";
import { toast } from "sonner";
import { Stethoscope, Plus, Pencil, Trash2, Search } from "lucide-react";
import {
  treatmentStatusLabels,
  treatmentStatusColors,
  TreatmentStatus,
} from "../helpers/treatmentTypes";
import { TreatmentRecord } from "../endpoints/treatments_GET.schema";
import styles from "./treatments.module.css";

export default function TreatmentsPage() {
  const { authState } = useAuth();
  const { data, isFetching } = useTreatments();
  const { data: patientsData } = usePatients();
  const { data: dentistsData } = useQuery({
    queryKey: ["dentists"],
    queryFn: getDentists,
  });

  const createMutation = useCreateTreatment();
  const updateMutation = useUpdateTreatment();
  const deleteMutation = useDeleteTreatment();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [modalState, setModalState] = useState<
    | { type: "closed" }
    | { type: "create" }
    | { type: "edit"; treatment: TreatmentRecord }
  >({ type: "closed" });

  const [deleteConfirm, setDeleteConfirm] = useState<TreatmentRecord | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const currentUser =
    authState.type === "authenticated" ? authState.user : null;
  const isAdmin = currentUser?.role === "admin";

  const filteredTreatments = useMemo(() => {
    if (!data?.treatments) return [];
    return data.treatments.filter((t) => {
      const matchesSearch =
        searchTerm === "" ||
        t.treatmentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.patientName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.dentistName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.toothNumber ?? "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, searchTerm, statusFilter]);

  const handleCreate = async (formData: {
    treatmentType: string;
    patientId: number;
    dentistId: number;
    description?: string;
    toothNumber?: string;
    cost?: number;
    status?: string;
    notes?: string;
  }) => {
    setFormError(null);
    try {
      await createMutation.mutateAsync(formData);
      toast.success("Tratamiento creado exitosamente");
      setModalState({ type: "closed" });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al crear tratamiento");
    }
  };

  const handleUpdate = async (
    treatmentId: number,
    formData: {
      treatmentType?: string;
      description?: string;
      toothNumber?: string;
      cost?: number;
      status?: string;
      notes?: string;
    },
  ) => {
    setFormError(null);
    try {
      await updateMutation.mutateAsync({ treatmentId, ...formData });
      toast.success("Tratamiento actualizado exitosamente");
      setModalState({ type: "closed" });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al actualizar tratamiento");
    }
  };

  const handleDelete = async (treatmentId: number) => {
    try {
      await deleteMutation.mutateAsync({ treatmentId });
      toast.success("Tratamiento eliminado exitosamente");
      setDeleteConfirm(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar tratamiento");
      setDeleteConfirm(null);
    }
  };

  const formatCost = (cost: string | null) => {
    if (!cost) return "-";
    const num = parseFloat(cost);
    return isNaN(num) ? "-" : `$${num.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
  };

  return (
    <>
      <Helmet>
        <title>Tratamientos | Agenda Odontológica</title>
        <meta name="description" content="Gestione los tratamientos odontológicos." />
      </Helmet>

      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>
              <Stethoscope size={28} />
              Tratamientos
            </h1>
            <p className={styles.subtitle}>
              {data?.treatments
                ? `${data.treatments.length} tratamientos registrados`
                : "Cargando..."}
            </p>
          </div>
          <Button
            onClick={() => {
              setFormError(null);
              setModalState({ type: "create" });
            }}
          >
            <Plus size={16} />
            Nuevo Tratamiento
          </Button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por tipo, paciente, dentista o diente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="in_progress">En Progreso</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        {/* Table */}
        {isFetching && !data ? (
          <div className={styles.loadingContainer}>
            <Spinner size="lg" />
          </div>
        ) : filteredTreatments.length === 0 ? (
          <div className={styles.emptyState}>
            <Search size={48} />
            <h3>No se encontraron tratamientos</h3>
            <p>
              {searchTerm || statusFilter !== "all"
                ? "Intente ajustar los filtros de búsqueda."
                : "No hay tratamientos registrados. Cree uno nuevo para comenzar."}
            </p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Dentista</th>
                  <th>Tipo</th>
                  <th>Diente</th>
                  <th>Estado</th>
                  <th>Costo</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredTreatments.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span className={styles.cellText}>{t.patientName || "-"}</span>
                    </td>
                    <td>
                      <span className={styles.cellText}>{t.dentistName || "-"}</span>
                    </td>
                    <td>
                      <span className={styles.cellTextBold}>{t.treatmentType}</span>
                    </td>
                    <td>
                      <span className={styles.cellText}>{t.toothNumber || "-"}</span>
                    </td>
                    <td>
                      <span
                        className={styles.statusBadge}
                        style={{
                          backgroundColor: `${treatmentStatusColors[t.status as TreatmentStatus] || "#9ca3af"}20`,
                          color: treatmentStatusColors[t.status as TreatmentStatus] || "#9ca3af",
                        }}
                      >
                        {treatmentStatusLabels[t.status as TreatmentStatus] || t.status || "-"}
                      </span>
                    </td>
                    <td>
                      <span className={styles.cellText}>{formatCost(t.cost)}</span>
                    </td>
                    <td>
                      <span className={styles.dateText}>
                        {t.createdAt
                          ? new Date(t.createdAt).toLocaleDateString("es-AR", {
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
                          title="Editar tratamiento"
                          onClick={() => {
                            setFormError(null);
                            setModalState({ type: "edit", treatment: t });
                          }}
                        >
                          <Pencil size={16} />
                        </button>
                        {isAdmin && (
                          <button
                            className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                            title="Eliminar tratamiento"
                            onClick={() => setDeleteConfirm(t)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
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
      {modalState.type === "create" && currentUser && (
        <TreatmentFormModal
          mode="create"
          isOpen
          onClose={() => setModalState({ type: "closed" })}
          onSubmit={handleCreate}
          isLoading={createMutation.isPending}
          error={formError}
          patients={
            patientsData?.patients.map((p) => ({ id: p.id, displayName: p.displayName })) ?? []
          }
          dentists={dentistsData?.dentists ?? []}
          currentUserRole={currentUser.role}
          currentUserId={currentUser.id}
        />
      )}

      {/* Edit modal */}
      {modalState.type === "edit" && (
        <TreatmentFormModal
          mode="edit"
          isOpen
          onClose={() => setModalState({ type: "closed" })}
          onSubmit={(data) => handleUpdate(modalState.treatment.id, data)}
          isLoading={updateMutation.isPending}
          error={formError}
          initialData={{
            treatmentType: modalState.treatment.treatmentType,
            description: modalState.treatment.description ?? "",
            toothNumber: modalState.treatment.toothNumber ?? "",
            cost: parseFloat(modalState.treatment.cost ?? "0") || 0,
            status: modalState.treatment.status ?? "pending",
            notes: modalState.treatment.notes ?? "",
          }}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteConfirm(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>Confirmar Eliminación</h3>
            <p className={styles.confirmMessage}>
              ¿Está seguro de que desea eliminar el tratamiento{" "}
              <strong>{deleteConfirm.treatmentType}</strong>
              {deleteConfirm.patientName ? ` de ${deleteConfirm.patientName}` : ""}? Esta acción no
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
