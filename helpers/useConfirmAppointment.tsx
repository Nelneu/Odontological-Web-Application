import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postAppointmentsConfirm, InputType } from "../endpoints/appointments/confirm_POST.schema";
import { APPOINTMENTS_QUERY_KEY } from "./useAppointments";

export const useConfirmAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointmentData: InputType) => postAppointmentsConfirm(appointmentData),
    onSuccess: () => {
      toast.success("Appointment confirmed successfully!");
      queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_QUERY_KEY] });
    },
    onError: (error) => {
      console.error("Error confirming appointment:", error);
      toast.error(error.message || "Failed to confirm appointment. Please try again.");
    },
  });
};
