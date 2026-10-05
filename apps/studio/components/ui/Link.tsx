import { AnchorHTMLAttributes, forwardRef } from "react";

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "default" | "muted" | "accent";
  underline?: "always" | "hover" | "never";
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className = "", variant = "default", underline = "hover", children, ...props }, ref) => {
    const variants = {
      default: "text-ink hover:text-accent",
      muted: "text-muted hover:text-ink",
      accent: "text-accent hover:text-accent/80",
    };
    
    const underlines = {
      always: "underline underline-offset-2",
      hover: "no-underline hover:underline hover:underline-offset-2 transition-colors duration-200",
      never: "no-underline",
    };

    return (
      <a
        ref={ref}
        className={`${variants[variant]} ${underlines[underline]} font-medium transition-colors duration-200 ${className}`}
        {...props}
      >
        {children}
      </a>
    );
  }
);

Link.displayName = "Link";