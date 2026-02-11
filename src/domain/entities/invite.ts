export interface InviteCode {
  id: string;
  roomId: string;
  code: string;
  maxUses: number | null;
  useCount: number;
  expiresAt: string | null;
  createdBy: string;
  createdAt: string;
}
