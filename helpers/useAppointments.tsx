import { useQuery } from "@tanstack/react-query";
import { getAppointments, InputType } from "../endpoints/appointments_GET.schema";

export const APPOINTMENTS_QUERY_KEY = "appointments";

export const useAppointments = (params?: InputType) => {
  return useQuery({
    queryKey: [APPOINTMENTS_QUERY_KEY, params],
    queryFn: () => getAppointments(params),
  });
};