import { useCallback, useEffect, useRef, useState } from 'react';

// Wraps an async handler so it can't run twice at once. The guard is a ref, so a second tap that
// lands before React re-rendered the "busy" state is ignored too (a state flag alone lets it through).
// Returns [run, busy]: pass `run` to onPress and use `busy` to show a spinner / disable the button.
// The handler's errors are not swallowed (the caller decides how to report them); `busy` is always cleared.
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
