import { IGameRoomRepository } from "@/domain/repositories/game-room-repository";
import { IGameRepository } from "@/domain/repositories/game-repository";
import { IPlayerRepository } from "@/domain/repositories/player-repository";
import { IInviteRepository } from "@/domain/repositories/invite-repository";
import { GameRoom } from "@/domain/entities/game-room";
import { InviteCode } from "@/domain/entities/invite";
import { GameNotFoundError } from "@/domain/errors";
import { INVITE_CODE_LENGTH } from "@/lib/constants";

function generateCode(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

interface CreateRoomInput {
  hostId: string;
  hostDisplayName: string;
  hostAvatarUrl: string | null;
  gameSlug: string;
  name: string;
  maxPlayers: number;
  config?: Record<string, unknown>;
}

interface CreateRoomResult {
  room: GameRoom;
  inviteCode: InviteCode;
}

export class CreateRoomUseCase {
  constructor(
    private gameRoomRepo: IGameRoomRepository,
    private gameRepo: IGameRepository,
    private playerRepo: IPlayerRepository,
    private inviteRepo: IInviteRepository
  ) {}

  async execute(input: CreateRoomInput): Promise<CreateRoomResult> {
    const game = await this.gameRepo.findBySlug(input.gameSlug);
    if (!game) throw new GameNotFoundError(input.gameSlug);

    const room = await this.gameRoomRepo.create({
      hostId: input.hostId,
      gameId: game.id,
      gameSlug: game.slug,
      name: input.name,
      status: "waiting",
      config: input.config ?? game.defaultConfig,
      maxPlayers: input.maxPlayers,
    });

    // Host auto-joins
    await this.playerRepo.addToRoom(
      room.id,
      input.hostId,
      input.hostDisplayName,
      input.hostAvatarUrl
    );

    // Auto-generate invite code
    const inviteCode = await this.inviteRepo.create({
      roomId: room.id,
      code: generateCode(INVITE_CODE_LENGTH),
      maxUses: null,
      expiresAt: null,
      createdBy: input.hostId,
    });

    return { room, inviteCode };
  }
}
