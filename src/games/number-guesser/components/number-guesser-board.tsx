"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CountdownTimer } from "@/presentation/components/shared/countdown-timer";
import type { GameBoardProps } from "@/domain/game-engine/types";
import type { PlayerRoundResult } from "../types";

export function NumberGuesserBoard({ playerView, playerId, isHost, phaseDeadline, onAction, players }: GameBoardProps) {
  const [guess, setGuess] = useState("");

  const { publicState, privateState, phase } = playerView;
  const minNumber = publicState.minNumber as number;
  const maxNumber = publicState.maxNumber as number;
  const playerScores = publicState.playerScores as Record<string, number>;
  const playerStatus = publicState.playerStatus as Record<string, { guessCount: number; solved: boolean }>;
  const lastRoundResult = publicState.lastRoundResult as {
    targetNumber: number;
    playerResults: Record<string, PlayerRoundResult>;
  } | null;
  const myGuesses = privateState.myGuesses as number[];
  const hints = privateState.hints as Array<"higher" | "lower" | "correct">;
  const solved = privateState.solved as boolean;

  const handleSubmitGuess = () => {
    const num = parseInt(guess, 10);
    if (isNaN(num)) return;
    onAction("guess", { guess: num });
    setGuess("");
  };

  // Host auto-sends time_up when the countdown expires
  const handleTimerExpired = useCallback(() => {
    if (isHost && phase === "playing") {
      onAction("time_up", {});
    }
  }, [isHost, phase, onAction]);

  // Host auto-advances to final results when the last round_end countdown expires
  const handleFinalRoundExpired = useCallback(() => {
    if (isHost) {
      onAction("next_round", {});
    }
  }, [isHost, onAction]);

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

      {/* Scoreboard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Scoreboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {players
              .sort((a, b) => (playerScores[b.id] ?? 0) - (playerScores[a.id] ?? 0))
              .map((p) => {
                const status = playerStatus?.[p.id];
                return (
                  <div key={p.id} className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {p.displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{p.displayName}</span>
                    <Badge variant="secondary">{playerScores[p.id] ?? 0}</Badge>
                    {phase === "playing" && status && (
                      status.solved ? (
                        <Badge className="bg-emerald-500 text-white dark:bg-emerald-500 text-xs">Solved in {status.guessCount}!</Badge>
                      ) : status.guessCount > 0 ? (
                        <Badge variant="outline" className="text-xs">Guessing ({status.guessCount})</Badge>
                      ) : null
                    )}
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Round End Results — player's own result + correct answer */}
      {phase === "round_end" && lastRoundResult && (() => {
        const myResult = (lastRoundResult.playerResults ?? {})[playerId];
        const currentRound = publicState.currentRound as number;
        const totalRounds = publicState.totalRounds as number;
        const isFinalRound = currentRound > totalRounds;
        return (
          <Card className="border-primary">
            <CardHeader>
              <CardTitle>{isFinalRound ? "Final Round Results" : "Round Results"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-center text-2xl font-bold">
                The number was: {lastRoundResult.targetNumber}
              </p>
              {myResult && (
                <div className={`flex items-center justify-between p-3 rounded ${myResult.correct ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800" : "bg-muted/50"}`}>
                  <span className="font-medium">Your result</span>
                  <div className="flex items-center gap-2">
                    {myResult.correct ? (
                      <>
                        <span className="text-sm">{myResult.guessCount} {myResult.guessCount === 1 ? "guess" : "guesses"}</span>
                        <Badge className="bg-emerald-500 text-white dark:bg-emerald-500">+{myResult.score} pts</Badge>
                      </>
                    ) : (
                      <span className="text-muted-foreground text-sm">
                        {myResult.guessCount > 0 ? `${myResult.guessCount} guesses - Did not solve` : "No guess"}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {isFinalRound ? (
                <div className="pt-4 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Heading to final results in{" "}
                    <CountdownTimer
                      deadline={phaseDeadline!}
                      onExpired={handleFinalRoundExpired}
                      inline
                    />
                  </p>
                </div>
              ) : (
                <>
                  {isHost && (
                    <div className="pt-4 text-center">
                      <Button onClick={() => onAction("next_round", {})}>
                        Next Round
                      </Button>
                    </div>
                  )}
                  {!isHost && (
                    <p className="pt-4 text-center text-sm text-muted-foreground">
                      Waiting for host to start next round...
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Playing phase content */}
      {phase === "playing" && (
        <>
          {/* Solved celebration */}
          {solved ? (
            <Card className="border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20">
              <CardContent className="py-6 text-center space-y-2">
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">Correct!</p>
                <p className="text-lg">Solved in {myGuesses.length} {myGuesses.length === 1 ? "guess" : "guesses"}!</p>
                <p className="text-muted-foreground">Waiting for other players...</p>
              </CardContent>
            </Card>
          ) : (
            /* Guess Input */
            <Card>
              <CardHeader>
                <CardTitle>
                  Guess the Number ({minNumber} - {maxNumber})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={minNumber}
                    max={maxNumber}
                    placeholder={`Enter ${minNumber}-${maxNumber}`}
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmitGuess()}
                  />
                  <Button onClick={handleSubmitGuess} disabled={!guess}>
                    Guess
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Guess History */}
          {myGuesses.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Your Guesses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {myGuesses.map((g, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/50">
                      <span className="font-mono text-lg">{g}</span>
                      {hints[i] === "correct" ? (
                        <Badge className="bg-emerald-500 text-white dark:bg-emerald-500">Correct!</Badge>
                      ) : hints[i] === "higher" ? (
                        <Badge className="bg-amber-500 text-white dark:bg-amber-500">Higher</Badge>
                      ) : (
                        <Badge className="bg-sky-500 text-white dark:bg-sky-500">Lower</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
