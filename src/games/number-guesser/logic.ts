import type { NumberGuesserConfig, NumberGuesserState, RoundResult, PlayerRoundResult } from "./types";
import type { GamePhase } from "@/domain/entities/game-state";
import type { GameActionPayload, GameResult, PlayerView, GameConfig } from "@/domain/game-engine/types";

export function computeScore(guessCount: number, timeRemaining: number, roundDurationSeconds: number): number {
  const guessBonus = Math.max(100, 1000 - (guessCount - 1) * 150);
  const timeBonus = Math.floor(500 * timeRemaining / roundDurationSeconds);
  return guessBonus + timeBonus;
}

export function initializeState(config: GameConfig, playerIds: string[]): Record<string, unknown> {
  const c = config as unknown as NumberGuesserConfig;
  const state: NumberGuesserState = {
    config: c,
    currentRound: 1,
    totalRounds: c.rounds ?? 3,
    targetNumber: randomNumber(c.minNumber ?? 1, c.maxNumber ?? 100),
    guesses: Object.fromEntries(playerIds.map((id) => [id, []])),
    solvedBy: {},
    roundStartedAt: Date.now(),
    roundResults: [],
    playerScores: Object.fromEntries(playerIds.map((id) => [id, 0])),
    playerIds,
  };
  return state as unknown as Record<string, unknown>;
}

export function validateAction(
  stateRaw: Record<string, unknown>,
  action: GameActionPayload
): { valid: boolean; error?: string } {
  const state = stateRaw as unknown as NumberGuesserState;

  if (action.type === "next_round") {
    return { valid: true };
  }

  if (action.type === "time_up") {
    return { valid: true };
  }

  if (action.type !== "guess") {
    return { valid: false, error: "Invalid action type" };
  }

  const guess = action.data.guess as number;
  if (typeof guess !== "number" || !Number.isInteger(guess)) {
    return { valid: false, error: "Guess must be an integer" };
  }

  if (guess < state.config.minNumber || guess > state.config.maxNumber) {
    return { valid: false, error: `Guess must be between ${state.config.minNumber} and ${state.config.maxNumber}` };
  }

  if (state.solvedBy[action.playerId]) {
    return { valid: false, error: "You already solved this round" };
  }

  if (!state.playerIds.includes(action.playerId)) {
    return { valid: false, error: "Player not in game" };
  }

  return { valid: true };
}

export function applyAction(
  stateRaw: Record<string, unknown>,
  action: GameActionPayload
): Record<string, unknown> {
  const state = { ...(stateRaw as unknown as NumberGuesserState) };

  if (action.type === "next_round") {
    state.advancePhase = true;
    return state as unknown as Record<string, unknown>;
  }

  if (action.type === "time_up") {
    state.timeUp = true;
    return state as unknown as Record<string, unknown>;
  }

  const guess = action.data.guess as number;
  state.guesses = {
    ...state.guesses,
    [action.playerId]: [...(state.guesses[action.playerId] ?? []), guess],
  };

  if (guess === state.targetNumber) {
    const elapsed = (Date.now() - state.roundStartedAt) / 1000;
    const timeRemaining = Math.max(0, state.config.roundDurationSeconds - elapsed);
    const guessCount = state.guesses[action.playerId].length;
    const score = computeScore(guessCount, timeRemaining, state.config.roundDurationSeconds);
    state.solvedBy = {
      ...state.solvedBy,
      [action.playerId]: { guessCount, timeRemaining, score },
    };
  }

  return state as unknown as Record<string, unknown>;
}

export function isPhaseComplete(stateRaw: Record<string, unknown>, phase: GamePhase): boolean {
  const state = stateRaw as unknown as NumberGuesserState;

  if (phase === "round_end") {
    return state.advancePhase === true;
  }

  if (phase !== "playing") return false;

  if (state.timeUp) return true;
  return state.playerIds.every((pid) => pid in state.solvedBy);
}

