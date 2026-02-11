import { Player, PlayerStatus } from "../entities/player";

export interface IPlayerRepository {
  addToRoom(roomId: string, userId: string, displayName: string, avatarUrl: string | null): Promise<Player>;
  findByRoomId(roomId: string): Promise<Player[]>;
  findByRoomAndUser(roomId: string, userId: string): Promise<Player | null>;
  updateStatus(id: string, status: PlayerStatus): Promise<Player>;
  updateScore(id: string, score: number): Promise<Player>;
  removeFromRoom(roomId: string, userId: string): Promise<void>;
  countByRoom(roomId: string): Promise<number>;
}
