import { SupabaseClient } from "@supabase/supabase-js";
import { IGameActionRepository } from "@/domain/repositories/game-action-repository";
import { GameAction } from "@/domain/entities/game-action";

function toGameAction(row: any): GameAction {
  return {
    id: row.id,
    roomId: row.room_id,
    playerId: row.player_id,
    actionType: row.action_type,
    actionData: row.action_data,
    round: row.round,
    createdAt: row.created_at,
  };
}

export class SupabaseGameActionRepository implements IGameActionRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(action: Omit<GameAction, "id" | "createdAt">): Promise<GameAction> {
    const { data, error } = await this.supabase
      .from("game_actions")
      .insert({
        room_id: action.roomId,
        player_id: action.playerId,
        action_type: action.actionType,
        action_data: action.actionData,
        round: action.round,
      })
      .select()
      .single();
    if (error) throw error;
    return toGameAction(data);
  }

  async findByRoomId(roomId: string): Promise<GameAction[]> {
    const { data, error } = await this.supabase
      .from("game_actions")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at");
    if (error) throw error;
    return (data ?? []).map(toGameAction);
  }

  async findByRoomAndRound(roomId: string, round: number): Promise<GameAction[]> {
    const { data, error } = await this.supabase
      .from("game_actions")
      .select("*")
      .eq("room_id", roomId)
      .eq("round", round)
      .order("created_at");
    if (error) throw error;
    return (data ?? []).map(toGameAction);
  }

  async findByPlayer(roomId: string, playerId: string): Promise<GameAction[]> {
    const { data, error } = await this.supabase
      .from("game_actions")
      .select("*")
      .eq("room_id", roomId)
      .eq("player_id", playerId)
      .order("created_at");
    if (error) throw error;
    return (data ?? []).map(toGameAction);
  }
}
