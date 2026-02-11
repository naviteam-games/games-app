import type { IGamePlugin, GameConfig, GameActionPayload, GameResult, PlayerView } from "@/domain/game-engine/types";
import type { GamePhase } from "@/domain/entities/game-state";
import {
  initializeState,
  validateAction,
  applyAction,
  isPhaseComplete,
  resolvePhase,
  getNextPhase,
  isGameOver,
  calculateResults,
  getPlayerView,
  getDefaultConfig,
  getPhaseDuration,
} from "./logic";
import { NumberGuesserBoard } from "./components/number-guesser-board";
import { NumberGuesserConfig } from "./components/number-guesser-config";
import { NumberGuesserResults } from "./components/number-guesser-results";

export const numberGuesserPlugin: IGamePlugin = {
  slug: "number-guesser",
  name: "Number Guesser",
  description: "Guess the secret number! Closest guess wins the round.",
  minPlayers: 2,
  maxPlayers: 20,

  initializeState(config: GameConfig, playerIds: string[]): Record<string, unknown> {
    return initializeState(config, playerIds);
  },

  validateAction(state: Record<string, unknown>, action: GameActionPayload): { valid: boolean; error?: string } {
    return validateAction(state, action);
  },

  applyAction(state: Record<string, unknown>, action: GameActionPayload): Record<string, unknown> {
    return applyAction(state, action);
  },

  isPhaseComplete(state: Record<string, unknown>, phase: GamePhase): boolean {
    return isPhaseComplete(state, phase);
  },

  resolvePhase(state: Record<string, unknown>, phase: GamePhase): Record<string, unknown> {
    return resolvePhase(state, phase);
  },

  getNextPhase(currentPhase: GamePhase, state: Record<string, unknown>): GamePhase {
    return getNextPhase(currentPhase, state);
  },

  isGameOver(state: Record<string, unknown>): boolean {
    return isGameOver(state);
  },

  calculateResults(state: Record<string, unknown>): GameResult {
    return calculateResults(state);
  },

  getPlayerView(state: Record<string, unknown>, playerId: string, phase: GamePhase): PlayerView {
    return getPlayerView(state, playerId, phase);
  },

  getDefaultConfig(): GameConfig {
    return getDefaultConfig();
  },

  getPhaseDuration(phase: GamePhase, config: GameConfig): number | null {
    return getPhaseDuration(phase, config);
  },

  BoardComponent: NumberGuesserBoard,
  ConfigComponent: NumberGuesserConfig,
  ResultsComponent: NumberGuesserResults,
};
