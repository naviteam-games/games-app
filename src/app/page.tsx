import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppLogo } from "@/presentation/components/shared/app-logo";
import { LandingNavbar } from "@/presentation/components/layout/landing-navbar";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNavbar />

      <main className="flex-1 flex items-center justify-center px-4 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.55_0.24_264/0.12),transparent)]" />
        <div className="text-center max-w-2xl space-y-6">
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Small Games,{" "}
            <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">Big Fun</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Create private game rooms, invite your group, and play together.
            Perfect for parties, hangouts, icebreakers, and fun challenges.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p><AppLogo /> — Small games, Big fun</p>
      </footer>
    </div>
  );
}
