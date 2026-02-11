"use client";

import { useState, useEffect, useRef } from "react";

export function useCountdown(deadline: string | null) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!deadline) {
      setTimeLeft(null);
      return;
    }

    const update = () => {
      const remaining = Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };

    update();
    intervalRef.current = setInterval(update, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [deadline]);

  return { timeLeft };
}
