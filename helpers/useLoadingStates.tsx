import { UseMutationResult } from "@tanstack/react-query";
import { useMemo } from "react";

// A generic type for any mutation result from React Query
type AnyMutationResult = UseMutationResult<any, any, any, any>;

/**
 * A custom hook to aggregate loading and error states from multiple React Query mutations.
 * This is useful for forms or pages where multiple asynchronous actions can be triggered,
 * and the UI needs to reflect a single, combined loading or error state.
 *
 * @param mutations - An array of `UseMutationResult` objects from React Query's `useMutation`.
 * @returns An object containing:
 *  - `isLoading`: A boolean that is `true` if any of the mutations are in a 'pending' state.
 *  - `isError`: A boolean that is `true` if any of the mutations have failed.
 *  - `error`: The first error object encountered among the failed mutations.
 *  - `errorMessage`: A user-friendly, Spanish-language error message extracted from the first error.
 *
 * @example
 * const mutation1 = useSomeMutation();
 * const mutation2 = useAnotherMutation();
 * const { isLoading, isError, errorMessage } = useLoadingStates([mutation1, mutation2]);
 *
 * if (isLoading) return <Spinner />;
 * if (isError) return <p>{errorMessage}</p>;
 */
export const useLoadingStates = (mutations: AnyMutationResult[]) => {
  const isLoading = useMemo(
    () => mutations.some((m) => m.isPending),
    [mutations]
  );

  const firstErrorMutation = useMemo(
    () => mutations.find((m) => m.isError),
    [mutations]
  );

  const isError = !!firstErrorMutation;
  const error = firstErrorMutation?.error;

  const errorMessage = useMemo(() => {
    if (!error) {
      return null;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "Ocurrió un error inesperado. Por favor, intente de nuevo.";
  }, [error]);

  return { isLoading, isError, error, errorMessage };
};