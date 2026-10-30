import { LoaderCircle, Sparkles } from "lucide-react";

interface LoadingScreenProps {
  title?: string;
  description?: string;
  compact?: boolean;
  overlay?: boolean;
}

/**
 * Shared loading feedback for route transitions and module data requests.
 * Keeps the interface visibly alive while work is in progress.
 */
export function LoadingScreen({
  title = "Cargando ToolHub",
  description = "Preparando tu espacio de trabajo...",
  compact = false,
  overlay = false,
}: LoadingScreenProps) {
  return (
    <div
      className={[
        "flex flex-col items-center justify-center text-center",
        overlay
          ? "fixed inset-0 z-[9999] bg-background/95 backdrop-blur-sm"
          : compact
            ? "min-h-[220px] w-full"
            : "min-h-[calc(100dvh-5rem)] w-full px-6 py-12",
      ].join(" ")}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm">
        <Sparkles size={22} strokeWidth={1.8} />
        <LoaderCircle
          size={58}
          strokeWidth={1.5}
          className="absolute inset-[-3px] animate-spin text-primary/65"
          aria-hidden="true"
        />
      </div>
      <p className="text-sm font-bold tracking-tight text-foreground">{title}</p>
      <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
      <span className="sr-only">La operación sigue en curso.</span>
    </div>
  );
}
