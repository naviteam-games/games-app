"use client";

import { createClient } from "@/infrastructure/supabase/client";
import { Button } from "@/components/ui/button";
import type { Provider } from "@supabase/supabase-js";

const providers: { name: string; provider: Provider }[] = [
  { name: "Google", provider: "google" },
  { name: "Facebook", provider: "facebook" },
  { name: "LinkedIn", provider: "linkedin_oidc" },
];

export function SocialLoginButtons() {
  const supabase = createClient();

  const handleSocialLogin = async (provider: Provider) => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {providers.map(({ name, provider }) => (
        <Button
          key={provider}
          variant="outline"
          className="w-full"
          onClick={() => handleSocialLogin(provider)}
        >
          Continue with {name}
        </Button>
      ))}
    </div>
  );
}
