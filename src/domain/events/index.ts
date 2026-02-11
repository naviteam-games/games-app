export type DomainEventType =
  | "player_joined"
  | "player_left"
  | "player_ready"
  | "game_started"
  | "game_action"
  | "phase_changed"
  | "game_finished"
  | "room_cancelled";

export interface DomainEvent {
  type: DomainEventType;
  roomId: string;
  playerId?: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export function createEvent(
  type: DomainEventType,
  roomId: string,
  payload: Record<string, unknown> = {},
  playerId?: string
): DomainEvent {
  return {
    type,
    roomId,
    playerId,
    payload,
    timestamp: new Date().toISOString(),
  };
}
