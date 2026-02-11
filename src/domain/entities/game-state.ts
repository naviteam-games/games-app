export type GamePhase = "setup" | "playing" | "round_end" | "finished";

export interface GameState {
  id: string;
  roomId: string;
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  stateData: Record<string, unknown>;
  phaseDeadline: string | null;
  updatedAt: string;
}
