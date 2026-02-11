import { SupabaseClient } from "@supabase/supabase-js";
import { IGameStateRepository } from "@/domain/repositories/game-state-repository";
import { GameState, GamePhase } from "@/domain/entities/game-state";

function toGameState(row: any): GameState {
  return {
    id: row.id,
    roomId: row.room_id,
    phase: row.phase,
    currentRound: row.current_round,
    totalRounds: row.total_rounds,
    stateData: row.state_data,
    phaseDeadline: row.phase_deadline,
    updatedAt: row.updated_at,
  };
}

export class SupabaseGameStateRepository implements IGameStateRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(state: Omit<GameState, "id" | "updatedAt">): Promise<GameState> {
    const { data, error } = await this.supabase
      .from("game_states")
      .insert({
        room_id: state.roomId,
        phase: state.phase,
        current_round: state.currentRound,
        total_rounds: state.totalRounds,
        state_data: state.stateData,
        phase_deadline: state.phaseDeadline,
      })
      .select()
      .single();
    if (error) throw error;
    return toGameState(data);
  }

  async findByRoomId(roomId: string): Promise<GameState | null> {
    const { data, error } = await this.supabase
      .from("game_states")
      .select("*")
      .eq("room_id", roomId)
      .single();
    if (error || !data) return null;
    return toGameState(data);
  }

  async update(roomId: string, updateData: Partial<GameState>): Promise<GameState> {
    const dbData: Record<string, any> = {};
    if (updateData.phase !== undefined) dbData.phase = updateData.phase;
    if (updateData.currentRound !== undefined) dbData.current_round = updateData.currentRound;
    if (updateData.totalRounds !== undefined) dbData.total_rounds = updateData.totalRounds;
    if (updateData.stateData !== undefined) dbData.state_data = updateData.stateData;
    if (updateData.phaseDeadline !== undefined) dbData.phase_deadline = updateData.phaseDeadline;

    const { data, error } = await this.supabase
      .from("game_states")
      .update(dbData)
      .eq("room_id", roomId)
      .select()
      .single();
    if (error) throw error;
    return toGameState(data);
  }

  async updatePhase(
    roomId: string,
    phase: GamePhase,
    stateData: Record<string, unknown>,
    phaseDeadline?: string | null
  ): Promise<GameState> {
    const { data, error } = await this.supabase
      .from("game_states")
      .update({
        phase,
        state_data: stateData,
        phase_deadline: phaseDeadline ?? null,
      })
      .eq("room_id", roomId)
      .select()
      .single();
    if (error) throw error;
    return toGameState(data);
  }
}
