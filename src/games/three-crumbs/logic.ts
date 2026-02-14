import type { ThreeCrumbsConfig, ThreeCrumbsState, Question, PlayerGuessEntry, PlayerRoundResult, RoundResult } from "./types";
import type { GamePhase } from "@/domain/entities/game-state";
import type { GameActionPayload, GameResult, PlayerView, GameConfig } from "@/domain/game-engine/types";
import { questionBank } from "./questions";

// ── Difficulty → duration mapping ────────────────────────────────────
const difficultyDurations: Record<string, number> = {
  easy: 60,
  medium: 45,
  hard: 30,
};

// ── Fuzzy matching helpers ───────────────────────────────────────────

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[m][n];
}

function getMaxDistance(wordLength: number): number {
  if (wordLength <= 5) return 1;
  if (wordLength <= 10) return 2;
  return 3;
}

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/['']/g, "'");
}

export function isCorrectAnswer(guess: string, question: Question): boolean {
  const normalizedGuess = normalize(guess);
  if (!normalizedGuess) return false;

  const candidates = [question.answer, ...question.alternateAnswers];

  for (const candidate of candidates) {
    const normalizedCandidate = normalize(candidate);
    // Exact match (case-insensitive)
    if (normalizedGuess === normalizedCandidate) return true;
    // Fuzzy match
    const maxDist = getMaxDistance(normalizedCandidate.length);
    if (levenshteinDistance(normalizedGuess, normalizedCandidate) <= maxDist) return true;
  }

  return false;
}

// ── Clue & scoring helpers ───────────────────────────────────────────

export function getCurrentClueNumber(elapsedMs: number, durationSeconds: number): 1 | 2 | 3 {
  const third = (durationSeconds * 1000) / 3;
  if (elapsedMs < third) return 1;
  if (elapsedMs < third * 2) return 2;
  return 3;
}

export function computeScore(clueNumber: number, timeRemainingSeconds: number): number {
  const basePoints = clueNumber === 1 ? 300 : clueNumber === 2 ? 200 : 100;
  const timeBonus = Math.floor(timeRemainingSeconds * 10);
  return basePoints + timeBonus;
}

// ── IGamePlugin logic functions ──────────────────────────────────────

