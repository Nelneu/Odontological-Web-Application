export const treatmentStatusValues = [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type TreatmentStatus = (typeof treatmentStatusValues)[number];

export const treatmentStatusLabels: Record<TreatmentStatus, string> = {
  pending: "Pendiente",
  in_progress: "En Progreso",
  completed: "Completado",
  cancelled: "Cancelado",
};

export const treatmentStatusColors: Record<TreatmentStatus, string> = {
  pending: "#f59e0b",
  in_progress: "#3b82f6",
  completed: "#22c55e",
  cancelled: "#ef4444",
};
