import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUsers } from "../endpoints/users_GET.schema";
import { createUser, InputType as CreateInput } from "../endpoints/users/create_POST.schema";
import { updateUser, InputType as UpdateInput } from "../endpoints/users/update_POST.schema";
import { deleteUser, InputType as DeleteInput } from "../endpoints/users/delete_POST.schema";

export const USERS_QUERY_KEY = "users";

export const useUsers = () => {
  return useQuery({
    queryKey: [USERS_QUERY_KEY],
    queryFn: () => getUsers(),
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInput) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateInput) => updateUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DeleteInput) => deleteUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
  });
};
