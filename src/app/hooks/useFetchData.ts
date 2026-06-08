import { useState, useCallback } from 'react';

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export function useFetchData<T>() {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const execute = useCallback(async (fetcher: () => Promise<T>) => {
    setState({ data: null, isLoading: true, error: null });
    try {
      const data = await fetcher();
      setState({ data, isLoading: false, error: null });
      return data;
    } catch (err: any) {
      const message = err?.message || 'Error desconocido';
      setState({ data: null, isLoading: false, error: message });
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
