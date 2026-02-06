import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postAppointmentsCancel, InputType } from "../endpoints/appointments/cancel_POST.schema";
import { APPOINTMENTS_QUERY_KEY } from "./useAppointments";

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointmentData: InputType) => postAppointmentsCancel(appointmentData),
    onSuccess: () => {
      toast.success("Appointment cancelled successfully.");
      queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_QUERY_KEY] });
    },
    onError: (error) => {
      console.error("Error cancelling appointment:", error);
      toast.error(error.message || "Failed to cancel appointment. Please try again.");
    },
  });
};