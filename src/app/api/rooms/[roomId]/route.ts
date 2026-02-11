import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/infrastructure/supabase/server";
import { createContainer } from "@/infrastructure/di/container";
import { GetRoomUseCase } from "@/application/use-cases/rooms/get-room";
import { DomainError } from "@/domain/errors";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const container = createContainer(supabase);
    const useCase = new GetRoomUseCase(
      container.gameRoomRepository,
      container.playerRepository,
      container.gameStateRepository,
      container.inviteRepository
    );

    const result = await useCase.execute(roomId);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 404 });
    }
    console.error("Get room error:", error);
    const message = process.env.NODE_ENV === "development" && error instanceof Error
      ? error.message
      : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
