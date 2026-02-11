import { IPlayerRepository } from "@/domain/repositories/player-repository";
import { Player } from "@/domain/entities/player";
import { PlayerNotInRoomError } from "@/domain/errors";

interface ToggleReadyInput {
  roomId: string;
  userId: string;
}

export class ToggleReadyUseCase {
  constructor(private playerRepo: IPlayerRepository) {}

  async execute(input: ToggleReadyInput): Promise<Player> {
    const player = await this.playerRepo.findByRoomAndUser(input.roomId, input.userId);
    if (!player) throw new PlayerNotInRoomError();

    const newStatus = player.status === "ready" ? "joined" : "ready";
    return this.playerRepo.updateStatus(player.id, newStatus);
  }
}
