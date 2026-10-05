import { HTMLAttributes, forwardRef, DetailedHTMLProps } from "react";

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className = "", size = "lg", children, ...props }, ref) => {
    const sizes = {
      sm: "max-w-3xl",
      md: "max-w-5xl",
      lg: "max-w-7xl",
      xl: "max-w-[90rem]",
      full: "max-w-full",
    };

    return (
      <div
        ref={ref}
        className={`mx-auto px-4 sm:px-6 lg:px-8 w-full ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = "Container";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  variant?: "default" | "muted" | "accent";
  size?: "sm" | "md" | "lg" | "xl";
  title?: string;
  subtitle?: string;
}

export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ className = "", variant = "default", size = "lg", title, subtitle, children, ...props }, ref) => {
    const variants = {
      default: "bg-bg",
      muted: "bg-panel",
      accent: "bg-accent text-white",
    };
    
    const sizes = {
      sm: "py-12 sm:py-16",
      md: "py-16 sm:py-20 lg:py-24",
      lg: "py-20 sm:py-24 lg:py-28",
      xl: "py-24 sm:py-28 lg:py-32",
    };

    return (
      <section
        ref={ref}
        className={`${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        <Container>
          {(title || subtitle) && (
            <header className="mb-8">
              {title && <h2 className="text-2xl font-bold text-ink mb-2">{title}</h2>}
              {subtitle && <p className="text-muted">{subtitle}</p>}
            </header>
          )}
          {children}
        </Container>
      </section>
    );
  }
);

Section.displayName = "Section";