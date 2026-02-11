"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/presentation/providers/auth-provider";
import { createClient } from "@/infrastructure/supabase/client";
import { DisplayNamePrompt } from "@/presentation/components/shared/display-name-prompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface InviteInfo {
  valid: boolean;
  room: {
    id: string;
    name: string;
    gameSlug: string;
    maxPlayers: number;
    status: string;
  } | null;
  playerCount: number;
  error?: string;
}

export default function JoinByCodePage() {
  const { code } = useParams<{ code: string }>();
  const { user, loading: authLoading, isAnonymous } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [joinAttempted, setJoinAttempted] = useState(false);

  // Validate invite code (works without auth via updated API)
  useEffect(() => {
    fetch(`/api/rooms/validate-invite?code=${code}`)
      .then((r) => r.json())
      .then((data) => {
        setInfo(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to validate invite");
        setLoading(false);
      });
  }, [code]);

  // Auto sign-in anonymously if no user session exists
  useEffect(() => {
    if (authLoading || user || signingIn) return;

    const signInAnon = async () => {
      setSigningIn(true);
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        setError("Failed to create guest session. Please try again.");
      }
      setSigningIn(false);
    };

    signInAnon();
  }, [authLoading, user, signingIn, supabase.auth]);

  // Show name prompt once anonymous user is ready
  useEffect(() => {
    if (user && isAnonymous && info?.valid && !showNamePrompt && !joining) {
      setShowNamePrompt(true);
    }
  }, [user, isAnonymous, info, showNamePrompt, joining]);

  const handleJoin = useCallback(async () => {
    if (!info?.room) return;
    setJoining(true);
    setError(null);

    const res = await fetch(`/api/rooms/${info.room.id}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      setJoining(false);
      return;
    }

    router.push(`/room/${data.room.id}`);
  }, [info, code, router]);

  const handleNameComplete = async (displayName: string) => {
    setShowNamePrompt(false);

    // Update profile with chosen display name
    await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", user!.id);

    // Now join the room
    await handleJoin();
  };

  // Auto-join for authenticated (non-anonymous) users
  useEffect(() => {
    if (user && !isAnonymous && info?.valid && !joining && !joinAttempted) {
      setJoinAttempted(true);
      handleJoin();
    }
  }, [user, isAnonymous, info, joining, joinAttempted, handleJoin]);

  if (loading || authLoading || signingIn) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!info?.valid || !info.room) {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Invalid Invite</CardTitle>
            <CardDescription>{info?.error ?? "This invite link is not valid."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => router.push("/")}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <DisplayNamePrompt
        open={showNamePrompt}
        onComplete={handleNameComplete}
      />
      <Card>
        <CardHeader>
          <CardTitle>Join Game</CardTitle>
          <CardDescription>You&apos;ve been invited to a game</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{info.room.name}</span>
              <Badge variant="secondary">{info.room.gameSlug}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {info.playerCount} / {info.room.maxPlayers} players
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {joining && (
            <p className="text-sm text-muted-foreground">Joining game...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
