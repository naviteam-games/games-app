import { SupabaseClient } from "@supabase/supabase-js";
import { IGameRepository } from "@/domain/repositories/game-repository";
import { Game } from "@/domain/entities/game";

function toGame(row: any): Game {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    minPlayers: row.min_players,
    maxPlayers: row.max_players,
    defaultConfig: row.default_config,
    createdAt: row.created_at,
  };
}

export class SupabaseGameRepository implements IGameRepository {
  constructor(private supabase: SupabaseClient) {}

  async findAll(): Promise<Game[]> {
    const { data, error } = await this.supabase
      .from("games")
      .select("*")
      .order("name");
    if (error) throw error;
    return (data ?? []).map(toGame);
  }

  async findBySlug(slug: string): Promise<Game | null> {
    const { data, error } = await this.supabase
      .from("games")
      .select("*")
      .eq("slug", slug)
      .single();
    if (error || !data) return null;
    return toGame(data);
  }

  async findById(id: string): Promise<Game | null> {
    const { data, error } = await this.supabase
      .from("games")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return toGame(data);
  }
}
