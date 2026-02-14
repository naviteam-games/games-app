export type Category = "bible" | "food" | "animals" | "holidays" | "office";
export type Difficulty = "easy" | "medium" | "hard";

export interface ThreeCrumbsConfig {
  [key: string]: unknown;
  category: Category;
  difficulty: Difficulty;
  rounds: number;
}

export interface Question {
  answer: string;
  alternateAnswers: string[];
  clue1: string; // hardest
  clue2: string; // medium
  clue3: string; // nearly gives it away
}

export interface PlayerGuessEntry {
  text: string;
  correct: boolean;
  timestamp: number;
}

export interface PlayerRoundResult {
  correct: boolean;
  guesses: PlayerGuessEntry[];
  clueNumber: number; // which clue was active when they solved (0 if not solved)
  timeRemaining: number;
  basePoints: number;
  timeBonus: number;
  score: number;
}

export interface RoundResult {
  round: number;
  answer: string;
  playerResults: Record<string, PlayerRoundResult>;
}

export interface ThreeCrumbsState {
  config: ThreeCrumbsConfig;
  currentRound: number;
  totalRounds: number;
  roundQuestions: Question[];
  guesses: Record<string, PlayerGuessEntry[]>;
  solvedBy: Record<string, { clueNumber: number; timeRemaining: number; score: number }>;
  roundStartedAt: number;
  roundResults: RoundResult[];
  playerScores: Record<string, number>;
  playerIds: string[];
  advancePhase?: boolean;
  timeUp?: boolean;
  forceEnd?: boolean;
}
