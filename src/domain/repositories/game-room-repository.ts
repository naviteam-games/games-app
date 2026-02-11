import { GameRoom, RoomStatus } from "../entities/game-room";

export interface IGameRoomRepository {
  create(room: Omit<GameRoom, "id" | "createdAt" | "updatedAt">): Promise<GameRoom>;
  findById(id: string): Promise<GameRoom | null>;
  findByHostId(hostId: string): Promise<GameRoom[]>;
  findByPlayerId(playerId: string): Promise<GameRoom[]>;
  updateStatus(id: string, status: RoomStatus): Promise<GameRoom>;
  update(id: string, data: Partial<GameRoom>): Promise<GameRoom>;
}
