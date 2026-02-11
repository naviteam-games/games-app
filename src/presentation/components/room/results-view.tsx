"use client";

import Link from "next/link";
import { gameRegistry } from "@/games/registry";
import { Button } from "@/components/ui/button";
import type { GameRoom } from "@/domain/entities/game-room";
import type { Player } from "@/domain/entities/player";
import type { GameState } from "@/domain/entities/game-state";

interface ResultsViewProps {
  room: GameRoom;
  players: Player[];
  gameState: GameState;
}

export function ResultsView({ room, players, gameState }: ResultsViewProps) {
  const plugin = gameRegistry.getPlugin(room.gameSlug);

  if (!plugin) {
    return <div className="text-center py-12">Game type not found</div>;
  }

  const results = plugin.calculateResults(gameState.stateData);
  const Results = plugin.ResultsComponent;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">{room.name}</h1>
        <p className="text-muted-foreground">Game Over!</p>
      </div>

      <Results
        results={results}
        players={players.map((p) => ({
          id: p.userId,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
        }))}
      />

      <div className="flex justify-center">
        <Button asChild>
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
