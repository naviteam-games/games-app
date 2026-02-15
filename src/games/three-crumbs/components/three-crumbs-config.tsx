"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryLabels } from "../questions";
import type { GameConfigProps } from "@/domain/game-engine/types";
import type { Category, Difficulty } from "../types";

const difficultyOptions: { value: Difficulty; label: string; hint: string }[] = [
  { value: "easy", label: "Easy", hint: "60 seconds" },
  { value: "medium", label: "Medium", hint: "45 seconds" },
  { value: "hard", label: "Hard", hint: "30 seconds" },
];

export function ThreeCrumbsConfig({ config, onChange }: GameConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={(config.category as string) ?? "food"}
          onValueChange={(v) => onChange({ ...config, category: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(categoryLabels) as [Category, string][]).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Difficulty</Label>
        <Select
          value={(config.difficulty as string) ?? "medium"}
          onValueChange={(v) => onChange({ ...config, difficulty: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {difficultyOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label} ({opt.hint})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Number of Rounds</Label>
        <Input
          type="number"
          min={5}
          max={20}
          value={(config.rounds as number | "") ?? 10}
          onChange={(e) =>
            onChange({ ...config, rounds: e.target.value === "" ? "" : Number(e.target.value) })
          }
        />
        <p className="text-xs text-muted-foreground">5–20 rounds. Each round is a new question.</p>
      </div>
    </div>
  );
}
