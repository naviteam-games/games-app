"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { CountdownTimer } from "@/presentation/components/shared/countdown-timer";
import { HostLeaderboard } from "@/games/number-guesser/components/host-leaderboard";
import { categoryLabels } from "../questions";
import type { GameBoardProps } from "@/domain/game-engine/types";
import type { PlayerGuessEntry, PlayerRoundResult, Category } from "../types";
import { Check, X } from "lucide-react";

// ── Clue reveal — which clue is active based on elapsed time ────────

function useActiveClue(roundStartedAt: number, durationSeconds: number, isPlaying: boolean): number {
  const [clueNumber, setClueNumber] = useState(1);

  useEffect(() => {
    if (!isPlaying) return;

    const thirdMs = (durationSeconds * 1000) / 3;

    function update() {
      const elapsed = Date.now() - roundStartedAt;
      if (elapsed < thirdMs) setClueNumber(1);
      else if (elapsed < thirdMs * 2) setClueNumber(2);
      else setClueNumber(3);
    }

    update();
    const interval = setInterval(update, 250);
    return () => clearInterval(interval);
  }, [roundStartedAt, durationSeconds, isPlaying]);

  return clueNumber;
}

// ── Shared warm amber/orange glow (matches 3 Crumbs theme) ──────────

const GLOW_COLOR = "234, 149, 40"; // warm amber-orange

function getClueStyle(isActive: boolean) {
  if (isActive) {
    return {
      backgroundColor: `rgba(${GLOW_COLOR}, 0.07)`,
      boxShadow: `0 0 18px 6px rgba(${GLOW_COLOR}, 0.3)`,
      borderLeft: `3px solid rgba(${GLOW_COLOR}, 0.9)`,
    };
  }
  return {
    backgroundColor: "var(--muted)",
    opacity: 0.5,
    borderLeft: "3px solid transparent",
  };
}

// ── Final round auto-advance with visible countdown ─────────────────

