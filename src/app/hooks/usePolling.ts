import { useEffect, useRef } from 'react';
import { POLLING_INTERVAL_MS } from '../constants';

export function usePolling(
  fetcher: () => void,
  active: boolean,
  intervalMs: number = POLLING_INTERVAL_MS
) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!active) return;

    const id = setInterval(() => fetcherRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
}
