import { GameState, GamePhase } from "../entities/game-state";

export interface IGameStateRepository {
  create(state: Omit<GameState, "id" | "updatedAt">): Promise<GameState>;
  findByRoomId(roomId: string): Promise<GameState | null>;
  update(roomId: string, data: Partial<GameState>): Promise<GameState>;
  updatePhase(roomId: string, phase: GamePhase, stateData: Record<string, unknown>, phaseDeadline?: string | null): Promise<GameState>;
}
