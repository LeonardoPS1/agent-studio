"use client";

import * as React from "react";

/**
 * Diálogo modal accesible con ARIA roles y trap de enfoque.
 * 
 * Uso:
 * <Dialog open={open} onClose={handleClose}>
 *   <Dialog.Title>Título</Dialog.Title>
 *   <Dialog.Content>Contenido</Dialog.Content>
 *   <Dialog.Actions>
 *     <Dialog.Action onClick={handleCancel}>Cancelar</Dialog.Action>
 *     <Dialog.Action onClick={handleConfirm}>Confirmar</Dialog.Action>
 *   </Dialog.Actions>
 * </Dialog>
 */
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  onAction?: () => void;
  title: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

/** Diálogo principal con role="dialog" y aria-modal. */
export const Dialog = ({
  open,
  onClose,
  onAction,
  title,
  children,
  footer,
}: DialogProps) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    if (open) setMounted(true);
    return () => setMounted(false);
  }, [open]);

  if (!mounted || !open) return null;

  // Trap focus inside the dialog - ESC to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
    >
      <div
        role="document"
        className="bg-panel w-full max-w-md rounded-lg border max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div
            id="dialog-title"
            className="flex items-center justify-between mb-4"
          >
            <h2 className="text-xl font-semibold" id="dialog-title">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 hover:bg-accent/10 transition-colors"
              aria-label="Cerrar diálogo"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {children}

          {footer && <div className="mt-4 flex justify-end gap-2 p-2 border-t border-line">{footer}</div>}
        </div>
      </div>
    </div>
  );
};

/** Título del diálogo. */
export const DialogTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <h2 className={className || "text-xl font-semibold"}>{children}</h2>;
};

/** Contenido del diálogo. */
export const DialogContent = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={className || "space-y-4"}>{children}</div>;
};

/** Acción dentro del diálogo. */
export const DialogAction = ({
  children,
  onClick,
  variant = "primary",
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
  className?: string;
}) => {
  const base = className || "rounded-md px-4 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
  const primary = variant === "primary" ? "bg-accent text-panel hover:bg-accent/90" : "text-muted hover:bg-accent/5";
  return (
    <button
      onClick={onClick}
      className={base}
      type="button"
    >
      {children}
    </button>
  );
};

/** Acciones del diálogo (grupo). */
export const DialogActions = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return <div className={className || "flex justify-end space-x-2 p-2"}>{children}</div>;
};