export function initializeState(config: GameConfig, playerIds: string[]): Record<string, unknown> {
  const c = config as unknown as ThreeCrumbsConfig;
  const totalRounds = c.rounds ?? 10;
  const category = c.category ?? "food";

  const pool = [...(questionBank[category] ?? questionBank.food)];
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const roundQuestions = pool.slice(0, Math.min(totalRounds, pool.length));

  const state: ThreeCrumbsState = {
    config: c,
    currentRound: 1,
    totalRounds: roundQuestions.length,
    roundQuestions,
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
  action: GameActionPayload,
): { valid: boolean; error?: string } {
  const state = stateRaw as unknown as ThreeCrumbsState;

  if (action.type === "next_round") return { valid: true };
  if (action.type === "time_up") return { valid: true };
  if (action.type === "end_game") return { valid: true };

  if (action.type !== "guess") {
    return { valid: false, error: "Invalid action type" };
  }

  if (state.timeUp) {
    return { valid: false, error: "Time is up" };
  }

  const text = action.data.guess as string;
  if (typeof text !== "string" || !text.trim()) {
    return { valid: false, error: "Guess must be a non-empty string" };
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
  action: GameActionPayload,
): Record<string, unknown> {
  const state = { ...(stateRaw as unknown as ThreeCrumbsState) };

  if (action.type === "next_round") {
    state.advancePhase = true;
    return state as unknown as Record<string, unknown>;
  }

  if (action.type === "time_up") {
    state.timeUp = true;
    return state as unknown as Record<string, unknown>;
  }

  if (action.type === "end_game") {
    state.forceEnd = true;
    state.advancePhase = true;
    return state as unknown as Record<string, unknown>;
  }

  // guess action
  const guessText = (action.data.guess as string).trim();
  const question = state.roundQuestions[state.currentRound - 1];
  const correct = isCorrectAnswer(guessText, question);
  const now = Date.now();

  const entry: PlayerGuessEntry = {
    text: guessText,
    correct,
    timestamp: now,
  };

  state.guesses = {
    ...state.guesses,
    [action.playerId]: [...(state.guesses[action.playerId] ?? []), entry],
  };

  if (correct) {
    const elapsedMs = now - state.roundStartedAt;
    const durationSeconds = difficultyDurations[state.config.difficulty] ?? 45;
    const clueNumber = getCurrentClueNumber(elapsedMs, durationSeconds);
    const timeRemainingSeconds = Math.max(0, durationSeconds - elapsedMs / 1000);
    const score = computeScore(clueNumber, timeRemainingSeconds);

    state.solvedBy = {
      ...state.solvedBy,
      [action.playerId]: { clueNumber, timeRemaining: timeRemainingSeconds, score },
    };
  }

  return state as unknown as Record<string, unknown>;
}

export function isPhaseComplete(stateRaw: Record<string, unknown>, phase: GamePhase): boolean {
  const state = stateRaw as unknown as ThreeCrumbsState;

  if (phase === "round_end") {
    return state.advancePhase === true;
  }

  if (phase !== "playing") return false;

  if (state.timeUp) return true;
  return state.playerIds.every((pid) => pid in state.solvedBy);
}

export function resolvePhase(stateRaw: Record<string, unknown>, phase: GamePhase): Record<string, unknown> {
  if (phase === "round_end") {
    const state = { ...(stateRaw as unknown as ThreeCrumbsState) };
    delete state.advancePhase;
    delete state.timeUp;
    state.roundStartedAt = Date.now();
    return state as unknown as Record<string, unknown>;
  }

  if (phase !== "playing") return stateRaw;

  const state = { ...(stateRaw as unknown as ThreeCrumbsState) };
  delete state.timeUp;

  const question = state.roundQuestions[state.currentRound - 1];
  const durationSeconds = difficultyDurations[state.config.difficulty] ?? 45;

  // Build per-player round results
  const playerResults: Record<string, PlayerRoundResult> = {};
  for (const pid of state.playerIds) {
    const guesses = state.guesses[pid] ?? [];
    const solved = pid in state.solvedBy;
    const solvedInfo = state.solvedBy[pid];

    if (solved && solvedInfo) {
      const basePoints = solvedInfo.clueNumber === 1 ? 300 : solvedInfo.clueNumber === 2 ? 200 : 100;
      const timeBonus = solvedInfo.score - basePoints;
      playerResults[pid] = {
        correct: true,
        guesses,
        clueNumber: solvedInfo.clueNumber,
        timeRemaining: solvedInfo.timeRemaining,
        basePoints,
        timeBonus,
        score: solvedInfo.score,
      };
    } else {
      playerResults[pid] = {
        correct: false,
        guesses,
        clueNumber: 0,
        timeRemaining: 0,
        basePoints: 0,
        timeBonus: 0,
        score: 0,
      };
    }
  }

  const roundResult: RoundResult = {
    round: state.currentRound,
    answer: question.answer,
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
  state.guesses = Object.fromEntries(state.playerIds.map((id) => [id, []]));
  state.solvedBy = {};

  return state as unknown as Record<string, unknown>;
}

export function getNextPhase(currentPhase: GamePhase, stateRaw: Record<string, unknown>): GamePhase {
  const state = stateRaw as unknown as ThreeCrumbsState;
  if (currentPhase === "playing") return "round_end";
  if (currentPhase === "round_end") {
    if (state.currentRound > state.totalRounds) return "finished";
    return "playing";
  }
  return currentPhase;
}

export function isGameOver(stateRaw: Record<string, unknown>): boolean {
  const state = stateRaw as unknown as ThreeCrumbsState;
  return state.forceEnd === true || state.currentRound > state.totalRounds;
}

export function calculateResults(stateRaw: Record<string, unknown>): GameResult {
  const state = stateRaw as unknown as ThreeCrumbsState;

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
  phase: GamePhase,
): PlayerView {
  const state = stateRaw as unknown as ThreeCrumbsState;
  const question = state.roundQuestions[state.currentRound - 1];
  const durationSeconds = difficultyDurations[state.config.difficulty] ?? 45;

  // Player status: guess count + solved for each player
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
    playerScores: state.playerScores,
    roundResults: state.roundResults,
    playerStatus,
    durationSeconds,
    roundStartedAt: state.roundStartedAt,
    category: state.config.category,
    difficulty: state.config.difficulty,
  };

  // Clues are public (host shares screen, BoardComponent hides from players via isHost check)
  if (phase === "playing" && question) {
    publicState.clue1 = question.clue1;
    publicState.clue2 = question.clue2;
    publicState.clue3 = question.clue3;
  }

  // Only reveal answer after round resolves
  if (phase === "round_end" || phase === "finished") {
    publicState.lastRoundResult = state.roundResults[state.roundResults.length - 1] ?? null;
    // Also include clues in round_end so host can show them
    if (state.roundResults.length > 0) {
      const lastIdx = state.currentRound - 2; // currentRound already incremented
      const lastQ = state.roundQuestions[lastIdx];
      if (lastQ) {
        publicState.lastClues = { clue1: lastQ.clue1, clue2: lastQ.clue2, clue3: lastQ.clue3 };
      }
    }
  }

  // Private state: player's own guesses
  const myGuesses = state.guesses[playerId] ?? [];
  const solved = playerId in state.solvedBy;
  const solvedInfo = state.solvedBy[playerId];

  const privateState: Record<string, unknown> = {
    myGuesses,
    solved,
    solvedInfo: solvedInfo ?? null,
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

export function getDefaultConfig(): ThreeCrumbsConfig {
  return { category: "food", difficulty: "medium", rounds: 10 };
}

export function getPhaseDuration(phase: GamePhase, config: GameConfig): number | null {
  if (phase === "playing") {
    const c = config as unknown as ThreeCrumbsConfig;
    return difficultyDurations[c.difficulty] ?? 45;
  }
  // round_end: host manually advances (no timer)
  if (phase === "round_end") return null;
  return null;
}
