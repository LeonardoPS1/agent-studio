"use client";

import * as React from "react";

/**
 * Empty state component for showing when there's no data.
 * 
 * Uso:
 * <EmptyState icon={svg} title="Sin datos" description="No hay actividad aún" />
 */
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  buttonLabel?: string;
  onButtonClick?: () => void;
  className?: string;
}

/** Estado vacío con icono, título y descripción. */
export const EmptyState = ({
  icon,
  title,
  description,
  buttonLabel,
  onButtonClick,
  className,
}: EmptyStateProps) => {
  return (
    <div className={className || "text-center py-16"}>
      {icon}
      <h2 className="text-2xl font-semibold text-ink mb-2">{title}</h2>
      <p className="text-muted mb-6">{description}</p>
      {buttonLabel && onButtonClick && (
        <button onClick={onButtonClick} className="rounded-md px-4 py-2 bg-accent text-white hover:bg-accent/90">
          {buttonLabel}
        </button>
      )}
    </div>
  );
};

/** Estado de error con mensaje y acción de reintento. */
export interface ErrorStateProps {
  error: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

/** Estado de error con botón de reintento. */
export const ErrorState = ({
  error,
  retryLabel = "Reintentar",
  onRetry,
  className,
}: ErrorStateProps) => {
  return (
    <div className={className || "bg-panel border border-line rounded-lg p-8 text-center"}>
      <p className="text-accent text-lg mb-4">⚠️</p>
      <h3 className="text-xl font-semibold text-ink mb-2">{error}</h3>
      {onRetry && (
        <button onClick={onRetry} className="rounded-md px-4 py-2 bg-accent text-white hover:bg-accent/90">
          {retryLabel}
        </button>
      )}
      {onRetry && <p className="text-muted text-sm mt-4">Ocurre un error temporal. Intenta nuevamente.</p>}
    </div>
  );
};

/** Estado de carga skeleton. */
export interface LoadingStateProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

/** Estado de carga con skeleton. */
export const LoadingState = ({
  size = "md",
  className,
}: LoadingStateProps) => {
  const sizeClasses = {
    sm: "h-6 w-6 bg-panel rounded-full animate-pulse",
    md: "h-8 w-8 bg-panel rounded-full animate-pulse",
    lg: "h-10 w-10 bg-panel rounded-full animate-pulse",
  };

  const sizeClass = sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md;

  return (
    <div className={className || "flex items-center justify-center"}>
      <div className={sizeClass} />
    </div>
  );
};