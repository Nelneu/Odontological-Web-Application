import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postPatientProfile, InputType, OutputType } from "../endpoints/patients/profile_POST.schema";
import { PATIENT_PROFILE_QUERY_KEY } from "./usePatientProfile";
import { PATIENTS_QUERY_KEY } from "./usePatients";
import { toast } from "sonner";

/**
 * A React Query mutation hook for updating a patient's profile.
 *
 * This hook handles the API call to update profile data and manages
 * cache invalidation and optimistic updates for a smooth user experience.
 */
export const useUpdatePatientProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InputType) => postPatientProfile(data),
    onMutate: async (updatedProfile) => {
      const patientId = updatedProfile.patientId;
      if (!patientId) return;

      const queryKey = [PATIENT_PROFILE_QUERY_KEY, patientId];

      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData<OutputType['patient']>(queryKey);

      // Optimistically update to the new value
      if (previousProfile) {
        queryClient.setQueryData<OutputType['patient']>(queryKey, {
          ...previousProfile,
          ...updatedProfile,
        });
      }

      // Return a context object with the snapshotted value
      return { previousProfile, queryKey };
    },
    onError: (err, newProfile, context) => {
      console.error("Failed to update patient profile:", err);
      // Rollback to the previous value on error
      if (context?.previousProfile) {
        queryClient.setQueryData(context.queryKey, context.previousProfile);
      }
      toast.error("Error al actualizar el perfil. Por favor, intente de nuevo.");
    },
    onSuccess: (data, variables) => {
      toast.success("Perfil actualizado con éxito.");
      // Invalidate the specific profile query to refetch the latest data from the server
      if (variables.patientId) {
        queryClient.invalidateQueries({
          queryKey: [PATIENT_PROFILE_QUERY_KEY, variables.patientId],
        });
      }
      // Invalidate the general patients list query as the data might be stale
      queryClient.invalidateQueries({ queryKey: [PATIENTS_QUERY_KEY] });
    },
  });
};