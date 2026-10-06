"use client";

import * as React from "react";

/**
 * Chart types for the UI Kit.
 * 
 * All charts are SVG-based and use the design system's color palette.
 */

export type ChartType = "line" | "bar" | "donut" | "gauge" | "sparkline";

export type ChartDataPoint = {
  x: string | number;
  y: number;
};

export interface ChartProps {
  type: ChartType;
  data?: ChartDataPoint[];
  width?: number;
  height?: number;
  className?: string;
}

/** Gráfico de línea. */
export const LineChart = ({
  data,
  width = 300,
  height = 150,
  className,
}: Omit<ChartProps, "type"> & { data: ChartDataPoint[] }) => {
  if (!data || data.length === 0) return null;

  const minY = Math.min(...data.map((d) => d.y));
  const maxY = Math.max(...data.map((d) => d.y));
  const rangeY = maxY - minY || 1;
  const padding = 20;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  const xScale = (i: number) => (padding + (i / (data.length - 1)) * plotWidth) || padding;
  const yScale = (y: number) => height - padding - ((y - minY) / rangeY) * plotHeight;

  const generatePath = (dataPoints: ChartDataPoint[]) =>
    "M" +
    dataPoints
      .map((point, i) => `${xScale(i)} ${yScale(point.y)}`)
      .join("L");

  return (
    <svg width={width} height={height} className={className} aria-label="Line chart" role="img">
      <path d={generatePath(data)} stroke="currentColor" strokeWidth={2} fill="none" />
      {/* X axis line */}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeWidth={1} />
      {/* Y axis line */}
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" strokeWidth={1} />
    </svg>
  );
};

/** Gráfico de barras. */
export const BarChart = ({
  data,
  width = 300,
  height = 150,
  className,
}: Omit<ChartProps, "type"> & { data: ChartDataPoint[] }) => {
  if (!data || data.length === 0) return null;

  const maxY = Math.max(...data.map((d) => d.y));
  const barWidth = (width - 40) / data.length;
  const padding = 20;

  return (
    <svg width={width} height={height} className={className} aria-label="Bar chart" role="img">
{data.map((point, i) => {
        const barHeight = (point.y / maxY) * (height - 40) || 1;
        const x = padding + i * barWidth + barWidth / 2;
        const y = height - padding - barHeight;
        return (
          <rect
            key={i}
            x={x - barWidth / 2}
            y={y}
            width={barWidth * 0.8}
            height={barHeight}
            rx="4"
            ry="4"
            fill="currentColor"
          />
        );
      })}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeWidth={1} />
    </svg>
  );
};

/** Gráfico de dona. */
export const DonutChart = ({
  data,
  width = 150,
  height = 150,
  className,
}: Omit<ChartProps, "type"> & { data: ChartDataPoint[] }) => {
  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + d.y, 0);
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 10;

  return (
    <svg width={width} height={height} className={className} aria-label="Donut chart" role="img">
      {data.map((point, i) => {
        const percent = point.y / total;
        const startAngle = (Math.PI * 2 * data.slice(0, i).reduce((sum, d) => sum + d.y, 0)) / total;
        const endAngle = startAngle + (Math.PI * 2 * percent) / total;
        const largeArc = percent > 0.5 ? 1 : 0;

        return (
          <path
            key={i}
            d={`M${cx} ${cy} L${cx + radius * Math.cos(startAngle)} ${cy + radius * Math.sin(startAngle)} A${radius} ${radius} 0 ${largeArc} 1 ${cx + radius * Math.cos(endAngle)} ${cy + radius * Math.sin(endAngle)} Z`}
            fill={`hsl(${i * (360 / data.length)}, 70%, 60%)`}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={radius - 4} fill="none" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
};

/** Gráfico de gauge (semi-circular). */
export const GaugeChart = ({
  value,
  max = 100,
  width = 150,
  height = 150,
  className,
}: {
  value: number;
  max?: number;
  width?: number;
  height?: number;
  className?: string;
}) => {
  const angle = (value / max) * Math.PI;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) / 2 - 10;

  return (
    <svg width={width} height={height} className={className} aria-label="Gauge chart" role="img">
      {/* Background semi-circle */}
      <path
        d={`M${cx} ${cy - radius} A${radius} ${radius} 0 1 1 ${cx + radius * Math.PI} ${cy + radius * 0} Z`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        opacity="0.2"
      />
      {/* Foreground semi-circle */}
      <path
        d={`M${cx} ${cy - radius} A${radius} ${radius} 0 ${angle > Math.PI ? 1 : 0} 1 ${cx + radius * Math.sin(angle)} ${cy + radius * Math.cos(angle)} Z`}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      />
      {/* Value label */}
      <text
        x={cx}
        y={cy + radius / 2}
        textAnchor="middle"
        fontSize="14"
        fill="currentColor"
      >
        {Math.round((value / max) * 100)}%
      </text>
    </svg>
  );
};

/** Gráfico sparkline pequeño. */
export const Sparkline = ({
  data,
  width = 120,
  height = 40,
  className,
}: Omit<ChartProps, "type"> & { data: ChartDataPoint[] }) => {
  if (!data || data.length === 0) return null;

  const minY = Math.min(...data.map((d) => d.y));
  const maxY = Math.max(...data.map((d) => d.y));
  const rangeY = maxY - minY || 1;
  const padding = 4;

  const xScale = (i: number) => padding + (i / (data.length - 1)) * (width - padding * 2);
  const yScale = (y: number) => height - padding - ((y - minY) / rangeY) * (height - padding * 2);

  const path = "M" + data.map((_, i) => `${xScale(i)} ${yScale(data[i].y)}`).join("L");

  return (
    <svg width={width} height={height} className={className} aria-label="Sparkline chart" role="img">
      <path d={path} stroke="currentColor" strokeWidth={2} fill="none" />
    </svg>
  );
};

/** Componente Chart que renderiza según el tipo. */
export const Chart = ({
  type,
  data,
  width,
  height,
  className,
}: ChartProps) => {
  switch (type) {
    case "line":
      return <LineChart data={data as ChartDataPoint[]} width={width} height={height} className={className} />;
    case "bar":
      return <BarChart data={data as ChartDataPoint[]} width={width} height={height} className={className} />;
    case "donut":
      return <DonutChart data={data as ChartDataPoint[]} width={width} height={height} className={className} />;
    case "gauge":
      return <GaugeChart value={data?.[0]?.y ?? 0} max={data?.[0]?.y ?? 100} width={width} height={height} className={className} />;
    case "sparkline":
      return <Sparkline data={data as ChartDataPoint[]} width={width} height={height} className={className} />;
  }
  return null;
};