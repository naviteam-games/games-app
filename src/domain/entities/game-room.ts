export type RoomStatus = "waiting" | "playing" | "finished" | "cancelled";

export interface GameRoom {
  id: string;
  hostId: string;
  gameId: string;
  gameSlug: string;
  name: string;
  status: RoomStatus;
  config: Record<string, unknown>;
  maxPlayers: number;
  createdAt: string;
  updatedAt: string;
}
