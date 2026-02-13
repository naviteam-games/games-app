export const dynamic = "force-dynamic";

import { AuthProvider } from "@/presentation/providers/auth-provider";
import { Navbar } from "@/presentation/components/layout/navbar";
import { Toaster } from "@/components/ui/sonner";

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
      </div>
      <Toaster />
    </AuthProvider>
  );
}
