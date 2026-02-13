import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.gamesapp.app",
  appName: "Tiny Gam",
  webDir: "out",
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "https://games.yourdomain.com",
    allowNavigation: ["games.yourdomain.com", "*.supabase.co"],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1a1a2e",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#1a1a2e",
    },
  },
};

export default config;
