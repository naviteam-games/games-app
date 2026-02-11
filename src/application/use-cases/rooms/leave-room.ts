import { IGameRoomRepository } from "@/domain/repositories/game-room-repository";
import { IPlayerRepository } from "@/domain/repositories/player-repository";
import { RoomNotFoundError, PlayerNotInRoomError } from "@/domain/errors";

interface LeaveRoomInput {
  roomId: string;
  userId: string;
}

export class LeaveRoomUseCase {
  constructor(
    private gameRoomRepo: IGameRoomRepository,
    private playerRepo: IPlayerRepository
  ) {}

  async execute(input: LeaveRoomInput): Promise<void> {
    const room = await this.gameRoomRepo.findById(input.roomId);
    if (!room) throw new RoomNotFoundError(input.roomId);

    const player = await this.playerRepo.findByRoomAndUser(input.roomId, input.userId);
    if (!player) throw new PlayerNotInRoomError();

    await this.playerRepo.removeFromRoom(input.roomId, input.userId);

    // If host leaves and room is waiting, cancel the room
    if (room.hostId === input.userId && room.status === "waiting") {
      await this.gameRoomRepo.updateStatus(input.roomId, "cancelled");
    }
  }
}
