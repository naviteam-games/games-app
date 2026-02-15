"use client";

import { useState, useEffect, useCallback } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { GameRoom } from "@/domain/entities/game-room";
import type { Player } from "@/domain/entities/player";
import type { InviteCode } from "@/domain/entities/invite";
import { FunnyLoader } from "@/presentation/components/shared/funny-loader";
import { gameRegistry } from "@/games/registry";

const categoryLabels: Record<string, string> = {
  bible: "Bible",
  food: "Food",
  animals: "Animals",
  holidays: "Holidays",
  office: "Office / Workplace",
};

function useInviteReady(code: string | undefined) {
  const [ready, setReady] = useState(false);
  const [validated, setValidated] = useState(false);
  const [minDelayPassed, setMinDelayPassed] = useState(false);

  const check = useCallback(async () => {
    if (!code) return;
    try {
      const res = await fetch(`/api/rooms/validate-invite?code=${code}`);
      const data = await res.json();
      if (data.valid) setValidated(true);
    } catch {
      // ignore, will retry
    }
  }, [code]);

  // Minimum 2.5s animation time
  useEffect(() => {
    const timer = setTimeout(() => setMinDelayPassed(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Poll until validated
  useEffect(() => {
    if (!code || validated) return;

    check();
    const id = setInterval(check, 500);
    const timeout = setTimeout(() => setValidated(true), 10000);

    return () => {
      clearInterval(id);
      clearTimeout(timeout);
    };
  }, [code, check, validated]);

  // Only reveal when both conditions met
  useEffect(() => {
    if (validated && minDelayPassed) setReady(true);
  }, [validated, minDelayPassed]);

  return ready;
}

const howToPlay = {
  "number-guesser": {
    host: [
      "A secret number is picked each round.",
      "Players guess and get color-coded hints: 🟡 Go higher, 🔵 Go lower, 🟢 Correct!",
      "Fewer guesses = more points. First to solve scores highest.",
      "The game runs multiple rounds — top scorer wins!",
    ],
    hostGuide: [
      "Share the invite link so players can join.",
      "Wait for players to join the room.",
      "Press Start Game once at least 2 players have joined.",
      "Between rounds, you control when the next round begins.",
    ],
    player: [
      "Each round, guess the secret number.",
      "After each guess you'll see: 🟡 Go higher, 🔵 Go lower, 🟢 Correct!",
      "Solve it in fewer guesses to score more points.",
      "Most points after all rounds wins!",
    ],
  },
  "three-crumbs": {
    host: [
      "Each round, 3 clues are revealed one at a time on YOUR screen.",
      "Players see NO clues — they guess the answer on their own device.",
      "Solving on Clue 1 = 300 pts, Clue 2 = 200 pts, Clue 3 = 100 pts, plus a time bonus.",
      "The host does NOT play — you share your screen so everyone sees the clues.",
    ],
    hostGuide: [
      "Share the invite link so players can join.",
      "Press Start Game once at least 2 players have joined.",
      "Share your screen so everyone can see the clues.",
      "Between rounds, click Next Round when ready to continue.",
    ],
    player: [
      "The host will share their screen showing clues — look at the big screen!",
      "3 clues are revealed over time: hardest first, easiest last.",
      "Type your guess on your device. Solve earlier for more points!",
      "Most points after all rounds wins!",
    ],
  },
} as Record<string, { host: string[]; hostGuide: string[]; player: string[] }>;

// Stable pseudo-random from player ID — consistent across re-renders
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const fontSizes = ["text-base", "text-lg", "text-xl", "text-2xl", "text-3xl"];
const fontWeights = ["font-medium", "font-semibold", "font-bold", "font-extrabold"];

const slideDirections = [
  { x: -120, y: 0 },   // left
  { x: 120, y: 0 },    // right
  { x: 0, y: -60 },    // top
  { x: 0, y: 60 },     // bottom
  { x: -80, y: -40 },  // top-left
  { x: 80, y: -40 },   // top-right
  { x: -80, y: 40 },   // bottom-left
  { x: 80, y: 40 },    // bottom-right
];

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
  const [showQr, setShowQr] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(!isHost);
  const plugin = gameRegistry.getPlugin(room.gameSlug);
  const rules = howToPlay[room.gameSlug];

  const inviteCode = inviteCodes[0]?.code;
  const inviteReady = useInviteReady(inviteCode);
  const inviteLink = typeof window !== "undefined"
    ? `${window.location.origin}/join/${inviteCode}`
    : "";

  const hostSpectating = room.config.hostPlays === false;
  const hostPlayer = players.find((p) => p.userId === room.hostId);
  const participatingPlayers = hostSpectating
    ? players.filter((p) => p.userId !== room.hostId)
    : players;
  const allReady = participatingPlayers.length >= 2;

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Invite link copied!");
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
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{room.name}</h1>
        <div className="flex items-center justify-center gap-2">
          <Badge
            className="text-sm px-3 py-1 font-semibold text-white"
            style={{ backgroundColor: plugin?.theme?.primary ?? undefined }}
          >
            {plugin?.name ?? room.gameSlug}
          </Badge>
          {typeof room.config.category === "string" && (
            <Badge variant="outline" className="text-sm px-3 py-1">
              {categoryLabels[room.config.category] ?? room.config.category}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">Waiting for players</p>
      </div>

      {/* Invite Panel */}
      <Card className="border-dashed border-2">
        <CardHeader>
          <CardTitle className="text-lg">Invite Your Team</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!inviteReady ? (
            <FunnyLoader size="lg" themeColor={plugin?.theme?.primary} />
          ) : (
            <>
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
                    <QRCodeSVG value={inviteLink} size={256} level="H" />
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Share this link or code with your teammates
              </p>
            </>
          )}
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

      {/* Spectating Host — separate section */}
      {hostSpectating && hostPlayer && (
        <Card className="border-dashed">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {hostPlayer.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{hostPlayer.displayName}</span>
              </div>
              <Badge variant="secondary">Host (Spectating)</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Player Names — kinetic typography flow */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Players ({participatingPlayers.length}/{room.maxPlayers})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3 overflow-hidden py-2">
            <AnimatePresence>
              {participatingPlayers.map((player) => {
                const h = hashCode(player.userId);
                const size = fontSizes[h % fontSizes.length];
                const weight = fontWeights[(h >> 4) % fontWeights.length];
                const dir = slideDirections[(h >> 8) % slideDirections.length];
                // Each bubble gets a unique float pattern
                const floatDuration = 2.5 + (h % 20) / 10;       // 2.5–4.5s
                const floatX = 3 + (h % 5);                       // 3–7px
                const floatY = 4 + ((h >> 3) % 6);                // 4–9px
                const floatDelay = ((h >> 6) % 10) / 10;          // 0–0.9s

                return (
                  <motion.span
                    key={player.id}
                    className={`${size} ${weight} leading-tight whitespace-nowrap rounded-full border bg-muted/50 px-4 py-1.5 select-none`}
                    initial={{ opacity: 0, x: dir.x, y: dir.y, scale: 0.6 }}
                    animate={{
                      opacity: 1,
                      x: [0, floatX, -floatX, 0],
                      y: [0, -floatY, floatY, 0],
                      scale: 1,
                    }}
                    exit={{ opacity: 0, scale: 0.4 }}
                    transition={{
                      opacity: { duration: 0.4 },
                      scale: { type: "spring", stiffness: 180, damping: 18 },
                      x: {
                        duration: floatDuration,
                        repeat: Infinity,
                        repeatType: "mirror",
                        ease: "easeInOut",
                        delay: floatDelay,
                      },
                      y: {
                        duration: floatDuration * 0.8,
                        repeat: Infinity,
                        repeatType: "mirror",
                        ease: "easeInOut",
                        delay: floatDelay + 0.3,
                      },
                    }}
                  >
                    {player.displayName}
                    {player.userId === room.hostId && (
                      <span className="text-xs font-normal text-muted-foreground ml-1 align-middle">
                        (host)
                      </span>
                    )}
                  </motion.span>
                );
              })}
            </AnimatePresence>
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
          Waiting for at least one more player to join...
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={handleLeave}>
          Leave Room
        </Button>
        {isHost && (
          <Button onClick={handleStart} disabled={starting || !allReady}>
            {starting ? "Starting..." : "Start Game"}
          </Button>
        )}
      </div>
    </div>
  );
}
