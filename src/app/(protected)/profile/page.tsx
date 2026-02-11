"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/presentation/providers/auth-provider";
import { createClient } from "@/infrastructure/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [gamesWon, setGamesWon] = useState(0);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setDisplayName(data.display_name);
            setGamesPlayed(data.games_played);
            setGamesWon(data.games_won);
          }
        });
    }
  }, [user, supabase]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated");
    }
    setLoading(false);
  };

  const initials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Your Info</CardTitle>
          <CardDescription>Update your display name and avatar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{displayName || "Player"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold">{gamesPlayed}</p>
              <p className="text-sm text-muted-foreground">Games Played</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{gamesWon}</p>
              <p className="text-sm text-muted-foreground">Games Won</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
