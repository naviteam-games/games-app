import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/infrastructure/supabase/server";
import { createAdminClient } from "@/infrastructure/supabase/admin";
import { createContainer } from "@/infrastructure/di/container";
import { gameActionSchema } from "@/lib/schemas";
import { DomainError, InvalidGameActionError } from "@/domain/errors";
import { gameRegistry } from "@/games/registry";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const parsed = gameActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    // Use admin client — actions update game state and player scores across all players
    const container = createContainer(createAdminClient());
    const room = await container.gameRoomRepository.findById(roomId);
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    if (room.status !== "playing") {
      return NextResponse.json({ error: "Game is not in progress" }, { status: 400 });
    }

    const gameState = await container.gameStateRepository.findByRoomId(roomId);
    if (!gameState) return NextResponse.json({ error: "Game state not found" }, { status: 404 });

    const plugin = gameRegistry.getPlugin(room.gameSlug);
    if (!plugin) return NextResponse.json({ error: "Game type not found" }, { status: 400 });

    const action = {
      type: parsed.data.actionType,
      playerId: user.id,
      data: parsed.data.data,
    };

    // Validate action
    const validation = plugin.validateAction(gameState.stateData, action);
    if (!validation.valid) {
      throw new InvalidGameActionError(validation.error ?? "Invalid action");
    }

    // Apply action
    let newStateData = plugin.applyAction(gameState.stateData, action);

    // Record action
    await container.gameActionRepository.create({
      roomId,
      playerId: user.id,
      actionType: parsed.data.actionType,
      actionData: parsed.data.data,
      round: gameState.currentRound,
    });

    // Check phase completion
    let newPhase = gameState.phase;
    let phaseDeadline = gameState.phaseDeadline;

    if (plugin.isPhaseComplete(newStateData, gameState.phase)) {
      newStateData = plugin.resolvePhase(newStateData, gameState.phase);

      // After round_end, check if the game is over
      if (gameState.phase !== "playing" && plugin.isGameOver(newStateData)) {
        newPhase = "finished";
        phaseDeadline = null;

        // Update scores
        const results = plugin.calculateResults(newStateData);
        const players = await container.playerRepository.findByRoomId(roomId);
        await Promise.all(
          results.rankings.map((r) => {
            const player = players.find((p) => p.userId === r.playerId);
            if (player) {
              return container.playerRepository.updateScore(player.id, r.score);
            }
          })
        );

        await container.gameRoomRepository.updateStatus(roomId, "finished");
      } else {
        newPhase = plugin.getNextPhase(gameState.phase, newStateData);
        const duration = plugin.getPhaseDuration(newPhase, room.config);
        phaseDeadline = duration
          ? new Date(Date.now() + duration * 1000).toISOString()
          : null;
      }
    }

    const newRound = newPhase === "playing" && gameState.phase === "round_end"
      ? gameState.currentRound + 1
      : gameState.currentRound;

    await container.gameStateRepository.update(roomId, {
      phase: newPhase,
      currentRound: newRound,
      stateData: newStateData,
      phaseDeadline,
    });

    return NextResponse.json({
      success: true,
      phase: newPhase,
      currentRound: newRound,
    });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    console.error("Game action error:", error);
    const message = process.env.NODE_ENV === "development" && error instanceof Error
      ? error.message
      : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
