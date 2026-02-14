import { IInviteRepository } from "@/domain/repositories/invite-repository";
import { IGameRoomRepository } from "@/domain/repositories/game-room-repository";
import { IPlayerRepository } from "@/domain/repositories/player-repository";
import { GameRoom } from "@/domain/entities/game-room";

interface ValidateInviteResult {
  valid: boolean;
  room: GameRoom | null;
  playerCount: number;
  error?: string;
}

export class ValidateInviteUseCase {
  constructor(
    private inviteRepo: IInviteRepository,
    private gameRoomRepo: IGameRoomRepository,
    private playerRepo: IPlayerRepository
  ) {}

  async execute(code: string, retries = 3, delayMs = 300): Promise<ValidateInviteResult> {
    let invite = await this.inviteRepo.findByCode(code);

    // Retry to handle Supabase replication lag on freshly created codes
    if (!invite && retries > 0) {
      for (let i = 0; i < retries && !invite; i++) {
        await new Promise((r) => setTimeout(r, delayMs));
        invite = await this.inviteRepo.findByCode(code);
      }
    }

    if (!invite) return { valid: false, room: null, playerCount: 0, error: "Invalid invite code" };

    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return { valid: false, room: null, playerCount: 0, error: "Invite code has expired" };
    }
    if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
      return { valid: false, room: null, playerCount: 0, error: "Invite code has reached max uses" };
    }

    const room = await this.gameRoomRepo.findById(invite.roomId);
    if (!room) return { valid: false, room: null, playerCount: 0, error: "Room not found" };

    if (room.status !== "waiting") {
      return { valid: false, room, playerCount: 0, error: "Game has already started or ended" };
    }

    const playerCount = await this.playerRepo.countByRoom(room.id);
    if (playerCount >= room.maxPlayers) {
      return { valid: false, room, playerCount, error: "Room is full" };
    }

    return { valid: true, room, playerCount };
  }
}
