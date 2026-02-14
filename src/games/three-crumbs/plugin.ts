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
import { ThreeCrumbsBoard } from "./components/three-crumbs-board";
import { ThreeCrumbsConfig } from "./components/three-crumbs-config";
import { ThreeCrumbsResults } from "./components/three-crumbs-results";

export const threeCrumbsPlugin: IGamePlugin = {
  slug: "three-crumbs",
  name: "3 Crumbs",
  description: "3 clues, 1 answer — guess the answer from the crumbs (clues) the host reveals!",
  minPlayers: 2,
  maxPlayers: 50,
  hostPlays: false,
  theme: { primary: "oklch(0.65 0.18 55)" },

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

  BoardComponent: ThreeCrumbsBoard,
  ConfigComponent: ThreeCrumbsConfig,
  ResultsComponent: ThreeCrumbsResults,
};
