export interface GameAction {
  id: string;
  roomId: string;
  playerId: string;
  actionType: string;
  actionData: Record<string, unknown>;
  round: number;
  createdAt: string;
}
