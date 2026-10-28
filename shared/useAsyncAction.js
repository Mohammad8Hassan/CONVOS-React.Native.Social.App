import { useCallback, useEffect, useRef, useState } from 'react';

export default function useAsyncAction(action) {
  const running = useRef(false);
  const mounted = useRef(true);
  const latest = useRef(action);
  latest.current = action;
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const run = useCallback(async (...args) => {
    if(running.current) return;
    running.current = true;
    setBusy(true);
    try {
      return await latest.current(...args);
    } finally {
      running.current = false;
      if(mounted.current) setBusy(false);
    }
  }, []);

  return [run, busy];
}
