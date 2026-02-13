import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Abril_Fatface } from "next/font/google";
import "./globals.css";
import { APP_NAME } from "@/lib/constants";
import { ThemeProvider } from "@/presentation/providers/theme-provider";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const abrilFatface = Abril_Fatface({
  variable: "--font-dm-serif",
  weight: "400",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: APP_NAME,
  description: "Small games, Big fun — create rooms, invite your group, play together.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${abrilFatface.variable} antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
        <Script id="capacitor-safe-area" strategy="afterInteractive">{`
          try {
            if (window.Capacitor && window.Capacitor.isNativePlatform()) {
              document.body.classList.add('native-safe-area');
            }
          } catch (e) {}
        `}</Script>
      </body>
    </html>
  );
}
