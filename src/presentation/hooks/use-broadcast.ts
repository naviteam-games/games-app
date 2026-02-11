"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export function useBroadcast(
  roomId: string,
  onMessage: (event: string, payload: Record<string, unknown>) => void
) {
  const supabase = createClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}:game`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "game_event" }, ({ payload }) => {
        onMessage(payload.event as string, payload.data as Record<string, unknown>);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, supabase, onMessage]);

  const broadcast = useCallback(
    (event: string, data: Record<string, unknown>) => {
      channelRef.current?.send({
        type: "broadcast",
        event: "game_event",
        payload: { event, data },
      });
    },
    []
  );

  return { broadcast };
}
