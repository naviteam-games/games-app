export type PlayerStatus = "joined" | "ready" | "playing" | "disconnected" | "left";

export interface Player {
  id: string;
  roomId: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  status: PlayerStatus;
  score: number;
  joinedAt: string;
  isAnonymous?: boolean;
}
