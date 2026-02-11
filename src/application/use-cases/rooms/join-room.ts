import { IGameRoomRepository } from "@/domain/repositories/game-room-repository";
import { IPlayerRepository } from "@/domain/repositories/player-repository";
import { IInviteRepository } from "@/domain/repositories/invite-repository";
import { Player } from "@/domain/entities/player";
import { GameRoom } from "@/domain/entities/game-room";
import {
  InvalidInviteError,
  RoomNotFoundError,
  RoomFullError,
  AlreadyInRoomError,
} from "@/domain/errors";

interface JoinRoomInput {
  code: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
}

interface JoinRoomResult {
  room: GameRoom;
  player: Player;
}

export class JoinRoomUseCase {
  constructor(
    private gameRoomRepo: IGameRoomRepository,
    private playerRepo: IPlayerRepository,
    private inviteRepo: IInviteRepository
  ) {}

  async execute(input: JoinRoomInput): Promise<JoinRoomResult> {
    const invite = await this.inviteRepo.findByCode(input.code);
    if (!invite) throw new InvalidInviteError("Code not found");

    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      throw new InvalidInviteError("Code has expired");
    }
    if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
      throw new InvalidInviteError("Code has reached max uses");
    }

    const room = await this.gameRoomRepo.findById(invite.roomId);
    if (!room) throw new RoomNotFoundError(invite.roomId);

    if (room.status !== "waiting") {
      throw new InvalidInviteError("Game has already started or ended");
    }

    const existing = await this.playerRepo.findByRoomAndUser(room.id, input.userId);
    if (existing) throw new AlreadyInRoomError();

    const count = await this.playerRepo.countByRoom(room.id);
    if (count >= room.maxPlayers) throw new RoomFullError();

    const player = await this.playerRepo.addToRoom(
      room.id,
      input.userId,
      input.displayName,
      input.avatarUrl
    );

    await this.inviteRepo.incrementUseCount(invite.id);

    return { room, player };
  }
}
