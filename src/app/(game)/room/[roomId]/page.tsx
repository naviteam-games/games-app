"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/presentation/providers/auth-provider";
import { WaitingRoom } from "@/presentation/components/room/waiting-room";
import { GameContainer } from "@/presentation/components/room/game-container";
import { ResultsView } from "@/presentation/components/room/results-view";
import { Skeleton } from "@/components/ui/skeleton";
import type { GameRoom } from "@/domain/entities/game-room";
import type { Player } from "@/domain/entities/player";
import type { GameState } from "@/domain/entities/game-state";
import type { InviteCode } from "@/domain/entities/invite";

const POLL_INTERVAL_MS = 3000;

interface RoomData {
  room: GameRoom;
  players: Player[];
  gameState: GameState | null;
  inviteCodes: InviteCode[];
}

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const fetchRoom = useCallback(async () => {
    const res = await fetch(`/api/rooms/${roomId}`);
    if (!res.ok) {
      router.push("/dashboard");
      return;
    }
    const roomData = await res.json();
    setData(roomData);
    setLoading(false);
  }, [roomId, router]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchRoom();
    }
  }, [fetchRoom, user]);

  // Poll for updates every 3 seconds — reliable regardless of
  // Supabase Realtime configuration. When you enable Postgres Changes
  // in the Supabase dashboard later, you can reduce/remove this.
  const fetchRef = useRef(fetchRoom);
  fetchRef.current = fetchRoom;

  useEffect(() => {
    if (!user) return;
    const id = setInterval(() => { fetchRef.current(); }, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [user]);

  if (loading || !data || !user) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { room, players, gameState, inviteCodes } = data;
  const isHost = room.hostId === user.id;

  if (room.status === "waiting") {
    return (
      <WaitingRoom
        room={room}
        players={players}
        inviteCodes={inviteCodes}
        isHost={isHost}
        currentUserId={user.id}
        onRefresh={fetchRoom}
      />
    );
  }

  if (room.status === "playing" && gameState) {
    return (
      <GameContainer
        room={room}
        players={players}
        gameState={gameState}
        currentUserId={user.id}
        onRefresh={fetchRoom}
      />
    );
  }

  if (room.status === "finished" && gameState) {
    return (
      <ResultsView
        room={room}
        players={players}
        gameState={gameState}
      />
    );
  }

  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">This game has been cancelled.</p>
    </div>
  );
}
