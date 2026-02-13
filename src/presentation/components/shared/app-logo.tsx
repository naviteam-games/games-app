import { cn } from "@/lib/utils";

function ButtonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="9" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="9" cy="15" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="15" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

interface AppLogoProps {
  className?: string;
}

export function AppLogo({ className }: AppLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <ButtonIcon className="size-[1.1em] text-amber-500 dark:text-amber-400 shrink-0" />
      <span>
        <span className="font-medium bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
          Tiny
        </span>{" "}
        <span className="font-extrabold bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent dark:drop-shadow-[0_0_8px_oklch(0.7_0.2_300/0.4)]">
          Gam
        </span>
      </span>
    </span>
  );
}
