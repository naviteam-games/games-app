// Generated types would go here from `supabase gen types typescript`
// For now, define the database types manually matching our schema

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_url: string | null;
          games_played: number;
          games_won: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string;
          avatar_url?: string | null;
          games_played?: number;
          games_won?: number;
        };
        Update: {
          display_name?: string;
          avatar_url?: string | null;
          games_played?: number;
          games_won?: number;
        };
      };
      games: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          min_players: number;
          max_players: number;
          default_config: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          slug: string;
          name: string;
          description?: string;
          min_players?: number;
          max_players?: number;
          default_config?: Record<string, unknown>;
        };
        Update: {
          name?: string;
          description?: string;
          min_players?: number;
          max_players?: number;
          default_config?: Record<string, unknown>;
        };
      };
      game_rooms: {
        Row: {
          id: string;
          host_id: string;
          game_id: string;
          game_slug: string;
          name: string;
          status: "waiting" | "playing" | "finished" | "cancelled";
          config: Record<string, unknown>;
          max_players: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          host_id: string;
          game_id: string;
          game_slug: string;
          name: string;
          status?: "waiting" | "playing" | "finished" | "cancelled";
          config?: Record<string, unknown>;
          max_players?: number;
        };
        Update: {
          name?: string;
          status?: "waiting" | "playing" | "finished" | "cancelled";
          config?: Record<string, unknown>;
          max_players?: number;
        };
      };
      room_players: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          display_name: string;
          avatar_url: string | null;
          status: "joined" | "ready" | "playing" | "disconnected" | "left";
          score: number;
          joined_at: string;
        };
        Insert: {
          room_id: string;
          user_id: string;
          display_name: string;
          avatar_url?: string | null;
          status?: "joined" | "ready" | "playing" | "disconnected" | "left";
          score?: number;
        };
        Update: {
          status?: "joined" | "ready" | "playing" | "disconnected" | "left";
          score?: number;
          display_name?: string;
        };
      };
      game_states: {
        Row: {
          id: string;
          room_id: string;
          phase: "setup" | "playing" | "round_end" | "finished";
          current_round: number;
          total_rounds: number;
          state_data: Record<string, unknown>;
          phase_deadline: string | null;
          updated_at: string;
        };
        Insert: {
          room_id: string;
          phase?: "setup" | "playing" | "round_end" | "finished";
          current_round?: number;
          total_rounds?: number;
          state_data?: Record<string, unknown>;
          phase_deadline?: string | null;
        };
        Update: {
          phase?: "setup" | "playing" | "round_end" | "finished";
          current_round?: number;
          total_rounds?: number;
          state_data?: Record<string, unknown>;
          phase_deadline?: string | null;
        };
      };
      invite_codes: {
        Row: {
          id: string;
          room_id: string;
          code: string;
          max_uses: number | null;
          use_count: number;
          expires_at: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          room_id: string;
          code: string;
          max_uses?: number | null;
          expires_at?: string | null;
          created_by: string;
        };
        Update: {
          use_count?: number;
        };
      };
      game_actions: {
        Row: {
          id: string;
          room_id: string;
          player_id: string;
          action_type: string;
          action_data: Record<string, unknown>;
          round: number;
          created_at: string;
        };
        Insert: {
          room_id: string;
          player_id: string;
          action_type: string;
          action_data?: Record<string, unknown>;
          round?: number;
        };
        Update: Record<string, never>;
      };
    };
    Enums: {
      room_status: "waiting" | "playing" | "finished" | "cancelled";
      player_status: "joined" | "ready" | "playing" | "disconnected" | "left";
      game_phase: "setup" | "playing" | "round_end" | "finished";
    };
  };
};
