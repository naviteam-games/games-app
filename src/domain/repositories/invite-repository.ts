import { InviteCode } from "../entities/invite";

export interface IInviteRepository {
  create(invite: Omit<InviteCode, "id" | "useCount" | "createdAt">): Promise<InviteCode>;
  findByCode(code: string): Promise<InviteCode | null>;
  findByRoomId(roomId: string): Promise<InviteCode[]>;
  incrementUseCount(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}
