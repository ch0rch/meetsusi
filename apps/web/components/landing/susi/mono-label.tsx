import { cn } from "@/lib/utils";

type MonoLabelProps = {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
};

export function MonoLabel({
  children,
  className,
  dark = false,
}: MonoLabelProps) {
  return (
    <p
      className={cn(
        "susi-mono-label",
        dark ? "text-white/50" : "text-black/40",
        className,
      )}
    >
      {children}
    </p>
  );
}
