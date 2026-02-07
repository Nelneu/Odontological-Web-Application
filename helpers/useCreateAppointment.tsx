import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { postAppointments, InputType } from "../endpoints/appointments_POST.schema";
import { APPOINTMENTS_QUERY_KEY } from "./useAppointments";

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointmentData: InputType) => postAppointments(appointmentData),
    onSuccess: () => {
      toast.success("Appointment created successfully!");
      queryClient.invalidateQueries({ queryKey: [APPOINTMENTS_QUERY_KEY] });
    },
    onError: (error) => {
      console.error("Error creating appointment:", error);
      toast.error(error.message || "Failed to create appointment. Please try again.");
    },
  });
};
