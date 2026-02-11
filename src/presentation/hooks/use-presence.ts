"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/infrastructure/supabase/client";

interface PresenceUser {
  id: string;
  displayName: string;
  onlineAt: string;
}

export function usePresence(roomId: string, userId: string, displayName: string) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}:presence`, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = [];
        Object.values(state).forEach((presences) => {
          const p = presences[0] as unknown as PresenceUser;
          if (p) users.push(p);
        });
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            id: userId,
            displayName,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, userId, displayName, supabase]);

  return { onlineUsers };
}