function FinalCountdown({ seconds, onComplete }: { seconds: number; onComplete: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const firedRef = useRef(false);

  useEffect(() => {
    if (remaining <= 0 && !firedRef.current) {
      firedRef.current = true;
      onComplete();
      return;
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, onComplete]);

  return (
    <p className="pt-4 text-center text-sm text-muted-foreground">
      Final results in <span className="font-mono font-bold">{remaining}s</span>...
    </p>
  );
}

export function ThreeCrumbsBoard({ playerView, playerId, isHost, isSpectator, phaseDeadline, onAction, players }: GameBoardProps) {
  const [guess, setGuess] = useState("");
  const [timeExpired, setTimeExpired] = useState(false);
  const [ending, setEnding] = useState(false);
  const finalFiredRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { publicState, privateState, phase } = playerView;

  // Reset state when phase/round changes
  useEffect(() => {
    setTimeExpired(false);
    finalFiredRef.current = false;
    setGuess("");
  }, [phase, publicState.currentRound]);

  const playerScores = publicState.playerScores as Record<string, number>;
  const playerStatus = publicState.playerStatus as Record<string, { guessCount: number; solved: boolean }>;
  const durationSeconds = publicState.durationSeconds as number;
  const roundStartedAt = publicState.roundStartedAt as number;
  const category = publicState.category as Category;
  const clue1 = publicState.clue1 as string | undefined;
  const clue2 = publicState.clue2 as string | undefined;
  const clue3 = publicState.clue3 as string | undefined;
  const lastRoundResult = publicState.lastRoundResult as {
    answer: string;
    playerResults: Record<string, PlayerRoundResult>;
  } | null;

  const myGuesses = privateState.myGuesses as PlayerGuessEntry[];
  const solved = privateState.solved as boolean;
  const solvedInfo = privateState.solvedInfo as { clueNumber: number; timeRemaining: number; score: number } | null;

  const activeClue = useActiveClue(roundStartedAt, durationSeconds, phase === "playing");

  const currentRound = publicState.currentRound as number;
  const totalRounds = publicState.totalRounds as number;
  const isFinalRound = phase === "round_end" && currentRound > totalRounds;

  const handleSubmitGuess = () => {
    const text = guess.trim();
    if (!text) return;
    onAction("guess", { guess: text });
    setGuess("");
    inputRef.current?.focus();
  };

  const handleTimerExpired = useCallback(() => {
    setTimeExpired(true);
    if (isHost && phase === "playing") {
      onAction("time_up", {});
    }
  }, [isHost, phase, onAction]);

  return (
    <div className="space-y-6">
      {/* Timer during playing phase */}
      {phase === "playing" && phaseDeadline && (
        <div className="text-center">
          <CountdownTimer
            deadline={phaseDeadline}
            onExpired={handleTimerExpired}
          />
        </div>
      )}

      {/* Score + Round info panel */}
      {(() => {
        if (isSpectator) {
          return (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Spectating</Badge>
                <span className="text-sm text-muted-foreground">You are watching this game</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Round {Math.min(currentRound, totalRounds)} / {totalRounds}
              </Badge>
            </div>
          );
        }

        const myScore = playerScores[playerId] ?? 0;
        const participatingPlayers = Object.keys(playerScores).length;
        const sortedScores = Object.values(playerScores).sort((a, b) => b - a);
        const myRank = sortedScores.indexOf(myScore) + 1;

        return (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Your Score</span>
              <span className="text-xl font-bold">{myScore}</span>
              <Badge variant="outline" className="text-xs">
                {myRank === 1 ? "1st" : myRank === 2 ? "2nd" : myRank === 3 ? "3rd" : `${myRank}th`} of {participatingPlayers}
              </Badge>
            </div>
            <Badge variant="secondary" className="text-xs">
              Round {Math.min(currentRound, totalRounds)} / {totalRounds}
            </Badge>
          </div>
        );
      })()}

      {/* ── HOST VIEW: Playing phase — clue display ── */}
      {phase === "playing" && isHost && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground">
                  Round {currentRound} of {totalRounds}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {categoryLabels[category] ?? category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <AnimatePresence mode="popLayout">
                {/* Clue 1 — always visible */}
                <motion.div
                  key="clue1"
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: activeClue === 1 ? 1 : 0.92,
                  }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="rounded-lg p-4"
                  style={getClueStyle(activeClue === 1)}
                >
                  <p className="text-xs font-semibold mb-1 text-muted-foreground">Clue 1</p>
                  <p className={`font-medium transition-all duration-300 ${activeClue === 1 ? "text-xl" : "text-sm"}`}>
                    {clue1}
                  </p>
                </motion.div>

                {/* Clue 2 — visible at clue 2+ */}
                {activeClue >= 2 && (
                  <motion.div
                    key="clue2"
                    layout
                    initial={{ opacity: 0, y: 40, scale: 0.85 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: activeClue === 2 ? 1 : 0.92,
                    }}
                    transition={{ type: "spring", stiffness: 180, damping: 18 }}
                    className="rounded-lg p-4"
                    style={getClueStyle(activeClue === 2)}
                  >
                    <p className="text-xs font-semibold mb-1 text-muted-foreground">Clue 2</p>
                    <p className={`font-medium transition-all duration-300 ${activeClue === 2 ? "text-xl" : "text-sm"}`}>
                      {clue2}
                    </p>
                  </motion.div>
                )}

                {/* Clue 3 — visible at clue 3 */}
                {activeClue >= 3 && (
                  <motion.div
                    key="clue3"
                    layout
                    initial={{ opacity: 0, y: 40, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 180, damping: 18 }}
                    className="rounded-lg p-4"
                    style={getClueStyle(true)}
                  >
                    <p className="text-xs font-semibold mb-1 text-muted-foreground">Clue 3</p>
                    <p className="text-xl font-medium">{clue3}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Host progress bar */}
          {(() => {
            const total = Object.keys(playerStatus ?? {}).length;
            const solvedCount = Object.values(playerStatus ?? {}).filter((s) => s.solved).length;
            const pct = total > 0 ? (solvedCount / total) * 100 : 0;
            return (
              <Card>
                <CardContent className="pt-4 pb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Player progress</span>
                    <span className="font-medium">{solvedCount} / {total} correct</span>
                  </div>
                  <Progress value={pct} />
                </CardContent>
              </Card>
            );
          })()}
        </>
      )}

      {/* ── PLAYER VIEW: Playing phase — guess input, NO clues ── */}
      {phase === "playing" && !isHost && !isSpectator && (
        <>
          {solved ? (
            <Card className="border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20">
              <CardContent className="py-6 text-center space-y-3">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Correct!</p>
                {solvedInfo && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Solved on Clue {solvedInfo.clueNumber}
                    </p>
                    <p className="text-lg font-semibold">+{solvedInfo.score} pts</p>
                  </div>
                )}
                <p className="text-muted-foreground">Waiting for other players...</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>What&apos;s the answer?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder={timeExpired ? "Time's up!" : "Type your guess..."}
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmitGuess()}
                    disabled={timeExpired}
                    autoComplete="off"
                  />
                  <Button onClick={handleSubmitGuess} disabled={!guess.trim() || timeExpired}>
                    Guess
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Guess history */}
          {myGuesses.length > 0 && (
            <div className="flex flex-wrap-reverse gap-1.5 sm:gap-2 justify-center">
              {myGuesses.map((g, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 sm:px-3 sm:py-1 text-sm font-medium ${
                    g.correct
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                  }`}
                >
                  {g.text}
                  {g.correct ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {/* Spectator playing view */}
      {phase === "playing" && isSpectator && !isHost && (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center space-y-2">
            <p className="text-lg font-medium text-muted-foreground">Spectating</p>
            <p className="text-sm text-muted-foreground">
              Players are guessing the answer from clues on the host&apos;s screen
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── ROUND END ── */}
      {phase === "round_end" && (
        <>
          {/* Host leaderboard */}
          {isHost && (
            <HostLeaderboard
              players={players}
              playerScores={playerScores}
              title="Top 5"
            />
          )}

          {lastRoundResult && (() => {
            const myResult = isSpectator ? null : (lastRoundResult.playerResults ?? {})[playerId];

            return (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle>{isFinalRound ? "Final Round Results" : "Round Results"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-center text-2xl font-bold">
                    Answer: {lastRoundResult.answer}
                  </p>

                  {myResult && (
                    <div className={`flex items-center justify-between p-3 rounded ${
                      myResult.correct
                        ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800"
                        : "bg-muted/50"
                    }`}>
                      <span className="font-medium">Your result</span>
                      <div className="flex items-center gap-2">
                        {myResult.correct ? (
                          <>
                            <span className="text-sm">Clue {myResult.clueNumber}</span>
                            <Badge className="bg-emerald-500 text-white dark:bg-emerald-500">+{myResult.score} pts</Badge>
                          </>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {myResult.guesses.length > 0 ? `${myResult.guesses.length} guesses — Did not solve` : "No guess"}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {!isFinalRound ? (
                    <>
                      {isHost && (
                        <div className="pt-4 flex items-center justify-center gap-3">
                          <Button onClick={() => onAction("next_round", {})}>
                            Next Round
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" disabled={ending}>
                                {ending ? "Ending..." : "End Game"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>End game early?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will end the game for all players and go straight to the final results. Scores from all completed rounds will be kept.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => {
                                    setEnding(true);
                                    onAction("end_game", {});
                                  }}
                                >
                                  End Game
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                      {!isHost && (
                        <p className="pt-4 text-center text-sm text-muted-foreground">
                          Waiting for host to start next round...
                        </p>
                      )}
                    </>
                  ) : (
                    <FinalCountdown
                      seconds={5}
                      onComplete={() => {
                        if (isHost && !finalFiredRef.current) {
                          finalFiredRef.current = true;
                          onAction("next_round", {});
                        }
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })()}
        </>
      )}
    </div>
  );
}
