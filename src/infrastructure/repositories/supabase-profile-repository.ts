import { SupabaseClient } from "@supabase/supabase-js";
import { IProfileRepository } from "@/domain/repositories/profile-repository";
import { User } from "@/domain/entities/user";

function toUser(row: any): User {
  return {
    id: row.id,
    email: "",
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    gamesPlayed: row.games_played,
    gamesWon: row.games_won,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseProfileRepository implements IProfileRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return toUser(data);
  }

  async update(id: string, data: Partial<Pick<User, "displayName" | "avatarUrl">>): Promise<User> {
    const updateData: Record<string, any> = {};
    if (data.displayName !== undefined) updateData.display_name = data.displayName;
    if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;

    const { data: row, error } = await this.supabase
      .from("profiles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return toUser(row);
  }

  async incrementGamesPlayed(id: string): Promise<void> {
    const { error } = await this.supabase.rpc("increment_games_played", { user_id: id });
    if (error) {
      // Fallback: read-then-write
      const profile = await this.findById(id);
      if (profile) {
        await this.supabase
          .from("profiles")
          .update({ games_played: profile.gamesPlayed + 1 })
          .eq("id", id);
      }
    }
  }

  async incrementGamesWon(id: string): Promise<void> {
    const { error } = await this.supabase.rpc("increment_games_won", { user_id: id });
    if (error) {
      const profile = await this.findById(id);
      if (profile) {
        await this.supabase
          .from("profiles")
          .update({ games_won: profile.gamesWon + 1 })
          .eq("id", id);
      }
    }
  }
}
