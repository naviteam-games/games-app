import { User } from "../entities/user";

export interface IProfileRepository {
  findById(id: string): Promise<User | null>;
  update(id: string, data: Partial<Pick<User, "displayName" | "avatarUrl">>): Promise<User>;
  incrementGamesPlayed(id: string): Promise<void>;
  incrementGamesWon(id: string): Promise<void>;
}
