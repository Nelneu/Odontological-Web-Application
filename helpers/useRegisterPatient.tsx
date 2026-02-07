import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postRegisterPatient, InputType } from "../endpoints/patients/register_POST.schema";
import { useAuth, AUTH_QUERY_KEY } from "./useAuth";
import { toast } from "sonner";

/**
 * A React Query mutation hook for registering a new patient.
 *
 * This hook manages the entire registration flow, including creating the user
 * and patient records, and then updating the application's authentication state.
 */
export const useRegisterPatient = () => {
  const { onLogin } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InputType) => postRegisterPatient(data),
    onSuccess: (data) => {
      // Update the global authentication state with the new user session
      onLogin(data.user);
      // Invalidate auth query to be sure, although onLogin should handle it.
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      toast.success("¡Registro exitoso! Bienvenido/a.");
      // The user will be redirected or the UI will update based on the new auth state.
    },
    onError: (error) => {
      console.error("Patient registration failed:", error);
      if (error instanceof Error) {
        toast.error(
          error.message || "Ocurrió un error durante el registro. Por favor, intente de nuevo.",
        );
      } else {
        toast.error("Ocurrió un error desconocido durante el registro.");
      }
    },
  });
};
