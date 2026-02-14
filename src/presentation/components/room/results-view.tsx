"use client";

import { useRouter } from "next/navigation";
import { gameRegistry } from "@/games/registry";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { GameRoom } from "@/domain/entities/game-room";
import type { Player } from "@/domain/entities/player";
import type { GameState } from "@/domain/entities/game-state";

// Category labels for games that use them (e.g. three-crumbs)
const categoryLabels: Record<string, string> = {
  bible: "Bible",
  food: "Food",
  animals: "Animals",
  holidays: "Holidays",
  office: "Office / Workplace",
};

interface ResultsViewProps {
  room: GameRoom;
  players: Player[];
  gameState: GameState;
  currentUserId: string;
  isHost: boolean;
}

export function ResultsView({ room, players, gameState, currentUserId, isHost }: ResultsViewProps) {
  const router = useRouter();
  const plugin = gameRegistry.getPlugin(room.gameSlug);

  if (!plugin) {
    return <div className="text-center py-12">Game type not found</div>;
  }

  const results = plugin.calculateResults(gameState.stateData);
  const Results = plugin.ResultsComponent;

  const stateConfig = (gameState.stateData as Record<string, unknown>).config as Record<string, unknown> | undefined;
  const category = stateConfig?.category as string | undefined;

  const handleLeave = async () => {
    await fetch(`/api/rooms/${room.id}/leave`, { method: "POST" });
    router.push("/dashboard");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-3xl font-bold">{plugin.name}</h1>
        <p className="text-muted-foreground">Room: {room.name}</p>
        {category && (
          <Badge variant="outline" className="text-xs">
            {categoryLabels[category] ?? category}
          </Badge>
        )}
        <p className="text-sm font-medium text-muted-foreground">Game Over!</p>
      </div>

      <Results
        results={results}
        players={players.map((p) => ({
          id: p.userId,
          displayName: p.displayName,
          avatarUrl: p.avatarUrl,
        }))}
        currentUserId={currentUserId}
        isHost={isHost}
      />

      <div className="flex justify-center">
        {isHost ? (
          <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
        ) : (
          <Button onClick={handleLeave}>Leave Game</Button>
        )}
      </div>
    </div>
  );
}
