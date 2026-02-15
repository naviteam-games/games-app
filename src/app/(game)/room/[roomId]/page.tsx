"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/client";
import { useAuth } from "@/presentation/providers/auth-provider";
import { WaitingRoom } from "@/presentation/components/room/waiting-room";
import { GameContainer } from "@/presentation/components/room/game-container";
import { ResultsView } from "@/presentation/components/room/results-view";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { GameRoom } from "@/domain/entities/game-room";
import type { Player } from "@/domain/entities/player";
import type { GameState } from "@/domain/entities/game-state";
import type { InviteCode } from "@/domain/entities/invite";

const FALLBACK_POLL_MS = 10_000;
const RECONNECT_POLL_MS = 3_000;

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
  const [connected, setConnected] = useState(true);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}`);
      if (!res.ok) {
        // Only redirect on definitive errors, not transient network issues
        if (res.status === 404 || res.status === 403) {
          router.push("/dashboard");
        }
        return;
      }
      const roomData = await res.json();
      setData(roomData);
      setLoading(false);
      // If we were disconnected and fetch succeeded, we're back
      setConnected(true);
    } catch {
      // Network error — don't redirect, just mark as disconnected
      setConnected(false);
    }
  }, [roomId, router]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchRoom();
    }
  }, [fetchRoom, user]);

  // Stable refs — keep the realtime effect dependency-free from
  // objects that change reference on every render (user, fetchRoom).
  const supabaseRef = useRef(createClient());
  const fetchRoomRef = useRef(fetchRoom);
  fetchRoomRef.current = fetchRoom;
  const connectedRef = useRef(connected);
  connectedRef.current = connected;

  // Supabase Realtime subscription — sub-second updates via Postgres Changes.
  // Uses !!user (boolean) as dep so the channel waits for auth but doesn't
  // re-subscribe when the user object reference changes.
  const isAuthenticated = !!user;

  useEffect(() => {
    if (!isAuthenticated) return;

    const supabase = supabaseRef.current;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const debouncedFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => { fetchRoomRef.current(); }, 300);
    };

    // Unique suffix avoids channel-name collisions during React Strict Mode
    // double-mount in development.
    const channelName = `room:${roomId}:${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_rooms", filter: `id=eq.${roomId}` },
        () => { debouncedFetch(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_states", filter: `room_id=eq.${roomId}` },
        () => { debouncedFetch(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` },
        () => { debouncedFetch(); }
      )
      .subscribe((status) => {
        console.log(`[Realtime] ${channelName} → ${status}`);

        if (status === "SUBSCRIBED") {
          setConnected(true);
          // Fetch immediately on (re)connect to catch anything we missed
          fetchRoomRef.current();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setConnected(false);
        }
      });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [roomId, isAuthenticated]);

  // Fallback poll — faster when disconnected to recover sooner
  useEffect(() => {
    if (!user) return;
    const id = setInterval(
      () => { fetchRoomRef.current(); },
      connectedRef.current ? FALLBACK_POLL_MS : RECONNECT_POLL_MS
    );
    return () => clearInterval(id);
  }, [user, connected]);

  // Refetch when tab regains focus (handles phone lock/unlock, tab switch)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchRoomRef.current();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    // Also handle window focus for desktop browsers
    window.addEventListener("focus", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, []);

  // Show/dismiss toast when connection state changes
  const prevConnected = useRef(true);
  useEffect(() => {
    if (!prevConnected.current && connected) {
      toast.dismiss("connection-lost");
      toast.success("Reconnected!", { duration: 2000 });
    } else if (prevConnected.current && !connected) {
      toast.loading("Connection lost — reconnecting...", {
        id: "connection-lost",
        duration: Infinity,
      });
    }
    prevConnected.current = connected;
  }, [connected]);

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

  const themed = (content: React.ReactNode) => (
    <div className={`game-theme-${room.gameSlug} min-h-[calc(100vh-5rem)]`}>
      <div className="container mx-auto px-4 py-6">
        {content}
      </div>
    </div>
  );

  if (room.status === "waiting") {
    return themed(
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
    return themed(
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
    return themed(
      <ResultsView
        room={room}
        players={players}
        gameState={gameState}
        currentUserId={user.id}
        isHost={isHost}
      />
    );
  }

  return themed(
    <div className="text-center py-12">
      <p className="text-muted-foreground">This game has been cancelled.</p>
    </div>
  );
}
