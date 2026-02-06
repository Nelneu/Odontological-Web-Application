import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import React from "react";

/**
 * Defines the types of success notifications available in the application.
 * Each key corresponds to a specific user action that can result in a success state.
 */
export type SuccessTopic =
  | "patientRegistration"
  | "profileUpdate"
  | "appointmentScheduled"
  | "appointmentCancelled"
  | "appointmentUpdated";

const successMessages: Record<
  SuccessTopic,
  { title: string; description?: string }
> = {
  patientRegistration: {
    title: "¡Registro Exitoso!",
    description: "Bienvenido/a. Ya puedes gestionar tus turnos.",
  },
  profileUpdate: {
    title: "Perfil Actualizado",
    description: "Tus datos han sido guardados correctamente.",
  },
  appointmentScheduled: {
    title: "Turno Agendado",
    description:
      "Tu turno ha sido programado con éxito. Recibirás un recordatorio.",
  },
  appointmentCancelled: {
    title: "Turno Cancelado",
    description: "El turno ha sido cancelado correctamente.",
  },
  appointmentUpdated: {
    title: "Turno Modificado",
    description: "Los detalles de tu turno han sido actualizados.",
  },
};

/**
 * A custom hook to display standardized success notifications.
 * It centralizes success messages to ensure consistency across the application.
 *
 * @example
 * const { showSuccessToast } = useSuccessToast();
 * showSuccessToast('profileUpdate');
 */
export const useSuccessToast = () => {
  /**
   * Displays a success toast notification based on the provided topic.
   * @param topic - The key corresponding to the success message to display.
   */
  const show = (topic: SuccessTopic) => {
    const message = successMessages[topic];
    if (message) {
      toast.success(message.title, {
        description: message.description,
        icon: <CheckCircle2 size={20} />,
      });
    } else {
      // This is a developer-facing warning for an unhandled topic.
      console.warn(`[useSuccessToast] Success toast topic "${topic}" not found.`);
      // Fallback toast for unhandled cases.
      toast.success("Operación exitosa", {
        icon: <CheckCircle2 size={20} />,
      });
    }
  };

  return { showSuccessToast: show };
};