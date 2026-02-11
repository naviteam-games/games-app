import { createClient } from "@/infrastructure/supabase/server";
import { createContainer } from "@/infrastructure/di/container";
import { Database } from "@/infrastructure/supabase/types";
import { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GameSection } from "@/presentation/components/dashboard/game-section";

export default async function DashboardPage() {
  const supabase = await createClient() as unknown as SupabaseClient<Database>;
  const { data: { user } } = await supabase.auth.getUser();

  const container = createContainer(supabase);
  const [hostedRooms, joinedRooms] = await Promise.all([
    container.gameRoomRepository.findByHostId(user!.id),
    container.gameRoomRepository.findByPlayerId(user!.id),
  ]);

  const invitedRooms = joinedRooms.filter((r) => r.hostId !== user!.id);

  // Fetch player counts for all rooms in one query
  const allRoomIds = [...new Set([...hostedRooms, ...invitedRooms].map((r) => r.id))];
  const playerCounts: Record<string, number> = {};
  if (allRoomIds.length > 0) {
    const { data: playerRows } = await supabase
      .from("room_players")
      .select("room_id")
      .in("room_id", allRoomIds)
      .neq("status", "left") as { data: Array<{ room_id: string }> | null };
    for (const row of playerRows ?? []) {
      playerCounts[row.room_id] = (playerCounts[row.room_id] ?? 0) + 1;
    }
  }

  // Split rooms by active vs completed
  const isActive = (r: { status: string }) => r.status === "waiting" || r.status === "playing";
  const isCompleted = (r: { status: string }) => r.status === "finished";

  const activeHosted = hostedRooms.filter(isActive);
  const activeInvited = invitedRooms.filter(isActive);
  const completedHosted = hostedRooms.filter(isCompleted);
  const completedInvited = invitedRooms.filter(isCompleted);

  const activeCount = activeHosted.length + activeInvited.length;
  const completedCount = completedHosted.length + completedInvited.length;

  const toSerializable = (rooms: typeof hostedRooms) =>
    rooms.map((r) => ({ id: r.id, name: r.name, gameSlug: r.gameSlug, status: r.status, maxPlayers: r.maxPlayers }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your games at a glance</p>
        </div>
        <Button asChild>
          <Link href="/room/create">Create Game</Link>
        </Button>
      </div>

      <div className="space-y-3">
        <GameSection
          title="Active Games"
          count={activeCount}
          defaultOpen={true}
          hostedRooms={toSerializable(activeHosted)}
          invitedRooms={toSerializable(activeInvited)}
          playerCounts={playerCounts}
        />

        <GameSection
          title="Completed Games"
          count={completedCount}
          defaultOpen={false}
          hostedRooms={toSerializable(completedHosted)}
          invitedRooms={toSerializable(completedInvited)}
          playerCounts={playerCounts}
        />
      </div>

      {activeCount === 0 && completedCount === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No games yet.</p>
            <Button asChild className="mt-4" variant="outline">
              <Link href="/room/create">Create your first game</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
