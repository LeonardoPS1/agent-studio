interface SkeletonProps {
  className?: string;
  /** Ancho del skeleton (por defecto: full) */
  w?: "full" | "20" | "30" | "40" | "50" | "60" | "70" | "80" | "90" | "100";
  /** Altura del skeleton (por defecto: 1em) */
  h?: number | string;
  radius?: "none" | "sm" | "md" | "lg" | "full";
  animate?: boolean;
}

const sizes: Record<string, string> = {
  full: "w-full",
  "20": "w-20",
  "30": "w-30",
  "40": "w-40",
  "50": "w-50",
  "60": "w-60",
  "70": "w-70",
  "80": "w-80",
  "90": "w-90",
  "100": "w-100",
};

export function Skeleton({ className, w = "full", h = "1em", radius = "md", animate = true }: SkeletonProps) {
  const sizeClass = sizes[w] ?? "w-full";
  const radiusClass = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  }[radius] ?? "rounded-md";

  // mergeTailwindClasses: similar a classnames pero sin dependencia externa
  const merge = (...classes: (string | undefined | boolean | null)[]) =>
    classes.filter(Boolean).join(" ");

  const finalClassName = merge(
    "bg-line animate-pulse",
    sizeClass,
    `h-[${typeof h === "number" ? h : Number(h) || 1}em]`,
    radiusClass,
    animate ? "" : "animate-none",
    className,
  );

  return (
    <div
      className={finalClassName}
      role="status"
      aria-label="Cargando"
    />
  );
}