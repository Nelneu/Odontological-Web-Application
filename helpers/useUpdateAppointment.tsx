import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postAppointmentsUpdate, InputType } from "../endpoints/appointments/update_POST.schema";
import { APPOINTMENTS_QUERY_KEY } from "./useAppointments";

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointmentData: InputType) => postAppointmentsUpdate(appointmentData),
    onSuccess: () => {
      toast.success("Appointment updated successfully!");
      queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_QUERY_KEY] });
    },
    onError: (error) => {
      console.error("Error updating appointment:", error);
      toast.error(error.message || "Failed to update appointment. Please try again.");
    },
  });
};
