import { Game } from "../entities/game";

export interface IGameRepository {
  findAll(): Promise<Game[]>;
  findBySlug(slug: string): Promise<Game | null>;
  findById(id: string): Promise<Game | null>;
}
