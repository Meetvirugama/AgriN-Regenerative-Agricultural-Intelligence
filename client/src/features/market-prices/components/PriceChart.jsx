import { useState, useMemo, useCallback } from "react";
import "./PriceChart.css";

/**
 * PriceChart — SVG line/area chart for market price trends.
 *
 * Renders a responsive, pure-SVG chart with:
 * - Smooth area fill with gradient
 * - Hover tooltip showing exact price and date
 * - Time range selector (7D, 30D, 3M, 6M, 1Y)
 *
 * @param {Array} data - Array of { date: string, modalPrice: number }
 * @param {Function} onRangeChange - Called with days when a range button is clicked
 * @param {number} activeDays - Currently active range in days
 */
export function PriceChart({ data = [], onRangeChange, activeDays = 30 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const ranges = [
    { label: "7D", days: 7 },
    { label: "30D", days: 30 },
    { label: "3M", days: 90 },
    { label: "6M", days: 180 },
    { label: "1Y", days: 365 },
  ];

  const chartWidth = 600;
  const chartHeight = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const { path, areaPath, points, yTicks, xLabels, minPrice, maxPrice } = useMemo(() => {
    if (!data || data.length === 0) {
      return { path: "", areaPath: "", points: [], yTicks: [], xLabels: [], minPrice: 0, maxPrice: 0 };
    }

    const prices = data.map((d) => d.modalPrice);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const paddedMin = min - range * 0.1;
    const paddedMax = max + range * 0.1;
    const paddedRange = paddedMax - paddedMin;

    const pts = data.map((d, i) => {
      const x = padding.left + (i / Math.max(data.length - 1, 1)) * innerWidth;
      const y = padding.top + innerHeight - ((d.modalPrice - paddedMin) / paddedRange) * innerHeight;
      return { x, y, ...d };
    });

    // Build SVG path
    let linePath = "";
    let area = "";
    if (pts.length > 0) {
      linePath = `M ${pts[0].x},${pts[0].y}`;
      area = `M ${pts[0].x},${padding.top + innerHeight} L ${pts[0].x},${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        linePath += ` L ${pts[i].x},${pts[i].y}`;
        area += ` L ${pts[i].x},${pts[i].y}`;
      }
      area += ` L ${pts[pts.length - 1].x},${padding.top + innerHeight} Z`;
    }

    // Y-axis tick marks (5 ticks)
    const tickCount = 5;
    const ticks = [];
    for (let i = 0; i <= tickCount; i++) {
      const val = paddedMin + (paddedRange / tickCount) * i;
      const y = padding.top + innerHeight - (i / tickCount) * innerHeight;
      ticks.push({ value: Math.round(val), y });
    }

    // X-axis labels (show ~5 dates evenly spaced)
    const labelCount = Math.min(5, data.length);
    const labels = [];
    for (let i = 0; i < labelCount; i++) {
      const idx = labelCount <= 1 ? 0 : Math.round((i / (labelCount - 1)) * (data.length - 1));
      const d = data[idx];
      const x = padding.left + (idx / Math.max(data.length - 1, 1)) * innerWidth;
      const dateObj = new Date(d.date);
      const label = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
      labels.push({ label, x });
    }

    return {
      path: linePath,
      areaPath: area,
      points: pts,
      yTicks: ticks,
      xLabels: labels,
      minPrice: min,
      maxPrice: max,
    };
  }, [data, innerWidth, innerHeight, padding.left, padding.top]);

  const handleMouseMove = useCallback(
    (e) => {
      if (points.length === 0) return;
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * chartWidth;

      let closest = 0;
      let closestDist = Infinity;
      points.forEach((p, i) => {
        const dist = Math.abs(p.x - mouseX);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      });
      setHoveredIndex(closest);
    },
    [points, chartWidth]
  );

  const formatPrice = (price) => {
    if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`;
    if (price >= 1000) return `₹${price.toLocaleString("en-IN")}`;
    return `₹${price}`;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  if (!data || data.length === 0) {
    return (
      <div className="price-chart-container">
        <div className="price-chart-header">
          <h3 className="price-chart-title">Price Trend</h3>
          <div className="price-chart-ranges">
            {ranges.map((r) => (
              <button
                key={r.days}
                className={`price-chart-range-btn ${activeDays === r.days ? "active" : ""}`}
                onClick={() => onRangeChange?.(r.days)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div className="price-chart-empty">
          <p>No price history available for this period</p>
        </div>
      </div>
    );
  }

  return (
    <div className="price-chart-container">
      <div className="price-chart-header">
        <h3 className="price-chart-title">Price Trend</h3>
        <div className="price-chart-ranges">
          {ranges.map((r) => (
            <button
              key={r.days}
              className={`price-chart-range-btn ${activeDays === r.days ? "active" : ""}`}
              onClick={() => onRangeChange?.(r.days)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="price-chart-svg-wrapper">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="price-chart-svg"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-color, #22c55e)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--chart-color, #22c55e)" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={padding.left}
                y1={tick.y}
                x2={chartWidth - padding.right}
                y2={tick.y}
                className="price-chart-grid-line"
              />
              <text
                x={padding.left - 8}
                y={tick.y + 4}
                className="price-chart-axis-label"
                textAnchor="end"
              >
                {formatPrice(tick.value)}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {xLabels.map((lbl, i) => (
            <text
              key={i}
              x={lbl.x}
              y={chartHeight - 5}
              className="price-chart-axis-label"
              textAnchor="middle"
            >
              {lbl.label}
            </text>
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#areaGradient)" />

          {/* Line */}
          <path d={path} className="price-chart-line" />

          {/* Hover indicator */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <>
              <line
                x1={points[hoveredIndex].x}
                y1={padding.top}
                x2={points[hoveredIndex].x}
                y2={padding.top + innerHeight}
                className="price-chart-hover-line"
              />
              <circle
                cx={points[hoveredIndex].x}
                cy={points[hoveredIndex].y}
                r={5}
                className="price-chart-hover-dot"
              />
            </>
          )}
        </svg>

        {/* Tooltip */}
        {hoveredIndex !== null && points[hoveredIndex] && (
          <div
            className="price-chart-tooltip"
            style={{
              left: `${(points[hoveredIndex].x / chartWidth) * 100}%`,
              top: `${(points[hoveredIndex].y / chartHeight) * 100 - 15}%`,
            }}
          >
            <div className="price-chart-tooltip-price">
              {formatPrice(points[hoveredIndex].modalPrice)}
            </div>
            <div className="price-chart-tooltip-date">
              {formatDate(points[hoveredIndex].date)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
