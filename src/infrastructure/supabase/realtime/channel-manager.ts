import { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

export class ChannelManager {
  private channels: Map<string, RealtimeChannel> = new Map();

  constructor(private supabase: SupabaseClient) {}

  getPresenceChannel(roomId: string): RealtimeChannel {
    const key = `room:${roomId}:presence`;
    if (!this.channels.has(key)) {
      const channel = this.supabase.channel(key, {
        config: { presence: { key: "user" } },
      });
      this.channels.set(key, channel);
    }
    return this.channels.get(key)!;
  }

  getGameChannel(roomId: string): RealtimeChannel {
    const key = `room:${roomId}:game`;
    if (!this.channels.has(key)) {
      const channel = this.supabase.channel(key);
      this.channels.set(key, channel);
    }
    return this.channels.get(key)!;
  }

  removeChannel(roomId: string, type: "presence" | "game") {
    const key = `room:${roomId}:${type}`;
    const channel = this.channels.get(key);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.channels.delete(key);
    }
  }

  removeAllChannels(roomId: string) {
    this.removeChannel(roomId, "presence");
    this.removeChannel(roomId, "game");
  }

  cleanup() {
    this.channels.forEach((channel) => {
      this.supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}
