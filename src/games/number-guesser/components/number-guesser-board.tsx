"use client";

import { useState, useCallback, useEffect } from "react";
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
import { HostLeaderboard } from "./host-leaderboard";
import type { GameBoardProps } from "@/domain/game-engine/types";
import type { PlayerRoundResult } from "../types";

export function NumberGuesserBoard({ playerView, playerId, isHost, isSpectator, phaseDeadline, onAction, players }: GameBoardProps) {
  const [guess, setGuess] = useState("");
  const [timeExpired, setTimeExpired] = useState(false);
  const [ending, setEnding] = useState(false);

  const { publicState, privateState, phase } = playerView;

  // Reset timeExpired when phase changes (new round starts)
  useEffect(() => {
    setTimeExpired(false);
  }, [phase]);
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

  // Disable input for all players when timer expires; host also sends time_up
  const handleTimerExpired = useCallback(() => {
    setTimeExpired(true);
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

      {/* Your Score + Round Progress */}
      {(() => {
        const participatingPlayers = Object.keys(playerScores).length;
        const solvedCount = phase === "playing"
          ? Object.values(playerStatus ?? {}).filter((s) => s.solved).length
          : 0;

        if (isSpectator) {
          return (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
              <div className="flex items-center gap-3">
                <Badge variant="secondary">Spectating</Badge>
                <span className="text-sm text-muted-foreground">You are watching this game</span>
              </div>
              {phase === "playing" && (
                <Badge variant="secondary" className="text-xs">
                  {solvedCount} / {participatingPlayers} solved
                </Badge>
              )}
            </div>
          );
        }

        const myScore = playerScores[playerId] ?? 0;
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
            {phase === "playing" && (
              <Badge variant="secondary" className="text-xs">
                {solvedCount} / {participatingPlayers} solved
              </Badge>
            )}
          </div>
        );
      })()}

      {/* Host leaderboard — animated top 5 at round end */}
      {phase === "round_end" && isHost && (
        <HostLeaderboard
          players={players}
          playerScores={playerScores}
          title="Top 5"
        />
      )}

      {/* Round End Results — player's own result + correct answer */}
      {phase === "round_end" && lastRoundResult && (() => {
        const myResult = isSpectator ? null : (lastRoundResult.playerResults ?? {})[playerId];
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
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Playing phase content */}
      {phase === "playing" && (
        <>
          {/* Host live progress bar */}
          {isHost && (() => {
            const total = Object.keys(playerStatus ?? {}).length;
            const solved = Object.values(playerStatus ?? {}).filter((s) => s.solved).length;
            const pct = total > 0 ? (solved / total) * 100 : 0;
            return (
              <Card>
                <CardContent className="pt-4 pb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Player progress</span>
                    <span className="font-medium">{solved} / {total} solved</span>
                  </div>
                  <Progress value={pct} />
                </CardContent>
              </Card>
            );
          })()}

          {isSpectator ? (
            /* Spectator view — no guess input */
            <Card className="border-dashed">
              <CardContent className="py-6 text-center space-y-2">
                <p className="text-lg font-medium text-muted-foreground">Spectating</p>
                <p className="text-sm text-muted-foreground">
                  Players are guessing a number between {minNumber} and {maxNumber}
                </p>
              </CardContent>
            </Card>
          ) : (
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
                        placeholder={timeExpired ? "Time's up!" : `Enter ${minNumber}-${maxNumber}`}
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmitGuess()}
                        disabled={timeExpired}
                      />
                      <Button onClick={handleSubmitGuess} disabled={!guess || timeExpired}>
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
        </>
      )}

    </div>
  );
}
