import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/infrastructure/supabase/admin";
import { createContainer } from "@/infrastructure/di/container";
import { ValidateInviteUseCase } from "@/application/use-cases/rooms/validate-invite";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

    // Use admin client to bypass RLS — this endpoint must work for unauthenticated visitors
    const supabase = createAdminClient();
    const container = createContainer(supabase);
    const useCase = new ValidateInviteUseCase(
      container.inviteRepository,
      container.gameRoomRepository,
      container.playerRepository
    );

    const result = await useCase.execute(code);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Validate invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
