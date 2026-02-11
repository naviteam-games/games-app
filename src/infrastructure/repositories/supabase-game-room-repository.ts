import { SupabaseClient } from "@supabase/supabase-js";
import { IGameRoomRepository } from "@/domain/repositories/game-room-repository";
import { GameRoom, RoomStatus } from "@/domain/entities/game-room";

function toGameRoom(row: any): GameRoom {
  return {
    id: row.id,
    hostId: row.host_id,
    gameId: row.game_id,
    gameSlug: row.game_slug,
    name: row.name,
    status: row.status,
    config: row.config,
    maxPlayers: row.max_players,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseGameRoomRepository implements IGameRoomRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(room: Omit<GameRoom, "id" | "createdAt" | "updatedAt">): Promise<GameRoom> {
    const { data, error } = await this.supabase
      .from("game_rooms")
      .insert({
        host_id: room.hostId,
        game_id: room.gameId,
        game_slug: room.gameSlug,
        name: room.name,
        status: room.status,
        config: room.config,
        max_players: room.maxPlayers,
      })
      .select()
      .single();
    if (error) throw error;
    return toGameRoom(data);
  }

  async findById(id: string): Promise<GameRoom | null> {
    const { data, error } = await this.supabase
      .from("game_rooms")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) return null;
    return toGameRoom(data);
  }

  async findByHostId(hostId: string): Promise<GameRoom[]> {
    const { data, error } = await this.supabase
      .from("game_rooms")
      .select("*")
      .eq("host_id", hostId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toGameRoom);
  }

  async findByPlayerId(playerId: string): Promise<GameRoom[]> {
    const { data: playerRooms, error: playerError } = await this.supabase
      .from("room_players")
      .select("room_id")
      .eq("user_id", playerId)
      .neq("status", "left");
    if (playerError) throw playerError;

    if (!playerRooms || playerRooms.length === 0) return [];

    const roomIds = playerRooms.map((r: any) => r.room_id);
    const { data, error } = await this.supabase
      .from("game_rooms")
      .select("*")
      .in("id", roomIds)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toGameRoom);
  }

  async updateStatus(id: string, status: RoomStatus): Promise<GameRoom> {
    const { data, error } = await this.supabase
      .from("game_rooms")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return toGameRoom(data);
  }

  async update(id: string, updateData: Partial<GameRoom>): Promise<GameRoom> {
    const dbData: Record<string, any> = {};
    if (updateData.name !== undefined) dbData.name = updateData.name;
    if (updateData.status !== undefined) dbData.status = updateData.status;
    if (updateData.config !== undefined) dbData.config = updateData.config;
    if (updateData.maxPlayers !== undefined) dbData.max_players = updateData.maxPlayers;

    const { data, error } = await this.supabase
      .from("game_rooms")
      .update(dbData)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return toGameRoom(data);
  }
}
