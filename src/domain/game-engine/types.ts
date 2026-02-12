import { GamePhase } from "../entities/game-state";
import { ComponentType } from "react";

export interface GameActionPayload {
  type: string;
  playerId: string;
  data: Record<string, unknown>;
}

export interface GameResult {
  rankings: Array<{
    playerId: string;
    displayName: string;
    score: number;
    rank: number;
  }>;
  stats: Record<string, unknown>;
}

export interface PlayerView {
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  timeRemaining: number | null;
  publicState: Record<string, unknown>;
  privateState: Record<string, unknown>;
}

export interface GameConfig {
  [key: string]: unknown;
}

export interface GameBoardProps {
  playerView: PlayerView;
  playerId: string;
  isHost: boolean;
  isSpectator: boolean;
  phaseDeadline: string | null;
  onAction: (actionType: string, data: Record<string, unknown>) => void;
  players: Array<{ id: string; displayName: string; avatarUrl: string | null; score: number }>;
}

export interface GameConfigProps {
  config: GameConfig;
  onChange: (config: GameConfig) => void;
}

export interface GameResultsProps {
  results: GameResult;
  players: Array<{ id: string; displayName: string; avatarUrl: string | null }>;
  currentUserId: string;
  isHost: boolean;
}

export interface IGamePlugin {
  slug: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  hostPlays: boolean;
  theme?: {
    primary: string; // CSS color for badges/inline use (hex or oklch)
  };

  // Pure game logic
  initializeState(config: GameConfig, playerIds: string[]): Record<string, unknown>;
  validateAction(state: Record<string, unknown>, action: GameActionPayload): { valid: boolean; error?: string };
  applyAction(state: Record<string, unknown>, action: GameActionPayload): Record<string, unknown>;
  isPhaseComplete(state: Record<string, unknown>, phase: GamePhase): boolean;
  resolvePhase(state: Record<string, unknown>, phase: GamePhase): Record<string, unknown>;
  getNextPhase(currentPhase: GamePhase, state: Record<string, unknown>): GamePhase;
  isGameOver(state: Record<string, unknown>): boolean;
  calculateResults(state: Record<string, unknown>): GameResult;
  getPlayerView(state: Record<string, unknown>, playerId: string, phase: GamePhase): PlayerView;
  getDefaultConfig(): GameConfig;
  getPhaseDuration(phase: GamePhase, config: GameConfig): number | null; // seconds, null = no timer

  // React components
  BoardComponent: ComponentType<GameBoardProps>;
  ConfigComponent: ComponentType<GameConfigProps>;
  ResultsComponent: ComponentType<GameResultsProps>;
}
