"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/presentation/providers/auth-provider";
import type { GameResultsProps } from "@/domain/game-engine/types";

function getWinnerCircleSize(playerCount: number): number {
  if (playerCount <= 3) return 1;
  if (playerCount <= 6) return 2;
  return 3;
}

export function NumberGuesserResults({ results, players }: GameResultsProps) {
  const { user } = useAuth();
  const toastShown = useRef(false);

  useEffect(() => {
    if (toastShown.current || !user) return;
    const winnerCircle = getWinnerCircleSize(players.length);
    const myRanking = results.rankings.find((r) => r.playerId === user.id);
    if (myRanking && myRanking.rank <= winnerCircle) {
      toastShown.current = true;
      const place = myRanking.rank === 1 ? "1st" : myRanking.rank === 2 ? "2nd" : "3rd";
      toast.success(`Congratulations! You finished ${place}!`);
    }
  }, [results.rankings, players.length, user]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Final Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results.rankings.map((r) => {
              const player = players.find((p) => p.id === r.playerId);
              return (
                <div
                  key={r.playerId}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    r.rank === 1 ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold w-8 text-center">
                      {r.rank === 1 ? "1st" : r.rank === 2 ? "2nd" : r.rank === 3 ? "3rd" : `${r.rank}th`}
                    </span>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {(player?.displayName ?? "?").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{player?.displayName ?? r.playerId}</span>
                  </div>
                  <Badge variant={r.rank === 1 ? "default" : "secondary"}>
                    {r.score} pts
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
