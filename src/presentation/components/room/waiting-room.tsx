"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { GameRoom } from "@/domain/entities/game-room";
import type { Player } from "@/domain/entities/player";
import type { InviteCode } from "@/domain/entities/invite";

interface WaitingRoomProps {
  room: GameRoom;
  players: Player[];
  inviteCodes: InviteCode[];
  isHost: boolean;
  currentUserId: string;
  onRefresh: () => void;
}

export function WaitingRoom({ room, players, inviteCodes, isHost, currentUserId, onRefresh }: WaitingRoomProps) {
  const [starting, setStarting] = useState(false);
  const [readying, setReadying] = useState(false);

  const inviteCode = inviteCodes[0]?.code;
  const inviteLink = typeof window !== "undefined"
    ? `${window.location.origin}/join/${inviteCode}`
    : "";

  const currentPlayer = players.find((p) => p.userId === currentUserId);
  const allReady = players.length >= 2 && players.every((p) => p.status === "ready" || p.userId === room.hostId);

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied!");
  };

  const handleReady = async () => {
    setReadying(true);
    await fetch(`/api/rooms/${room.id}/ready`, { method: "POST" });
    onRefresh();
    setReadying(false);
  };

  const handleStart = async () => {
    setStarting(true);
    const res = await fetch(`/api/rooms/${room.id}/start`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error);
      setStarting(false);
      return;
    }
    onRefresh();
  };

  const handleLeave = async () => {
    await fetch(`/api/rooms/${room.id}/leave`, { method: "POST" });
    window.location.href = "/dashboard";
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{room.name}</h1>
        <p className="text-muted-foreground">{room.gameSlug} — Waiting for players</p>
      </div>

      {/* Invite Panel */}
      <Card className="border-dashed border-2">
        <CardHeader>
          <CardTitle className="text-lg">Invite Your Team</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <code className="flex-1 bg-muted px-3 py-2 rounded-md text-sm font-mono truncate">
              {inviteCode}
            </code>
            <Button variant="outline" size="sm" onClick={copyInvite}>
              Copy Link
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this link or code with your teammates
          </p>
        </CardContent>
      </Card>

      {/* Player List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Players ({players.length}/{room.maxPlayers})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {players.map((player) => (
              <div key={player.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {player.displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{player.displayName}</span>
                  {player.isAnonymous && (
                    <Badge variant="outline" className="text-xs">Guest</Badge>
                  )}
                </div>
                {player.userId === room.hostId ? (
                  <Badge variant="secondary">Host</Badge>
                ) : (
                  <Badge variant={player.status === "ready" ? "default" : "outline"}>
                    {player.status === "ready" ? "Ready" : "Not Ready"}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Start requirements hint for host */}
      {isHost && !allReady && (
        <p className="text-sm text-muted-foreground text-center">
          {players.length < 2
            ? "Waiting for at least one more player to join..."
            : "Waiting for all players to ready up..."}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={handleLeave}>
          Leave Room
        </Button>
        {!isHost && currentPlayer && (
          <Button onClick={handleReady} disabled={readying}>
            {currentPlayer.status === "ready" ? "Unready" : "Ready Up"}
          </Button>
        )}
        {isHost && (
          <Button onClick={handleStart} disabled={starting || !allReady}>
            {starting ? "Starting..." : "Start Game"}
          </Button>
        )}
      </div>
    </div>
  );
}
