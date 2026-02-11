import { IGameRoomRepository } from "@/domain/repositories/game-room-repository";
import { IGameStateRepository } from "@/domain/repositories/game-state-repository";
import { IPlayerRepository } from "@/domain/repositories/player-repository";
import { IGameActionRepository } from "@/domain/repositories/game-action-repository";
import { gameRegistry } from "@/games/registry";
import type { GamePhase } from "@/domain/entities/game-state";

export class GameOrchestrator {
  constructor(
    private gameRoomRepo: IGameRoomRepository,
    private gameStateRepo: IGameStateRepository,
    private playerRepo: IPlayerRepository,
    private gameActionRepo: IGameActionRepository
  ) {}

  async handlePhaseTimeout(roomId: string): Promise<void> {
    const room = await this.gameRoomRepo.findById(roomId);
    if (!room || room.status !== "playing") return;

    const gameState = await this.gameStateRepo.findByRoomId(roomId);
    if (!gameState) return;

    const plugin = gameRegistry.getPlugin(room.gameSlug);
    if (!plugin) return;

    // Force resolve the current phase
    let stateData = plugin.resolvePhase(gameState.stateData, gameState.phase);

    if (plugin.isGameOver(stateData)) {
      await this.finishGame(roomId, stateData);
      return;
    }

    const nextPhase = plugin.getNextPhase(gameState.phase, stateData);
    const duration = plugin.getPhaseDuration(nextPhase, room.config);
    const phaseDeadline = duration
      ? new Date(Date.now() + duration * 1000).toISOString()
      : null;

    const newRound = nextPhase === "playing" && gameState.phase === "round_end"
      ? gameState.currentRound + 1
      : gameState.currentRound;

    await this.gameStateRepo.update(roomId, {
      phase: nextPhase,
      currentRound: newRound,
      stateData,
      phaseDeadline,
    });

    // Schedule next timeout if needed
    if (duration) {
      this.scheduleTimeout(roomId, duration * 1000);
    }
  }

  private async finishGame(roomId: string, stateData: Record<string, unknown>): Promise<void> {
    const room = await this.gameRoomRepo.findById(roomId);
    if (!room) return;

    const plugin = gameRegistry.getPlugin(room.gameSlug);
    if (!plugin) return;

    const results = plugin.calculateResults(stateData);
    const players = await this.playerRepo.findByRoomId(roomId);

    await Promise.all(
      results.rankings.map((r) => {
        const player = players.find((p) => p.userId === r.playerId);
        if (player) return this.playerRepo.updateScore(player.id, r.score);
      })
    );

    await this.gameStateRepo.update(roomId, {
      phase: "finished" as GamePhase,
      stateData,
      phaseDeadline: null,
    });

    await this.gameRoomRepo.updateStatus(roomId, "finished");
  }

  private scheduleTimeout(roomId: string, ms: number): void {
    // MVP: setTimeout. Upgrade to pg_cron/BullMQ for production.
    setTimeout(() => {
      this.handlePhaseTimeout(roomId).catch(console.error);
    }, ms);
  }
}
