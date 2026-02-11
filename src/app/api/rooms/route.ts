import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/infrastructure/supabase/server";
import { createContainer } from "@/infrastructure/di/container";
import { CreateRoomUseCase } from "@/application/use-cases/rooms/create-room";
import { createRoomSchema } from "@/lib/schemas";
import { DomainError } from "@/domain/errors";
import { isAnonymousUser } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (isAnonymousUser(user)) return NextResponse.json({ error: "Anonymous users cannot create rooms" }, { status: 403 });

    const body = await request.json();
    const parsed = createRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const container = createContainer(supabase);
    const useCase = new CreateRoomUseCase(
      container.gameRoomRepository,
      container.gameRepository,
      container.playerRepository,
      container.inviteRepository
    );

    const profile = await container.profileRepository.findById(user.id);

    const result = await useCase.execute({
      hostId: user.id,
      hostDisplayName: profile?.displayName ?? user.email?.split("@")[0] ?? "Player",
      hostAvatarUrl: profile?.avatarUrl ?? null,
      gameSlug: parsed.data.gameSlug,
      name: parsed.data.name,
      maxPlayers: parsed.data.maxPlayers,
      config: parsed.data.config,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    console.error("Create room error:", error);
    const message = process.env.NODE_ENV === "development" && error instanceof Error
      ? error.message
      : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
