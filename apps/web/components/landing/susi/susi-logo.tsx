import { cn } from "@/lib/utils";

type SusiLogoProps = {
  className?: string;
  dark?: boolean;
  size?: "sm" | "md" | "lg";
};

export function SusiLogo({
  className,
  dark = false,
  size = "md",
}: SusiLogoProps) {
  const sizeClasses = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <span
      className={cn(
        "font-mono font-bold tracking-tight select-none",
        sizeClasses[size],
        dark ? "text-white" : "text-black dark:text-white",
        className,
      )}
    >
      susi
    </span>
  );
}