export function resolvePhase(stateRaw: Record<string, unknown>, phase: GamePhase): Record<string, unknown> {
  if (phase === "round_end") {
    const state = { ...(stateRaw as unknown as NumberGuesserState) };
    delete state.advancePhase;
    delete state.timeUp;
    state.roundStartedAt = Date.now();
    return state as unknown as Record<string, unknown>;
  }
  if (phase !== "playing") return stateRaw;
  const state = { ...(stateRaw as unknown as NumberGuesserState) };
  delete state.timeUp;

  // Build per-player results
  const playerResults: Record<string, PlayerRoundResult> = {};
  for (const pid of state.playerIds) {
    const guesses = state.guesses[pid] ?? [];
    const solved = pid in state.solvedBy;
    const score = solved ? state.solvedBy[pid].score : 0;
    playerResults[pid] = {
      guesses,
      correct: solved,
      guessCount: guesses.length,
      score,
    };
  }

  const roundResult: RoundResult = {
    round: state.currentRound,
    targetNumber: state.targetNumber,
    playerResults,
  };

  state.roundResults = [...state.roundResults, roundResult];

  // Accumulate scores
  const newScores = { ...state.playerScores };
  for (const pid of state.playerIds) {
    newScores[pid] = (newScores[pid] ?? 0) + (playerResults[pid]?.score ?? 0);
  }
  state.playerScores = newScores;

  // Prepare next round
  state.currentRound += 1;
  state.targetNumber = randomNumber(state.config.minNumber, state.config.maxNumber);
  state.guesses = Object.fromEntries(state.playerIds.map((id) => [id, []]));
  state.solvedBy = {};

  return state as unknown as Record<string, unknown>;
}

export function getNextPhase(currentPhase: GamePhase, stateRaw: Record<string, unknown>): GamePhase {
  const state = stateRaw as unknown as NumberGuesserState;
  if (currentPhase === "playing") {
    return "round_end";
  }
  if (currentPhase === "round_end") {
    if (state.currentRound > state.totalRounds) return "finished";
    return "playing";
  }
  return currentPhase;
}

export function isGameOver(stateRaw: Record<string, unknown>): boolean {
  const state = stateRaw as unknown as NumberGuesserState;
  return state.currentRound > state.totalRounds;
}

export function calculateResults(stateRaw: Record<string, unknown>): GameResult {
  const state = stateRaw as unknown as NumberGuesserState;

  const rankings = state.playerIds
    .map((id) => ({
      playerId: id,
      displayName: "",
      score: state.playerScores[id] ?? 0,
      rank: 0,
    }))
    .sort((a, b) => b.score - a.score)
    .map((r, i) => ({ ...r, rank: i + 1 }));

  return {
    rankings,
    stats: {
      rounds: state.roundResults,
      totalRounds: state.totalRounds,
    },
  };
}

export function getPlayerView(
  stateRaw: Record<string, unknown>,
  playerId: string,
  phase: GamePhase
): PlayerView {
  const state = stateRaw as unknown as NumberGuesserState;

  // Build player status: guessCount + solved for each player
  const playerStatus: Record<string, { guessCount: number; solved: boolean }> = {};
  for (const pid of state.playerIds) {
    playerStatus[pid] = {
      guessCount: (state.guesses[pid] ?? []).length,
      solved: pid in state.solvedBy,
    };
  }

  const publicState: Record<string, unknown> = {
    currentRound: state.currentRound,
    totalRounds: state.totalRounds,
    minNumber: state.config.minNumber,
    maxNumber: state.config.maxNumber,
    playerScores: state.playerScores,
    roundResults: state.roundResults,
    playerStatus,
  };

  // Only reveal target after round resolves
  if (phase === "round_end" || phase === "finished") {
    publicState.lastRoundResult = state.roundResults[state.roundResults.length - 1] ?? null;
  }

  // Private state: player's own guesses + hints
  const myGuesses = state.guesses[playerId] ?? [];
  const hints: Array<"higher" | "lower" | "correct"> = myGuesses.map((g) => {
    if (g === state.targetNumber) return "correct";
    return g < state.targetNumber ? "higher" : "lower";
  });
  const solved = playerId in state.solvedBy;

  const privateState: Record<string, unknown> = {
    myGuesses,
    hints,
    solved,
  };

  return {
    phase,
    currentRound: state.currentRound,
    totalRounds: state.totalRounds,
    timeRemaining: null,
    publicState,
    privateState,
  };
}

export function getDefaultConfig(): NumberGuesserConfig {
  return { rounds: 3, minNumber: 1, maxNumber: 100, roundDurationSeconds: 30 };
}

export function getPhaseDuration(phase: GamePhase, config: GameConfig): number | null {
  if (phase === "playing") return (config as unknown as NumberGuesserConfig).roundDurationSeconds ?? 30;
  if (phase === "round_end") return 5;
  return null;
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
