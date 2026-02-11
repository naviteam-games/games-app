export interface NumberGuesserConfig {
  [key: string]: unknown;
  rounds: number;
  minNumber: number;
  maxNumber: number;
  roundDurationSeconds: number;
}

export interface SolvedEntry {
  guessCount: number;
  timeRemaining: number;
  score: number;
}

export interface NumberGuesserState {
  config: NumberGuesserConfig;
  currentRound: number;
  totalRounds: number;
  targetNumber: number;
  guesses: Record<string, number[]>;
  solvedBy: Record<string, SolvedEntry>;
  roundStartedAt: number;
  roundResults: RoundResult[];
  playerScores: Record<string, number>;
  playerIds: string[];
  advancePhase?: boolean;
  timeUp?: boolean;
}

export interface PlayerRoundResult {
  guesses: number[];
  correct: boolean;
  guessCount: number;
  score: number;
}

export interface RoundResult {
  round: number;
  targetNumber: number;
  playerResults: Record<string, PlayerRoundResult>;
}
