"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DisplayNamePromptProps {
  open: boolean;
  onComplete: (displayName: string) => void;
}

export function DisplayNamePrompt({ open, onComplete }: DisplayNamePromptProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();

    if (!trimmed) {
      setError("Please enter a display name");
      return;
    }
    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    if (trimmed.length > 30) {
      setError("Name must be 30 characters or less");
      return;
    }

    setSubmitting(true);
    setError(null);
    onComplete(trimmed);
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome, Guest!</DialogTitle>
          <DialogDescription>
            Enter a display name to join the game. You can play without creating an account.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display Name</Label>
            <Input
              id="display-name"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Joining..." : "Continue"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
