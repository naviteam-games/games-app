"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { HelpCircle, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { GameRoom } from "@/domain/entities/game-room";
import type { Player } from "@/domain/entities/player";
import type { InviteCode } from "@/domain/entities/invite";

const howToPlay = {
  "number-guesser": {
    host: [
      "A secret number is picked each round.",
      "Players guess and get hints: higher or lower.",
      "Fewer guesses = more points. First to solve scores highest.",
      "The game runs multiple rounds — top scorer wins!",
    ],
    hostGuide: [
      "Share the invite link so players can join.",
      "Wait for all players to click Ready.",
      "Press Start Game once everyone is ready.",
      "Between rounds, you control when the next round begins.",
    ],
    player: [
      "Each round, guess the secret number.",
      "After each guess you'll see: Higher or Lower.",
      "Solve it in fewer guesses to score more points.",
      "Most points after all rounds wins!",
    ],
  },
} as Record<string, { host: string[]; hostGuide: string[]; player: string[] }>;

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
  const [showQr, setShowQr] = useState(false);
  const currentPlayer = players.find((p) => p.userId === currentUserId);
  const showHowToPlayModal = !isHost && currentPlayer?.status !== "ready";
  const [howToPlayOpen, setHowToPlayOpen] = useState(showHowToPlayModal);
  const rules = howToPlay[room.gameSlug];

  const inviteCode = inviteCodes[0]?.code;
  const inviteLink = typeof window !== "undefined"
    ? `${window.location.origin}/join/${inviteCode}`
    : "";

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
            <Button variant="outline" size="sm" onClick={() => setShowQr((v) => !v)}>
              <QrCode className="h-4 w-4" />
            </Button>
          </div>
          {showQr && inviteLink && (
            <div className="flex justify-center pt-2">
              <div className="bg-white p-3 rounded-lg">
                <QRCodeSVG value={inviteLink} size={180} />
              </div>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Share this link or code with your teammates
          </p>
        </CardContent>
      </Card>

      {/* How to Play & Host Guide — host sees inline cards */}
      {isHost && rules && (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                How to Play
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {rules.host.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Host Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                {rules.hostGuide.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </>
      )}

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

      {/* How to Play — players see modal before readying up */}
      {!isHost && rules && (
        <Dialog open={howToPlayOpen} onOpenChange={setHowToPlayOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>How to Play</DialogTitle>
              <DialogDescription>Quick rules before you start</DialogDescription>
            </DialogHeader>
            <ul className="list-disc list-inside space-y-2 text-sm">
              {rules.player.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>
            <Button className="w-full mt-2" onClick={() => setHowToPlayOpen(false)}>
              Got it!
            </Button>
          </DialogContent>
        </Dialog>
      )}

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
