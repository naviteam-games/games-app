export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  gamesPlayed: number;
  gamesWon: number;
  createdAt: string;
  updatedAt: string;
}
