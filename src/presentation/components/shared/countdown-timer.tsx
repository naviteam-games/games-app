"use client";

import { useCountdown } from "@/presentation/hooks/use-countdown";
import { useEffect, useRef } from "react";

interface CountdownTimerProps {
  deadline: string | null;
  onExpired?: () => void;
  /** Render as inline span instead of block div */
  inline?: boolean;
}

export function CountdownTimer({ deadline, onExpired, inline }: CountdownTimerProps) {
  const { timeLeft } = useCountdown(deadline);
  const firedRef = useRef(false);

  useEffect(() => {
    // Reset when deadline changes
    firedRef.current = false;
  }, [deadline]);

  useEffect(() => {
    if (timeLeft === 0 && onExpired && !firedRef.current) {
      firedRef.current = true;
      onExpired();
    }
  }, [timeLeft, onExpired]);

  if (timeLeft === null) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft <= 10;

  if (inline) {
    return (
      <span className={`font-mono font-bold tabular-nums ${isUrgent ? "text-destructive" : ""}`}>
        {minutes}:{seconds.toString().padStart(2, "0")}
      </span>
    );
  }

  return (
    <div className={`text-2xl font-mono font-bold tabular-nums ${isUrgent ? "text-destructive" : ""}`}>
      {minutes}:{seconds.toString().padStart(2, "0")}
    </div>
  );
}
