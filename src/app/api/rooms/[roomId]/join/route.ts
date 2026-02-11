import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/infrastructure/supabase/server";
import { createAdminClient } from "@/infrastructure/supabase/admin";
import { createContainer } from "@/infrastructure/di/container";
import { JoinRoomUseCase } from "@/application/use-cases/rooms/join-room";
import { DomainError } from "@/domain/errors";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { code } = body;
    if (!code) return NextResponse.json({ error: "Invite code is required" }, { status: 400 });

    // Use admin client to bypass RLS — the joining user isn't a room member yet
    const adminClient = createAdminClient();
    const container = createContainer(adminClient);
    const useCase = new JoinRoomUseCase(
      container.gameRoomRepository,
      container.playerRepository,
      container.inviteRepository
    );

    const profile = await container.profileRepository.findById(user.id);

    const result = await useCase.execute({
      code,
      userId: user.id,
      displayName: profile?.displayName ?? user.email?.split("@")[0] ?? "Player",
      avatarUrl: profile?.avatarUrl ?? null,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    console.error("Join room error:", error);
    const message = process.env.NODE_ENV === "development" && error instanceof Error
      ? error.message
      : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
