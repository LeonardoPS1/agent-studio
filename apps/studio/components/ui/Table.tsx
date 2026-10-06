"use client";

import * as React from "react";

/**
 * Table component with accessible tabpanel integration.
 * 
 * Usage:
 *  <Table>
 *    <Table.Header>
 *      <Table.Row>
 *        <Table.Head>Nombre</Table.Head>
 *        <Table.Head>Estado</Table.Head>
 *        <Table.Head>Herramienta</Table.Head>
 *      </Table.Row>
 *    </Table.Header>
 *    <Table.Body>
 *      <Table.Row>
 *        <Table.Cell>Agente X</Table.Cell>
 *        <Table.Cell><span className="pill ok">Thinking</span></Table.Cell>
 *        <Table.Cell>Herramienta Y</Table.Cell>
 *      </Table.Row>
 *    </Table.Body>
 *  </Table>
 * 
 * When used with the tablist pattern, wrap in <Table.Tabpanel> to provide
 * proper aria-controls and role="tabpanel" association with the triggering tab.
 */

export interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export interface TableRowProps {
  children: React.ReactNode;
  className?: string;
}

export interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  scope?: "row" | "col";
}

export interface TableTabpanelProps {
  children: React.ReactNode;
  id: string;
  className?: string;
}

/** Wrapper component used as `<Table>` in JSX. */
export const Table = (props: { children: React.ReactNode; className?: string }) => {
  const { children, className } = props;
  return <tbody className={className || "bg-panel"}>{children}</tbody>;
};

/** Cabecera de tabla */
export const TableHeader = ({
  children,
  className,
}: TableHeaderProps) => {
  return (
    <thead className={className || "border-b border-line bg-panel"}>
      {children}
    </thead>
  );
};

/** Fila de tabla */
export const TableRow = ({
  children,
  className,
}: TableRowProps) => {
  return (
    <tr className={className || "border-b border-line transition-colors hover:bg-accent/5"}>
      {children}
    </tr>
  );
};

/** Celda de tabla */
export const TableCell = ({
  children,
  className,
  scope,
}: TableCellProps) => {
  const classes = className || "p-4 text-sm";
  return (
    <td className={classes} scope={scope}>
      {children}
    </td>
  );
};

/** Tabpanel asociado a un tab de la tablist */
export const TableTabpanel = ({
  children,
  id,
  className,
}: TableTabpanelProps) => {
  return (
    <td colSpan={100} aria-labelledby={id} className={className || "p-4 text-sm"}>
      <div id={id} className="space-y-1" role="tabpanel">
        {children}
      </div>
    </td>
  );
};