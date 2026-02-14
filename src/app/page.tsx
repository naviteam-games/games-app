import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/presentation/components/shared/app-logo";
import { LandingNavbar } from "@/presentation/components/layout/landing-navbar";
import { createClient } from "@/infrastructure/supabase/server";
import { gameRegistry } from "@/games/registry";
import { Users, Link2, Zap, ShieldCheck, Gamepad2 } from "lucide-react";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user && !user.is_anonymous;

  const games = gameRegistry.getAllPlugins();

  return (
    <div className="min-h-screen flex flex-col">
      <LandingNavbar
        isLoggedIn={isLoggedIn}
        displayName={user?.user_metadata?.display_name}
        email={user?.email}
      />

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="flex-1 flex items-center justify-center px-4 py-20 relative overflow-hidden">
          {/* Multi-layer gradient background */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,oklch(0.55_0.24_264/0.18),transparent)]" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_50%_at_80%_50%,oklch(0.6_0.2_300/0.08),transparent)]" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_40%_at_20%_60%,oklch(0.6_0.18_180/0.06),transparent)]" />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 -z-10 opacity-[0.03] bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:4rem_4rem]" />

          <div className="text-center max-w-2xl space-y-6">
            <h2 className="text-5xl font-bold tracking-tight sm:text-6xl">
              Small Games,{" "}
              <span className="bg-gradient-to-r from-primary via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
                Big Fun
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto">
              Create private game rooms, invite your group, and play together.
              Perfect for parties, hangouts, icebreakers, and fun challenges.
            </p>
            <div className="flex gap-4 justify-center">
              {isLoggedIn ? (
                <>
                  <Button size="lg" asChild>
                    <a href="#games">Explore</a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" asChild>
                    <Link href="/register">Get Started</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Games Section */}
        <section id="games" className="scroll-mt-16 px-4 py-20 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-muted/50 to-transparent" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_40%_at_30%_50%,oklch(0.55_0.2_264/0.05),transparent)]" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,oklch(0.6_0.15_300/0.04),transparent)]" />
          <div className="container mx-auto max-w-4xl">
            <h3 className="text-2xl font-bold text-center mb-8">
              Available Games
            </h3>
            <div className="grid gap-6 sm:grid-cols-2">
              {games.map((game) => (
                <div
                  key={game.slug}
                  className="group flex flex-col rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-xl font-semibold">{game.name}</h4>
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                      style={{
                        backgroundColor:
                          game.theme?.primary ?? "oklch(0.55 0.17 264)",
                      }}
                    >
                      {game.minPlayers}–{game.maxPlayers} players
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 flex-1">
                    {game.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>
                        {game.hostPlays
                          ? "Host plays/spectates"
                          : "Host spectates"}
                      </span>
                    </div>
                    <Button size="sm" asChild>
                      <Link href={`/room/create?game=${game.slug}`}>Play</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="px-4 py-20 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,oklch(0.6_0.12_180/0.04),transparent)]" />
          <div className="container mx-auto max-w-4xl">
            <h3 className="text-2xl font-bold text-center mb-8">
              How It Works
            </h3>
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                {
                  icon: Gamepad2,
                  title: "Pick a Game",
                  description: "Choose from our growing collection of party games built for groups.",
                },
                {
                  icon: Link2,
                  title: "Share the Link",
                  description: "Send a join link or QR code — players hop in from any device, no app needed.",
                },
                {
                  icon: Zap,
                  title: "Play Instantly",
                  description: "Real-time gameplay with live scores. The host controls the pace.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="text-center space-y-3 p-6"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-semibold">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-4 py-20 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-muted/40 to-transparent" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_70%_40%,oklch(0.55_0.18_55/0.04),transparent)]" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_50%_40%_at_20%_60%,oklch(0.6_0.2_264/0.03),transparent)]" />
          <div className="container mx-auto max-w-4xl">
            <h3 className="text-2xl font-bold text-center mb-8">
              Why Tiny Gam?
            </h3>
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                {
                  icon: Users,
                  title: "Private Rooms",
                  description: "Every game is invite-only. Share the code with your group and nobody else gets in.",
                },
                {
                  icon: Zap,
                  title: "Real-Time & Live",
                  description: "No refreshing. Guesses, scores, and rounds update instantly for everyone.",
                },
                {
                  icon: ShieldCheck,
                  title: "No Downloads",
                  description: "Works in any browser on phone, tablet, or desktop. Just open the link and play.",
                },
                {
                  icon: Gamepad2,
                  title: "Growing Library",
                  description: "New games added regularly. From number crunching to trivia — there's always something fresh.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="flex gap-4 rounded-xl border bg-card p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>
          <AppLogo /> — Small games, Big fun
        </p>
      </footer>
    </div>
  );
}
