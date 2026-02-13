"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLogo } from "@/presentation/components/shared/app-logo";
import Link from "next/link";

export default function PlayPage() {
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    router.push(`/join/${trimmed}`);
  };

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl"><AppLogo className="text-2xl" /></CardTitle>
          <p className="text-muted-foreground">Enter a room code to join</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ROOM CODE"
              className="text-center text-2xl tracking-widest h-14 font-mono"
              maxLength={12}
              autoFocus
              autoComplete="off"
              autoCapitalize="characters"
              inputMode="text"
            />
            <Button type="submit" className="w-full h-12 text-lg" disabled={!code.trim()}>
              Join Game
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Sign in to create games
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
