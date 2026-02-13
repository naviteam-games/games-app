"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Crown, Star } from "lucide-react";
import type { GameResultsProps, GameResult } from "@/domain/game-engine/types";

// ── Cheeky & encouraging comments by tier ──────────────────────────
const comments = {
  first: [
    "Built different.",
    "They didn't stand a chance.",
    "Is this your full-time job?",
    "Someone call the cops, you just robbed everyone.",
    "Legend status: confirmed.",
  ],
  top25: [
    "Main character energy right there.",
    "You woke up and chose excellence.",
    "Not bad... for a human.",
    "Your brain's got some serious horsepower.",
    "Certified big-brain moment.",
  ],
  top50: [
    "Solid work — you're in the zone.",
    "The middle is where champions warm up.",
    "Respect the grind.",
    "You're one lucky guess away from greatness.",
    "Consistently above average? We'll take it.",
  ],
  top75: [
    "Hey, someone has to keep things interesting.",
    "The comeback story starts here.",
    "You're the underdog everyone roots for.",
    "Plot twist: this is your origin arc.",
    "Room for growth = room for glory.",
  ],
  bottom: [
    "Participation trophy... earned with style.",
    "You brought the vibes, and that counts.",
    "Every champion was once a contender who refused to give up.",
    "Bold strategy. Let's see if it pays off next time.",
    "You didn't lose, you just ran out of rounds.",
  ],
};

function getRandomComment(tier: keyof typeof comments): string {
  const pool = comments[tier];
  return pool[Math.floor(Math.random() * pool.length)];
}

function getPercentile(rank: number, total: number): number {
  if (total <= 1) return 100;
  return Math.round(((total - rank) / (total - 1)) * 100);
}

function getRankSuffix(rank: number): string {
  if (rank === 1) return "1st";
  if (rank === 2) return "2nd";
  if (rank === 3) return "3rd";
  return `${rank}th`;
}

function getTier(percentile: number, rank: number): keyof typeof comments {
  if (rank === 1) return "first";
  if (percentile >= 75) return "top25";
  if (percentile >= 50) return "top50";
  if (percentile >= 25) return "top75";
  return "bottom";
}

// ── Player personal results card ───────────────────────────────────
function PlayerResultCard({
  rank,
  score,
  total,
}: {
  rank: number;
  score: number;
  total: number;
}) {
  const percentile = getPercentile(rank, total);
  const tier = getTier(percentile, rank);
  const [comment] = useState(() => getRandomComment(tier));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-6 pb-6 text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 12 }}
          >
            {rank === 1 ? (
              <Trophy className="h-12 w-12 mx-auto text-amber-500" />
            ) : rank <= 3 ? (
              <Medal className="h-12 w-12 mx-auto text-amber-400" />
            ) : (
              <Star className="h-12 w-12 mx-auto text-primary/60" />
            )}
          </motion.div>

          <motion.p
            className="text-4xl font-bold"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {getRankSuffix(rank)} Place
          </motion.p>

          <motion.div
            className="flex items-center justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Badge variant="secondary" className="text-sm px-3 py-1">
              Top {Math.max(100 - percentile, 1)}%
            </Badge>
            <Badge variant="outline" className="text-sm px-3 py-1 font-mono tabular-nums">
              {score} pts
            </Badge>
          </motion.div>

          <motion.p
            className="text-muted-foreground italic text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            &ldquo;{comment}&rdquo;
          </motion.p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Podium block config (inline styles to avoid Tailwind purge) ────
const podiumConfig = {
  1: {
    blockHeight: 144,
    gradient: "linear-gradient(to top, #facc15, #fcd34d)",
    border: "#eab308",
    iconColor: "#eab308",
    iconBg: "rgba(250, 204, 21, 0.25)",
    ringColor: "#facc15",
    badgeBg: "rgba(250, 204, 21, 0.25)",
    badgeText: "#713f12",
    badgeBorder: "rgba(234, 179, 8, 0.5)",
    labelColor: "rgba(113, 63, 18, 0.85)",
    label: "I",
  },
  2: {
    blockHeight: 108,
    gradient: "linear-gradient(to top, #94a3b8, #cbd5e1)",
    border: "#94a3b8",
    iconColor: "#94a3b8",
    iconBg: "rgba(148, 163, 184, 0.25)",
    ringColor: "#94a3b8",
    badgeBg: "rgba(148, 163, 184, 0.25)",
    badgeText: "#1e293b",
    badgeBorder: "rgba(148, 163, 184, 0.5)",
    labelColor: "rgba(30, 41, 59, 0.8)",
    label: "II",
  },
  3: {
    blockHeight: 80,
    gradient: "linear-gradient(to top, #f97316, #d97706)",
    border: "#f97316",
    iconColor: "#ea580c",
    iconBg: "rgba(249, 115, 22, 0.25)",
    ringColor: "#f97316",
    badgeBg: "rgba(249, 115, 22, 0.25)",
    badgeText: "#7c2d12",
    badgeBorder: "rgba(234, 88, 12, 0.5)",
    labelColor: "rgba(124, 45, 18, 0.85)",
    label: "III",
  },
};

function getPodiumPlaces(playerCount: number): number {
  return playerCount >= 3 ? 3 : 2;
}

const ABOVE_BLOCK_HEIGHT = 110;
const MAX_BLOCK_HEIGHT = podiumConfig[1].blockHeight;
const COLUMN_HEIGHT = ABOVE_BLOCK_HEIGHT + MAX_BLOCK_HEIGHT;

type RankingEntry = GameResult["rankings"][number];

