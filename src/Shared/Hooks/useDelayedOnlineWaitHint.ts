import { useEffect, useState } from "react";

const ONLINE_WAIT_HINT_DELAY_MS = 3000;

export function useDelayedOnlineWaitHint(isConnecting: boolean): boolean {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!isConnecting) {
      setShowHint(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowHint(true);
    }, ONLINE_WAIT_HINT_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isConnecting]);

  return showHint;
}
