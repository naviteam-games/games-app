"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface LeaderboardPlayer {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  score: number;
}

interface HostLeaderboardProps {
  players: LeaderboardPlayer[];
  playerScores: Record<string, number>;
  title?: string;
}

const rankColors = [
  "bg-amber-500 text-white",     // 1st — gold
  "bg-zinc-400 text-white",      // 2nd — silver
  "bg-amber-700 text-white",     // 3rd — bronze
];

const rankLabel = (rank: number) => {
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return "3rd";
  return `${rank}th`;
};

function sortPlayers(players: LeaderboardPlayer[], scores: Record<string, number>) {
  return [...players]
    .map((p) => ({ ...p, score: scores[p.id] ?? p.score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export function HostLeaderboard({ players, playerScores, title = "Leaderboard" }: HostLeaderboardProps) {
  const prevScoresRef = useRef<Record<string, number> | null>(null);
  const [displayScores, setDisplayScores] = useState<Record<string, number>>(playerScores);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const prev = prevScoresRef.current;

    // First mount or no previous scores — show current immediately
    if (!prev) {
      prevScoresRef.current = playerScores;
      setDisplayScores(playerScores);
      setAnimated(true);
      return;
    }

    // Scores changed — show old order first, then animate to new
    setDisplayScores(prev);
    setAnimated(false);

    const timer = setTimeout(() => {
      setDisplayScores(playerScores);
      setAnimated(true);
      prevScoresRef.current = playerScores;
    }, 800);

    return () => clearTimeout(timer);
  }, [playerScores]);

  const sorted = sortPlayers(players, displayScores);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {sorted.map((player, index) => {
              const newScore = playerScores[player.id] ?? 0;
              const oldScore = prevScoresRef.current?.[player.id] ?? newScore;
              const gained = newScore - oldScore;

              return (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{
                    layout: { type: "spring", stiffness: 200, damping: 25 },
                    opacity: { duration: 0.2 },
                  }}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/40"
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${index < 3 ? rankColors[index] : "bg-muted text-muted-foreground"}`}>
                      {rankLabel(index + 1).replace(/[a-z]/g, "")}
                    </span>
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-xs">
                        {player.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{player.displayName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {animated && gained > 0 && (
                      <motion.span
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-xs font-medium text-emerald-500"
                      >
                        +{gained}
                      </motion.span>
                    )}
                    <motion.div
                      key={player.score}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <Badge variant="outline" className="font-mono tabular-nums">
                        {player.score} pts
                      </Badge>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
