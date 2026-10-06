"use client";

import * as React from "react";

/**
 * Tooltip component that shows a message on hover.
 * 
 * Uso:
 * <Tooltip content="Mensaje de ayuda">Botón</Tooltip>
 * O con elemento objetivo:
 * <Tooltip content="Herramienta activa" target={botón}>
 */
export interface TooltipProps {
  content: string;
  target?: React.RefObject<HTMLElement>;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/** Tooltip con contenedor flotante y retardo. */
export const Tooltip = ({
  content,
  target,
  children,
  delay = 100,
  className,
}: TooltipProps) => {
  const [show, setShow] = React.useState(false);

  const showTimeout = () => {
    setShow(false);
    setShow(true);
  };

  const hideTimeout = () => {
    setShow(false);
  };

  return (
    <div
      className={className || "relative inline-block"}
      onMouseEnter={showTimeout}
      onMouseLeave={hideTimeout}
    >
      {children}
      {show && (
        <div
          role="tooltip"
          className={className || "absolute left-1/2 -translate-x-1/2 bg-panel text-sm text-ink rounded-md px-3 py-1.5 shadow-md border border-line z-10 whitespace-normal min-w-max max-w-xs"}
        >
          {content}
        </div>
      )}
    </div>
  );
};

/** Tooltip simplificado sin delay - muestra al instante. */
export const ImmediateTooltip = ({
  content,
  target,
  children,
  className,
}: Omit<TooltipProps, "delay"> & { target?: never }) => {
  const [show, setShow] = React.useState(false);

  const handleMouseEnter = () => setShow(true);
  const handleMouseLeave = () => setShow(false);

  return (
    <div
      className={className || "relative inline-block"}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {show && (
        <div
          role="tooltip"
          className={className || "absolute left-1/2 -translate-x-1/2 bg-panel text-sm text-ink rounded-md px-3 py-1.5 shadow-md border border-line z-10 whitespace-normal min-w-max max-w-xs"}
        >
          {content}
        </div>
      )}
    </div>
  );
};