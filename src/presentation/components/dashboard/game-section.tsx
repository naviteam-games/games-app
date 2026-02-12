"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { gameRegistry } from "@/games/registry";

interface GameRoom {
  id: string;
  name: string;
  gameSlug: string;
  status: string;
  maxPlayers: number;
}

interface GameSectionProps {
  title: string;
  count: number;
  defaultOpen?: boolean;
  hostedRooms: GameRoom[];
  invitedRooms: GameRoom[];
  playerCounts: Record<string, number>;
}

const statusColors: Record<string, string> = {
  waiting: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  playing: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  finished: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const gameNames: Record<string, string> = {
  "number-guesser": "Number Guesser",
};

function GameRow({ room, playerCounts, label }: { room: GameRoom; playerCounts: Record<string, number>; label?: string }) {
  const joined = playerCounts[room.id] ?? 0;
  const plugin = gameRegistry.getPlugin(room.gameSlug);
  return (
    <Link href={`/room/${room.id}`} className="block">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium truncate">{room.name}</span>
          <Badge
            variant="outline"
            className="text-xs shrink-0 font-medium"
            style={plugin?.theme ? { borderColor: plugin.theme.primary, color: plugin.theme.primary } : undefined}
          >
            {gameNames[room.gameSlug] ?? room.gameSlug}
          </Badge>
          {label && (
            <Badge variant="secondary" className="text-xs shrink-0">{label}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs sm:text-sm text-muted-foreground">
            {joined}/{room.maxPlayers} joined
          </span>
          <Badge variant="secondary" className={statusColors[room.status]}>
            {room.status}
          </Badge>
        </div>
      </div>
    </Link>
  );
}

export function GameSection({ title, count, defaultOpen = false, hostedRooms, invitedRooms, playerCounts }: GameSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (count === 0) return null;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border bg-card px-4 py-3 text-left hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{title}</span>
          <Badge variant="secondary" className="text-xs">{count}</Badge>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-1 rounded-lg border bg-card divide-y">
          {hostedRooms.length > 0 && (
            <div className="py-2">
              {hostedRooms.length > 0 && invitedRooms.length > 0 && (
                <p className="px-4 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">My Games</p>
              )}
              {hostedRooms.map((room) => (
                <GameRow key={room.id} room={room} playerCounts={playerCounts} />
              ))}
            </div>
          )}
          {invitedRooms.length > 0 && (
            <div className="py-2">
              {hostedRooms.length > 0 && invitedRooms.length > 0 && (
                <p className="px-4 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">Invited</p>
              )}
              {invitedRooms.map((room) => (
                <GameRow key={room.id} room={room} playerCounts={playerCounts} />
              ))}
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
