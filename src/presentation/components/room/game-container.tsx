"use client";

import { useCallback } from "react";
import { gameRegistry } from "@/games/registry";
import { toast } from "sonner";
import type { GameRoom } from "@/domain/entities/game-room";
import type { Player } from "@/domain/entities/player";
import type { GameState } from "@/domain/entities/game-state";

interface GameContainerProps {
  room: GameRoom;
  players: Player[];
  gameState: GameState;
  currentUserId: string;
  onRefresh: () => void;
}

export function GameContainer({ room, players, gameState, currentUserId, onRefresh }: GameContainerProps) {
  const plugin = gameRegistry.getPlugin(room.gameSlug);

  const handleAction = useCallback(async (actionType: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/rooms/${room.id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actionType, data }),
    });

    const result = await res.json();
    if (!res.ok) {
      toast.error(result.error);
      return;
    }
    onRefresh();
  }, [room.id, onRefresh]);

  if (!plugin) {
    return <div className="text-center py-12">Game type not found</div>;
  }

  const playerView = plugin.getPlayerView(
    gameState.stateData,
    currentUserId,
    gameState.phase
  );

  const Board = plugin.BoardComponent;
  const isHost = room.hostId === currentUserId;
  const isSpectator = isHost && room.config.hostPlays === false;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{plugin.name}</h1>
        <p className="text-muted-foreground">
          Room: {room.name}
        </p>
      </div>

      <Board
        playerView={playerView}
        playerId={currentUserId}
        isHost={isHost}
        isSpectator={isSpectator}
        phaseDeadline={gameState.phaseDeadline}
        onAction={handleAction}
        players={players
          .filter((p) => !isSpectator || p.userId !== currentUserId)
          .map((p) => ({
            id: p.userId,
            displayName: p.displayName,
            avatarUrl: p.avatarUrl,
            score: p.score,
          }))}
      />
    </div>
  );
}
