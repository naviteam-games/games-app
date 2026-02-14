"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/presentation/providers/auth-provider";
import { createClient } from "@/infrastructure/supabase/client";
import { DisplayNamePrompt } from "@/presentation/components/shared/display-name-prompt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FunnyLoader } from "@/presentation/components/shared/funny-loader";

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
  const [nameCollected, setNameCollected] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [joinAttempted, setJoinAttempted] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);
  const [minDelayPassed, setMinDelayPassed] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  // Minimum 2s animation time for the funny loader
  useEffect(() => {
    const timer = setTimeout(() => setMinDelayPassed(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Validate invite code (works without auth via updated API)
  useEffect(() => {
    fetch(`/api/rooms/validate-invite?code=${code}`)
      .then((r) => r.json())
      .then((data) => {
        setInfo(data);
        setDataReady(true);
      })
      .catch(() => {
        setError("Failed to validate invite");
        setDataReady(true);
      });
  }, [code]);

  // Only clear loading when both min delay and data are ready
  useEffect(() => {
    if (dataReady && minDelayPassed) setLoading(false);
  }, [dataReady, minDelayPassed]);

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

  // Show name prompt once anonymous user is ready (only on first load, not after dismiss)
  useEffect(() => {
    if (user && isAnonymous && info?.valid && !showNamePrompt && !nameCollected && !joining && !promptDismissed) {
      setShowNamePrompt(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAnonymous, info?.valid]);

  const handleJoin = useCallback(async () => {
    if (!info?.room) return;
    setJoining(true);
    setError(null);

    try {
      const res = await fetch(`/api/rooms/${info.room.id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to join game");
        setJoining(false);
        return;
      }

      router.push(`/room/${data.room.id}`);
    } catch {
      setError("Failed to join game. Please try again.");
      setJoining(false);
    }
  }, [info, code, router]);

  const handleNameComplete = async (displayName: string) => {
    setShowNamePrompt(false);
    setNameCollected(true);

    try {
      // Update profile with chosen display name
      await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", user!.id);

      // Now join the room
      await handleJoin();
    } catch {
      setError("Failed to join game. Please try again.");
      setJoining(false);
    }
  };

  // Auto-join for authenticated (non-anonymous) users
  useEffect(() => {
    if (user && !isAnonymous && info?.valid && !joining && !joinAttempted) {
      setJoinAttempted(true);
      handleJoin();
    }
  }, [user, isAnonymous, info, joining, joinAttempted, handleJoin]);

  if (loading || (!dataReady && (authLoading || signingIn))) {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
        <Card>
          <CardContent>
            <FunnyLoader size="lg" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!info?.valid || !info.room) {
    return (
      <div className="max-w-md mx-auto px-4 py-6">
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

  const handleCancelPrompt = () => {
    setShowNamePrompt(false);
    setPromptDismissed(true);
  };

  const handleJoinClick = () => {
    if (isAnonymous && !nameCollected) {
      setPromptDismissed(false);
      setShowNamePrompt(true);
    } else {
      handleJoin();
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <DisplayNamePrompt
        open={showNamePrompt}
        onComplete={handleNameComplete}
        onCancel={handleCancelPrompt}
      />
      <Card>
        <CardHeader>
          <CardTitle>Join Game</CardTitle>
          <CardDescription>You&apos;ve been invited to a game</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Room</p>
                <span className="font-medium">{info.room.name}</span>
              </div>
              <Badge variant="secondary">{info.room.gameSlug}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {info.playerCount} / {info.room.maxPlayers} players
            </p>
          </div>

          {error && (
            <div className="space-y-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {joining && !error ? (
            <p className="text-sm text-muted-foreground">Joining game...</p>
          ) : (
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => router.push("/")}>
                Go Home
              </Button>
              <Button className="flex-1" onClick={handleJoinClick}>
                Join Game
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
