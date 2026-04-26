"use client";

interface Props {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  fillOpacity?: number;
  strokeWidth?: number;
  /** Min value for Y scale (auto if undefined) */
  minY?: number;
  /** Max value for Y scale (auto if undefined) */
  maxY?: number;
}

/**
 * Sparkline SVG minimo — puro, sin deps externas.
 * Dibuja una linea smooth con area rellenada bajo la curva.
 * Si todos los valores son 0, dibuja linea plana centrada.
 */
export default function MiniSparkline({
  values,
  width = 120,
  height = 32,
  color = "#E8B730",
  fillOpacity = 0.15,
  strokeWidth = 1.5,
  minY,
  maxY,
}: Props) {
  if (!values.length) {
    return <svg width={width} height={height} aria-hidden />;
  }

  const lo = minY !== undefined ? minY : Math.min(...values, 0);
  const hi = maxY !== undefined ? maxY : Math.max(...values, lo + 1);
  const range = hi - lo || 1;
  const step = values.length > 1 ? width / (values.length - 1) : width;

  const pad = 2;
  const innerH = height - pad * 2;

  const points = values.map((v, i) => {
    const x = i * step;
    const normalized = (v - lo) / range;
    const y = pad + innerH - normalized * innerH;
    return { x, y };
  });

  // Linea smooth con bezier curves (curva catmull-rom → cubic bezier)
  let pathLine = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    pathLine += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(
      2
    )} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  const pathArea = `${pathLine} L ${points[points.length - 1].x} ${height} L ${
    points[0].x
  } ${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <path d={pathArea} fill={color} fillOpacity={fillOpacity} />
      <path
        d={pathLine}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Ultimo punto destacado */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2.5}
        fill={color}
      />
    </svg>
  );
}
