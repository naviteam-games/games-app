import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/infrastructure/supabase/server";
import { createContainer } from "@/infrastructure/di/container";
import { LeaveRoomUseCase } from "@/application/use-cases/rooms/leave-room";
import { DomainError } from "@/domain/errors";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const container = createContainer(supabase);
    const useCase = new LeaveRoomUseCase(
      container.gameRoomRepository,
      container.playerRepository
    );

    await useCase.execute({ roomId, userId: user.id });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    console.error("Leave room error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
