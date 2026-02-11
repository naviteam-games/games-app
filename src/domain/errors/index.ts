export class DomainError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "DomainError";
  }
}

export class RoomNotFoundError extends DomainError {
  constructor(roomId: string) {
    super(`Room ${roomId} not found`, "ROOM_NOT_FOUND");
  }
}

export class RoomFullError extends DomainError {
  constructor() {
    super("Room is full", "ROOM_FULL");
  }
}

export class InvalidInviteError extends DomainError {
  constructor(reason: string) {
    super(`Invalid invite: ${reason}`, "INVALID_INVITE");
  }
}

export class NotHostError extends DomainError {
  constructor() {
    super("Only the host can perform this action", "NOT_HOST");
  }
}

export class InvalidGameActionError extends DomainError {
  constructor(reason: string) {
    super(`Invalid game action: ${reason}`, "INVALID_GAME_ACTION");
  }
}

export class GameNotFoundError extends DomainError {
  constructor(slug: string) {
    super(`Game type '${slug}' not found`, "GAME_NOT_FOUND");
  }
}

export class InvalidPhaseError extends DomainError {
  constructor(expected: string, actual: string) {
    super(`Expected phase '${expected}', got '${actual}'`, "INVALID_PHASE");
  }
}

export class PlayerNotInRoomError extends DomainError {
  constructor() {
    super("Player is not in this room", "PLAYER_NOT_IN_ROOM");
  }
}

export class AlreadyInRoomError extends DomainError {
  constructor() {
    super("Player is already in this room", "ALREADY_IN_ROOM");
  }
}
