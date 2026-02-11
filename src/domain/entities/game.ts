export interface Game {
  id: string;
  slug: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  defaultConfig: Record<string, unknown>;
  createdAt: string;
}