function PodiumColumn({
  entry,
  players,
  rank,
  visible,
}: {
  entry: RankingEntry | undefined;
  players: GameResultsProps["players"];
  rank: 1 | 2 | 3;
  visible: boolean;
}) {
  const config = podiumConfig[rank];
  const player = entry ? players.find((p) => p.id === entry.playerId) : null;
  const displayName = player?.displayName ?? entry?.displayName ?? "—";

  return (
    <div
      className="flex flex-col items-center justify-end flex-1"
      style={{ height: COLUMN_HEIGHT }}
    >
      {/* Icon — crown for gold, medals for silver/bronze */}
      {visible && (
        <motion.div
          className="rounded-full p-1.5 mb-1"
          style={{ backgroundColor: config.iconBg }}
          initial={{ opacity: 0, y: -30, scale: 0 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: 0.35,
            type: "spring",
            stiffness: 200,
            damping: 12,
          }}
        >
          {rank === 1 ? (
            <Crown className="h-8 w-8" style={{ color: config.iconColor, filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.15))" }} />
          ) : (
            <Medal className="h-7 w-7" style={{ color: config.iconColor, filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.15))" }} />
          )}
        </motion.div>
      )}

      {/* Avatar + Name */}
      {visible && (
        <motion.div
          className="flex flex-col items-center gap-1 mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Avatar
            className={rank === 1 ? "h-12 w-12" : "h-10 w-10"}
            style={{ boxShadow: `0 0 0 2px ${config.ringColor}` }}
          >
            <AvatarFallback className={rank === 1 ? "text-base font-bold" : "text-sm font-semibold"}>
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className={`font-semibold text-center leading-tight max-w-[90px] truncate ${rank === 1 ? "text-sm" : "text-xs"}`}>
            {displayName}
          </span>
        </motion.div>
      )}

      {/* Podium block — rises up from the base */}
      {visible && (
        <motion.div
          className="w-full rounded-t-xl flex flex-col items-center justify-between py-3"
          style={{
            height: config.blockHeight,
            transformOrigin: "bottom",
            background: config.gradient,
            border: `2px solid ${config.border}`,
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
          }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{
            type: "spring",
            stiffness: 120,
            damping: 14,
          }}
        >
          <span className="text-4xl font-serif font-bold" style={{ color: config.labelColor, textShadow: `0 1px 2px rgba(0,0,0,0.1)` }}>
            {config.label}
          </span>
          {entry && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 15 }}
            >
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-sm font-bold font-mono tabular-nums"
                style={{
                  backgroundColor: config.badgeBg,
                  color: config.badgeText,
                  border: `1px solid ${config.badgeBorder}`,
                }}
              >
                {entry.score} pts
              </span>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ── Host podium view ───────────────────────────────────────────────
function HostPodium({
  rankings,
  players,
}: {
  rankings: GameResult["rankings"];
  players: GameResultsProps["players"];
}) {
  const places = getPodiumPlaces(rankings.length);
  const totalSteps = places + 1; // +1 for the rest list
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step > places) return;
    // Slower reveal: longer pauses between each place
    const delays = [800, 1800, 1800, 1500];
    const timer = setTimeout(() => setStep((s) => s + 1), delays[step]);
    return () => clearTimeout(timer);
  }, [step, places]);

  const first = rankings.find((r) => r.rank === 1);
  const second = rankings.find((r) => r.rank === 2);
  const third = places >= 3 ? rankings.find((r) => r.rank === 3) : undefined;
  const rest = rankings.filter((r) => r.rank > places).sort((a, b) => a.rank - b.rank);

  // Reveal order: last place first → ... → 1st place
  // 3 places: step 1=III, step 2=II, step 3=I
  // 2 places: step 1=II, step 2=I
  const isVisible = (rank: 1 | 2 | 3) => {
    if (places === 2) {
      if (rank === 3) return false;
      if (rank === 2) return step >= 1;
      if (rank === 1) return step >= 2;
    }
    // 3 places
    if (rank === 3) return step >= 1;
    if (rank === 2) return step >= 2;
    if (rank === 1) return step >= 3;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Podium — layout depends on number of places */}
      <div className="flex items-end justify-center gap-2 px-4 pt-4">
        {places >= 3 && (
          <PodiumColumn
            entry={third}
            players={players}
            rank={3}
            visible={isVisible(3)}
          />
        )}
        <PodiumColumn
          entry={first}
          players={players}
          rank={1}
          visible={isVisible(1)}
        />
        <PodiumColumn
          entry={second}
          players={players}
          rank={2}
          visible={isVisible(2)}
        />
      </div>

      {/* Remaining players compact list */}
      {step > places && rest.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="space-y-2">
                {rest.map((r) => {
                  const player = players.find((p) => p.id === r.playerId);
                  return (
                    <div
                      key={r.playerId}
                      className="flex items-center justify-between px-2 py-1.5 rounded bg-muted/30"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground w-8">
                          {getRankSuffix(r.rank)}
                        </span>
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {(player?.displayName ?? "?").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {player?.displayName ?? r.displayName}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground font-mono tabular-nums">
                        {r.score} pts
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ── Main results component ─────────────────────────────────────────
export function NumberGuesserResults({ results, players, currentUserId, isHost }: GameResultsProps) {
  const myRanking = results.rankings.find((r) => r.playerId === currentUserId);
  const total = results.rankings.length;

  return (
    <div className="space-y-6">
      {/* Host sees the podium */}
      {isHost && (
        <HostPodium rankings={results.rankings} players={players} />
      )}

      {/* Player sees their personal result card */}
      {myRanking && !isHost && (
        <PlayerResultCard
          rank={myRanking.rank}
          score={myRanking.score}
          total={total}
        />
      )}
    </div>
  );
}
