import { SupabaseClient } from "@supabase/supabase-js";
import { IInviteRepository } from "@/domain/repositories/invite-repository";
import { InviteCode } from "@/domain/entities/invite";

function toInvite(row: any): InviteCode {
  return {
    id: row.id,
    roomId: row.room_id,
    code: row.code,
    maxUses: row.max_uses,
    useCount: row.use_count,
    expiresAt: row.expires_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export class SupabaseInviteRepository implements IInviteRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(invite: Omit<InviteCode, "id" | "useCount" | "createdAt">): Promise<InviteCode> {
    const { data, error } = await this.supabase
      .from("invite_codes")
      .insert({
        room_id: invite.roomId,
        code: invite.code,
        max_uses: invite.maxUses,
        expires_at: invite.expiresAt,
        created_by: invite.createdBy,
      })
      .select()
      .single();
    if (error) throw error;
    return toInvite(data);
  }

  async findByCode(code: string): Promise<InviteCode | null> {
    const { data, error } = await this.supabase
      .from("invite_codes")
      .select("*")
      .eq("code", code)
      .single();
    if (error || !data) return null;
    return toInvite(data);
  }

  async findByRoomId(roomId: string): Promise<InviteCode[]> {
    const { data, error } = await this.supabase
      .from("invite_codes")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toInvite);
  }

  async incrementUseCount(id: string): Promise<void> {
    // Use raw SQL via rpc or read-then-write
    const { data } = await this.supabase
      .from("invite_codes")
      .select("use_count")
      .eq("id", id)
      .single();
    if (data) {
      await this.supabase
        .from("invite_codes")
        .update({ use_count: (data as any).use_count + 1 })
        .eq("id", id);
    }
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("invite_codes")
      .delete()
      .eq("id", id);
    if (error) throw error;
  }
}
