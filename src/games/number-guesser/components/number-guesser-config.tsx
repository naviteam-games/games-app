"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GameConfigProps } from "@/domain/game-engine/types";

export function NumberGuesserConfig({ config, onChange }: GameConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Number of Rounds</Label>
        <Input
          type="number"
          min={1}
          max={20}
          value={(config.rounds as number) ?? 3}
          onChange={(e) => onChange({ ...config, rounds: Number(e.target.value) })}
        />
      </div>
      <div className="space-y-2">
        <Label>Max Number</Label>
        <Input
          type="number"
          min={10}
          max={10000}
          value={(config.maxNumber as number) ?? 100}
          onChange={(e) => onChange({ ...config, maxNumber: Number(e.target.value) })}
        />
      </div>
      <div className="space-y-2">
        <Label>Time per Round (seconds)</Label>
        <Input
          type="number"
          min={5}
          max={60}
          value={(config.roundDurationSeconds as number) ?? 30}
          onChange={(e) => onChange({ ...config, roundDurationSeconds: Math.min(60, Math.max(5, Number(e.target.value))) })}
        />
        <p className="text-xs text-muted-foreground">Suggested: 30s. Max: 60s.</p>
      </div>
    </div>
  );
}
