"use client";

import { useEffect, useState, useCallback } from "react";
import type { GameState } from "@/domain/entities/game-state";

export function useGameState(roomId: string) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchState = useCallback(async () => {
    const res = await fetch(`/api/rooms/${roomId}`);
    if (res.ok) {
      const data = await res.json();
      setGameState(data.gameState);
    }
    setLoading(false);
  }, [roomId]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  return { gameState, loading, refetch: fetchState };
}
