import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/infrastructure/supabase/server";
import { createAdminClient } from "@/infrastructure/supabase/admin";
import { createContainer } from "@/infrastructure/di/container";
import { DomainError, NotHostError } from "@/domain/errors";
import { gameRegistry } from "@/games/registry";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Use admin client — host needs to update all players' status, not just their own
    const container = createContainer(createAdminClient());
    const room = await container.gameRoomRepository.findById(roomId);
    if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });
    if (room.hostId !== user.id) throw new NotHostError();
    if (room.status !== "waiting") {
      return NextResponse.json({ error: "Game already started" }, { status: 400 });
    }

    const players = await container.playerRepository.findByRoomId(roomId);
    const plugin = gameRegistry.getPlugin(room.gameSlug);
    if (!plugin) return NextResponse.json({ error: "Game type not found" }, { status: 400 });

    if (players.length < plugin.minPlayers) {
      return NextResponse.json({
        error: `Need at least ${plugin.minPlayers} players to start`,
      }, { status: 400 });
    }

    const playerIds = players.map((p) => p.userId);
    const stateData = plugin.initializeState(room.config, playerIds);
    const totalRounds = (room.config.rounds as number) ?? 3;
    const phaseDuration = plugin.getPhaseDuration("playing", room.config);
    const phaseDeadline = phaseDuration
      ? new Date(Date.now() + phaseDuration * 1000).toISOString()
      : null;

    await container.gameStateRepository.create({
      roomId,
      phase: "playing",
      currentRound: 1,
      totalRounds,
      stateData,
      phaseDeadline,
    });

    await container.gameRoomRepository.updateStatus(roomId, "playing");

    // Mark all players as playing
    await Promise.all(
      players.map((p) => container.playerRepository.updateStatus(p.id, "playing"))
    );

    return NextResponse.json({ success: true, phase: "playing" });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    console.error("Start game error:", error);
    const message = process.env.NODE_ENV === "development" && error instanceof Error
      ? error.message
      : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
