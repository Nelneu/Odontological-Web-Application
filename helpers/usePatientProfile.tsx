import { useQuery } from "@tanstack/react-query";
import { getPatientProfile, InputType } from "../endpoints/patients/profile_GET.schema";

export const PATIENT_PROFILE_QUERY_KEY = "patientProfile";

/**
 * A React Query hook for fetching a patient's profile.
 *
 * @param params - The input parameters for the query, containing an optional `patientId`.
 *   - If `patientId` is not provided, the API will attempt to fetch the profile of the currently logged-in patient.
 *   - If `patientId` is provided, it will fetch that specific patient's profile, subject to role permissions.
 * @param options - Optional React Query options.
 */
export const usePatientProfile = (
  params: InputType,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: [PATIENT_PROFILE_QUERY_KEY, params.patientId],
    queryFn: () => getPatientProfile(params),
    enabled: options?.enabled,
  });
};