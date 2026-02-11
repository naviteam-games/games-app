import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/infrastructure/supabase/server";
import { createContainer } from "@/infrastructure/di/container";
import { ToggleReadyUseCase } from "@/application/use-cases/rooms/toggle-ready";
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
    const useCase = new ToggleReadyUseCase(container.playerRepository);

    const player = await useCase.execute({ roomId, userId: user.id });
    return NextResponse.json({ player });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    console.error("Toggle ready error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
