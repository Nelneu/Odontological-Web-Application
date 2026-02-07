import { useQuery } from "@tanstack/react-query";
import { getPatients } from "../endpoints/patients_GET.schema";

export const PATIENTS_QUERY_KEY = "patients";

export const usePatients = () => {
  return useQuery({
    queryKey: [PATIENTS_QUERY_KEY],
    queryFn: () => getPatients(),
  });
};
