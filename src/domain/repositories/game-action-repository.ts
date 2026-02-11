import { GameAction } from "../entities/game-action";

export interface IGameActionRepository {
  create(action: Omit<GameAction, "id" | "createdAt">): Promise<GameAction>;
  findByRoomId(roomId: string): Promise<GameAction[]>;
  findByRoomAndRound(roomId: string, round: number): Promise<GameAction[]>;
  findByPlayer(roomId: string, playerId: string): Promise<GameAction[]>;
}
