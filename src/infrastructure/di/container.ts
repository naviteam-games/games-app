import { SupabaseClient } from "@supabase/supabase-js";
import {
  SupabaseProfileRepository,
  SupabaseGameRepository,
  SupabaseGameRoomRepository,
  SupabasePlayerRepository,
  SupabaseGameStateRepository,
  SupabaseInviteRepository,
  SupabaseGameActionRepository,
} from "@/infrastructure/repositories";
import { IProfileRepository } from "@/domain/repositories/profile-repository";
import { IGameRepository } from "@/domain/repositories/game-repository";
import { IGameRoomRepository } from "@/domain/repositories/game-room-repository";
import { IPlayerRepository } from "@/domain/repositories/player-repository";
import { IGameStateRepository } from "@/domain/repositories/game-state-repository";
import { IInviteRepository } from "@/domain/repositories/invite-repository";
import { IGameActionRepository } from "@/domain/repositories/game-action-repository";

export interface Container {
  profileRepository: IProfileRepository;
  gameRepository: IGameRepository;
  gameRoomRepository: IGameRoomRepository;
  playerRepository: IPlayerRepository;
  gameStateRepository: IGameStateRepository;
  inviteRepository: IInviteRepository;
  gameActionRepository: IGameActionRepository;
}

export function createContainer(supabase: SupabaseClient): Container {
  return {
    profileRepository: new SupabaseProfileRepository(supabase),
    gameRepository: new SupabaseGameRepository(supabase),
    gameRoomRepository: new SupabaseGameRoomRepository(supabase),
    playerRepository: new SupabasePlayerRepository(supabase),
    gameStateRepository: new SupabaseGameStateRepository(supabase),
    inviteRepository: new SupabaseInviteRepository(supabase),
    gameActionRepository: new SupabaseGameActionRepository(supabase),
  };
}
