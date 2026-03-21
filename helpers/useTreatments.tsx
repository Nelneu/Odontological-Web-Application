import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTreatments } from "../endpoints/treatments_GET.schema";
import {
  createTreatment,
  InputType as CreateInput,
} from "../endpoints/treatments/create_POST.schema";
import {
  updateTreatment,
  InputType as UpdateInput,
} from "../endpoints/treatments/update_POST.schema";
import {
  deleteTreatment,
  InputType as DeleteInput,
} from "../endpoints/treatments/delete_POST.schema";

export const TREATMENTS_QUERY_KEY = "treatments";

export const useTreatments = (patientId?: number) => {
  return useQuery({
    queryKey: [TREATMENTS_QUERY_KEY, patientId],
    queryFn: () => getTreatments(patientId ? { patientId } : undefined),
  });
};

export const useCreateTreatment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInput) => createTreatment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TREATMENTS_QUERY_KEY] });
    },
  });
};

export const useUpdateTreatment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateInput) => updateTreatment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TREATMENTS_QUERY_KEY] });
    },
  });
};

export const useDeleteTreatment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DeleteInput) => deleteTreatment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [TREATMENTS_QUERY_KEY] });
    },
  });
};
