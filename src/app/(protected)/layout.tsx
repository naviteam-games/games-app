export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";
import { isAnonymousUser } from "@/lib/auth-utils";
import { AuthProvider } from "@/presentation/providers/auth-provider";
import { Navbar } from "@/presentation/components/layout/navbar";
import { Toaster } from "@/components/ui/sonner";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || isAnonymousUser(user)) {
    redirect("/login");
  }

  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
      <Toaster />
    </AuthProvider>
  );
}
