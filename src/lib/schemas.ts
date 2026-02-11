import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(2, "Display name must be at least 2 characters").max(50),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const createRoomSchema = z.object({
  name: z.string().min(1, "Room name is required").max(100),
  gameSlug: z.string().min(1, "Game type is required"),
  maxPlayers: z.number().int().min(2).max(100),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const joinRoomSchema = z.object({
  code: z.string().min(1, "Invite code is required"),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

export const gameActionSchema = z.object({
  actionType: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type GameActionInput = z.infer<typeof gameActionSchema>;
