"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/client";
import { createRoomSchema } from "@/lib/schemas";
import { DEFAULT_MAX_PLAYERS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NumberGuesserConfig } from "@/games/number-guesser/components/number-guesser-config";
import { getDefaultConfig as getNumberGuesserDefaults } from "@/games/number-guesser/logic";
import type { ComponentType } from "react";
import type { GameConfigProps } from "@/domain/game-engine/types";

const gameConfigs: Record<string, { Component: ComponentType<GameConfigProps>; defaults: Record<string, unknown> }> = {
  "number-guesser": { Component: NumberGuesserConfig, defaults: getNumberGuesserDefaults() },
};

interface GameType {
  id: string;
  slug: string;
  name: string;
  description: string;
  min_players: number;
  max_players: number;
}

export default function CreateRoomPage() {
  const [name, setName] = useState("");
  const [gameSlug, setGameSlug] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(DEFAULT_MAX_PLAYERS);
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [games, setGames] = useState<GameType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.from("games").select("*").then(({ data }) => {
      if (data) {
        setGames(data);
        if (data.length > 0) {
          setGameSlug(data[0].slug);
          setConfig(gameConfigs[data[0].slug]?.defaults ?? {});
        }
      }
    });
  }, [supabase]);

  const handleGameSlugChange = (slug: string) => {
    setGameSlug(slug);
    setConfig(gameConfigs[slug]?.defaults ?? {});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = createRoomSchema.safeParse({ name, gameSlug, maxPlayers, config: Object.keys(config).length > 0 ? config : undefined });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }

    router.push(`/room/${data.room.id}`);
  };

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Game Room</CardTitle>
          <CardDescription>Set up a new game and invite your team</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Room Name</Label>
              <Input
                id="name"
                placeholder="Friday Game Night"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="game">Game Type</Label>
              <Select value={gameSlug} onValueChange={handleGameSlugChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a game" />
                </SelectTrigger>
                <SelectContent>
                  {games.map((g) => (
                    <SelectItem key={g.slug} value={g.slug}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {games.find((g) => g.slug === gameSlug) && (
                <p className="text-sm text-muted-foreground">
                  {games.find((g) => g.slug === gameSlug)!.description}
                </p>
              )}
            </div>

            {gameConfigs[gameSlug] && (
              <div className="space-y-2">
                <Label>Game Settings</Label>
                {(() => {
                  const { Component } = gameConfigs[gameSlug];
                  return <Component config={config} onChange={setConfig} />;
                })()}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="maxPlayers">Max Players</Label>
              <Input
                id="maxPlayers"
                type="number"
                min={2}
                max={100}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Room"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
