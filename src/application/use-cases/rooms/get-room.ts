import { IGameRoomRepository } from "@/domain/repositories/game-room-repository";
import { IPlayerRepository } from "@/domain/repositories/player-repository";
import { IGameStateRepository } from "@/domain/repositories/game-state-repository";
import { IInviteRepository } from "@/domain/repositories/invite-repository";
import { GameRoom } from "@/domain/entities/game-room";
import { Player } from "@/domain/entities/player";
import { GameState } from "@/domain/entities/game-state";
import { InviteCode } from "@/domain/entities/invite";
import { RoomNotFoundError } from "@/domain/errors";

interface GetRoomResult {
  room: GameRoom;
  players: Player[];
  gameState: GameState | null;
  inviteCodes: InviteCode[];
}

export class GetRoomUseCase {
  constructor(
    private gameRoomRepo: IGameRoomRepository,
    private playerRepo: IPlayerRepository,
    private gameStateRepo: IGameStateRepository,
    private inviteRepo: IInviteRepository
  ) {}

  async execute(roomId: string): Promise<GetRoomResult> {
    const room = await this.gameRoomRepo.findById(roomId);
    if (!room) throw new RoomNotFoundError(roomId);

    // Include players who left so their names show in finished game results
    const includeLeft = room.status === "finished";

    const [players, gameState, inviteCodes] = await Promise.all([
      this.playerRepo.findByRoomId(roomId, { includeLeft }),
      this.gameStateRepo.findByRoomId(roomId),
      this.inviteRepo.findByRoomId(roomId),
    ]);

    return { room, players, gameState, inviteCodes };
  }
}
