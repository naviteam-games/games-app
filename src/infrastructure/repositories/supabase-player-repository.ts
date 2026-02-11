import { SupabaseClient } from "@supabase/supabase-js";
import { IPlayerRepository } from "@/domain/repositories/player-repository";
import { Player, PlayerStatus } from "@/domain/entities/player";

function toPlayer(row: any): Player {
  return {
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    status: row.status,
    score: row.score,
    joinedAt: row.joined_at,
    isAnonymous: row.profiles?.is_anonymous ?? false,
  };
}

export class SupabasePlayerRepository implements IPlayerRepository {
  constructor(private supabase: SupabaseClient) {}

  async addToRoom(roomId: string, userId: string, displayName: string, avatarUrl: string | null): Promise<Player> {
    const { data, error } = await this.supabase
      .from("room_players")
      .insert({
        room_id: roomId,
        user_id: userId,
        display_name: displayName,
        avatar_url: avatarUrl,
      })
      .select()
      .single();
    if (error) throw error;
    return toPlayer(data);
  }

  async findByRoomId(roomId: string): Promise<Player[]> {
    // Try with profile join to get anonymous status
    const { data, error } = await this.supabase
      .from("room_players")
      .select("*, profiles:user_id(is_anonymous)")
      .eq("room_id", roomId)
      .neq("status", "left")
      .order("joined_at");

    // If join fails (e.g. is_anonymous column doesn't exist yet), fall back to simple query
    if (error) {
      const { data: fallback, error: fallbackError } = await this.supabase
        .from("room_players")
        .select("*")
        .eq("room_id", roomId)
        .neq("status", "left")
        .order("joined_at");
      if (fallbackError) throw fallbackError;
      return (fallback ?? []).map(toPlayer);
    }

    return (data ?? []).map(toPlayer);
  }

  async findByRoomAndUser(roomId: string, userId: string): Promise<Player | null> {
    const { data, error } = await this.supabase
      .from("room_players")
      .select("*")
      .eq("room_id", roomId)
      .eq("user_id", userId)
      .neq("status", "left")
      .single();
    if (error || !data) return null;
    return toPlayer(data);
  }

  async updateStatus(id: string, status: PlayerStatus): Promise<Player> {
    const { data, error } = await this.supabase
      .from("room_players")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return toPlayer(data);
  }

  async updateScore(id: string, score: number): Promise<Player> {
    const { data, error } = await this.supabase
      .from("room_players")
      .update({ score })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return toPlayer(data);
  }

  async removeFromRoom(roomId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("room_players")
      .update({ status: "left" as PlayerStatus })
      .eq("room_id", roomId)
      .eq("user_id", userId);
    if (error) throw error;
  }

  async countByRoom(roomId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from("room_players")
      .select("*", { count: "exact", head: true })
      .eq("room_id", roomId)
      .neq("status", "left");
    if (error) throw error;
    return count ?? 0;
  }
}
