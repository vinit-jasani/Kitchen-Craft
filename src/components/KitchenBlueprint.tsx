import React, { useState, useEffect, useRef, useMemo } from "react";
import { Flame, Droplets, HelpCircle, Sparkles, RefreshCw, Move, Ruler, CheckCircle2 } from "lucide-react";

interface KitchenBlueprintProps {
  layoutType: string;
  length: number; // in feet
  width: number;  // in feet
  onChangeStats?: (stats: { workTriangleSum: number; score: string; leg1: number; leg2: number; leg3: number }) => void;
  appliancesState?: { id: "sink" | "hob" | "fridge"; segmentIndex: number; t: number }[];
  onChangeAppliances?: (appliances: { id: "sink" | "hob" | "fridge"; segmentIndex: number; t: number }[]) => void;
  readOnly?: boolean;
}

interface Appliance {
  id: "sink" | "hob" | "fridge";
  name: string;
  segmentIndex: number;
  t: number; // value from 0 to 1 along the segment centerline
  color: string;
  label: string;
}

export default function KitchenBlueprint({ layoutType, length, width, onChangeStats, appliancesState, onChangeAppliances, readOnly = false }: KitchenBlueprintProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Layout-specific segments in feet.
  // We offset segments from the walls by 1.0 ft (middle of 2-ft deep counter).
  // We also constrain segment ends by 1.2 ft buffer so appliances don't clip off corners.
  const segments = useMemo(() => {
    const lVal = length || 10;
    const wVal = width || 8;

    switch (layoutType) {
      case "Straight Kitchen":
        // Single counter along the bottom wall.
        return [
          {
            ax: 1.2,
            ay: wVal - 1.0,
            bx: lVal - 1.2,
            by: wVal - 1.0,
            name: "Bottom Counter"
          }
        ];
      case "L Shape Kitchen":
        // Counter 1: Top wall (from left to right)
        // Counter 2: Left wall (from top to bottom)
        return [
          {
            ax: 1.2,
            ay: 1.0,
            bx: lVal - 1.2,
            by: 1.0,
            name: "Top Counter"
          },
          {
            ax: 1.0,
            ay: 1.2,
            bx: 1.0,
            by: wVal - 1.2,
            name: "Left Counter"
          }
        ];
      case "U Shape Kitchen":
        // Counter 1: Left wall (top to bottom)
        // Counter 2: Top wall (left to right)
        // Counter 3: Right wall (top to bottom)
        return [
          {
            ax: 1.0,
            ay: 1.2,
            bx: 1.0,
            by: wVal - 1.2,
            name: "Left Counter"
          },
          {
            ax: 1.2,
            ay: 1.0,
            bx: lVal - 1.2,
            by: 1.0,
            name: "Back Counter"
          },
          {
            ax: lVal - 1.0,
            ay: 1.2,
            bx: lVal - 1.0,
            by: wVal - 1.2,
            name: "Right Counter"
          }
        ];
      case "Parallel Kitchen":
        // Counter 1: Top wall (left to right)
        // Counter 2: Bottom wall (left to right)
        return [
          {
            ax: 1.2,
            ay: 1.0,
            bx: lVal - 1.2,
            by: 1.0,
            name: "Top Counter"
          },
          {
            ax: 1.2,
            ay: wVal - 1.0,
            bx: lVal - 1.2,
            by: wVal - 1.0,
            name: "Bottom Counter"
          }
        ];
      default:
        return [];
    }
  }, [layoutType, length, width]);

  // Track coordinates and active segments of appliances
  const [appliances, setAppliances] = useState<Appliance[]>([
    { id: "sink", name: "Sink", segmentIndex: 0, t: 0.3, color: "#34C759", label: "Sink (Wash Area)" },
    { id: "hob", name: "Hob", segmentIndex: 0, t: 0.5, color: "#FF9500", label: "Cooktop (Hot Area)" },
    { id: "fridge", name: "Fridge", segmentIndex: 0, t: 0.7, color: "#0071E3", label: "Refrigerator (Cold Area)" }
  ]);

  const [activeDragId, setActiveDragId] = useState<"sink" | "hob" | "fridge" | null>(null);

  // Synchronize appliances with appliancesState prop when not dragging
  useEffect(() => {
    if (appliancesState && appliancesState.length > 0 && !activeDragId) {
      setAppliances((prev) =>
        prev.map((app) => {
          const match = appliancesState.find((a) => a.id === app.id);
          if (match) {
            return { ...app, segmentIndex: match.segmentIndex, t: match.t };
          }
          return app;
        })
      );
    }
  }, [appliancesState, activeDragId]);

  // Whenever segments change, ensure all appliances have valid segment indices
  useEffect(() => {
    setAppliances((prev) => {
      return prev.map((app, idx) => {
        let segIdx = app.segmentIndex;
        // Adjust indices if segments count changed
        if (segIdx >= segments.length) {
          segIdx = idx % segments.length;
        }

        // Spread out nicely depending on shape
        let customT = app.t;
        if (layoutType === "L Shape Kitchen") {
          if (app.id === "fridge") { segIdx = 0; customT = 0.2; }
          else if (app.id === "hob") { segIdx = 0; customT = 0.7; }
          else { segIdx = 1; customT = 0.5; }
        } else if (layoutType === "U Shape Kitchen") {
          if (app.id === "fridge") { segIdx = 0; customT = 0.5; }
          else if (app.id === "sink") { segIdx = 1; customT = 0.5; }
          else { segIdx = 2; customT = 0.5; }
        } else if (layoutType === "Parallel Kitchen") {
          if (app.id === "fridge") { segIdx = 0; customT = 0.2; }
          else if (app.id === "sink") { segIdx = 0; customT = 0.7; }
          else { segIdx = 1; customT = 0.5; }
        } else {
          // Straight kitchen spread
          if (app.id === "fridge") { segIdx = 0; customT = 0.15; }
          else if (app.id === "sink") { segIdx = 0; customT = 0.5; }
          else { segIdx = 0; customT = 0.85; }
        }

        return { ...app, segmentIndex: segIdx, t: customT };
      });
    });
  }, [segments, layoutType]);

  // Compute actual coordinates of appliances (in feet)
  const appliancePositions = useMemo(() => {
    return appliances.map((app) => {
      const seg = segments[app.segmentIndex] || segments[0];
      if (!seg) return { ...app, x: 0, y: 0 };
      const x = seg.ax + app.t * (seg.bx - seg.ax);
      const y = seg.ay + app.t * (seg.by - seg.ay);
      return { ...app, x, y };
    });
  }, [appliances, segments]);

  // Work Triangle distances
  const triangleStats = useMemo(() => {
    const sinkPos = appliancePositions.find((a) => a.id === "sink") || { x: 0, y: 0 };
    const hobPos = appliancePositions.find((a) => a.id === "hob") || { x: 0, y: 0 };
    const fridgePos = appliancePositions.find((a) => a.id === "fridge") || { x: 0, y: 0 };

    const leg1 = Math.sqrt(Math.pow(sinkPos.x - hobPos.x, 2) + Math.pow(sinkPos.y - hobPos.y, 2));
    const leg2 = Math.sqrt(Math.pow(hobPos.x - fridgePos.x, 2) + Math.pow(hobPos.y - fridgePos.y, 2));
    const leg3 = Math.sqrt(Math.pow(fridgePos.x - sinkPos.x, 2) + Math.pow(fridgePos.y - sinkPos.y, 2));
    const sum = leg1 + leg2 + leg3;

    let score = "Optimal spacing";
    let statusText = "Ergonomic Layout";
    let adviceText = "Your cooking triangle is highly efficient! Perfect spacing.";
    let ratingColor = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-500/5";

    if (sum < 12) {
      score = "Too tight";
      statusText = "Compact Spacing";
      adviceText = "Workspace is slightly congested. Great for fast access, but might feel tight for multi-person use.";
      ratingColor = "text-amber-500 bg-amber-500/10 border-amber-500/20 dark:bg-amber-500/5";
    } else if (sum > 26 || leg1 > 9 || leg2 > 9 || leg3 > 9) {
      score = "Too wide";
      statusText = "Spacious / High Fatigue";
      adviceText = "Distances are large. You may experience extra footsteps during meal prep. Drag the appliances closer together.";
      ratingColor = "text-rose-500 bg-rose-500/10 border-rose-500/20 dark:bg-rose-500/5";
    }

    return {
      leg1, // Sink -> Hob
      leg2, // Hob -> Fridge
      leg3, // Fridge -> Sink
      sum,
      score,
      statusText,
      adviceText,
      ratingColor,
      sinkPos,
      hobPos,
      fridgePos
    };
  }, [appliancePositions]);

  // Sync state to parent component if hook is provided
  useEffect(() => {
    if (onChangeStats) {
      onChangeStats({
        workTriangleSum: triangleStats.sum,
        score: triangleStats.statusText,
        leg1: triangleStats.leg1,
        leg2: triangleStats.leg2,
        leg3: triangleStats.leg3
      });
    }
  }, [triangleStats, onChangeStats]);

  // Reset positions helper
  const handleReset = () => {
    setAppliances((prev) => {
      return prev.map((app, idx) => {
        let segIdx = idx % segments.length;
        let defaultT = 0.5;

        if (layoutType === "L Shape Kitchen") {
          if (app.id === "fridge") { segIdx = 0; defaultT = 0.2; }
          else if (app.id === "hob") { segIdx = 0; defaultT = 0.7; }
          else { segIdx = 1; defaultT = 0.5; }
        } else if (layoutType === "U Shape Kitchen") {
          if (app.id === "fridge") { segIdx = 0; defaultT = 0.5; }
          else if (app.id === "sink") { segIdx = 1; defaultT = 0.5; }
          else { segIdx = 2; defaultT = 0.5; }
        } else if (layoutType === "Parallel Kitchen") {
          if (app.id === "fridge") { segIdx = 0; defaultT = 0.2; }
          else if (app.id === "sink") { segIdx = 0; defaultT = 0.7; }
          else { segIdx = 1; defaultT = 0.5; }
        } else {
          if (app.id === "fridge") { segIdx = 0; defaultT = 0.15; }
          else if (app.id === "sink") { segIdx = 0; defaultT = 0.5; }
          else { segIdx = 0; defaultT = 0.85; }
        }
        return { ...app, segmentIndex: segIdx, t: defaultT };
      });
    });
  };

  // SVG Virtual Dimensions
  const viewWidth = 500;
  const viewHeight = 360;
  const padding = 45;

  const lVal = length || 10;
  const wVal = width || 8;

  // Scale calculations
  const scale = useMemo(() => {
    const drawW = viewWidth - padding * 2;
    const drawH = viewHeight - padding * 2;
    return Math.min(drawW / lVal, drawH / wVal);
  }, [lVal, wVal]);

  const originX = useMemo(() => {
    const drawW = lVal * scale;
    return (viewWidth - drawW) / 2;
  }, [lVal, scale]);

  const originY = useMemo(() => {
    const drawH = wVal * scale;
    return (viewHeight - drawH) / 2;
  }, [wVal, scale]);

  // Convert Feet to Screen Pixels
  const toPixelsX = (feetX: number) => originX + feetX * scale;
  const toPixelsY = (feetY: number) => originY + feetY * scale;

  // Convert Screen Pixels back to Feet
  const toFeetX = (pixelX: number) => (pixelX - originX) / scale;
  const toFeetY = (pixelY: number) => (pixelY - originY) / scale;

  // Drag handlers
  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!activeDragId || !svgRef.current) return;

    // Get SVG relative mouse position
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert pixel inputs directly back to SVG viewbox scale
    const relativeX = (clientX / rect.width) * viewWidth;
    const relativeY = (clientY / rect.height) * viewHeight;

    // Convert to Feet coordinates
    const fx = toFeetX(relativeX);
    const fy = toFeetY(relativeY);

    // Find the closest countertop segment and calculate standard projection factor t
    let bestSegmentIndex = 0;
    let bestT = 0.5;
    let minDistance = Infinity;

    segments.forEach((seg, idx) => {
      const abx = seg.bx - seg.ax;
      const aby = seg.by - seg.ay;
      const apx = fx - seg.ax;
      const apy = fy - seg.ay;

      const ab_len_sq = abx * abx + aby * aby;
      if (ab_len_sq === 0) return;

      let tVal = (apx * abx + apy * aby) / ab_len_sq;
      tVal = Math.max(0, Math.min(1, tVal));

      const cx = seg.ax + tVal * abx;
      const cy = seg.ay + tVal * aby;

      const dist = Math.sqrt(Math.pow(fx - cx, 2) + Math.pow(fy - cy, 2));
      if (dist < minDistance) {
        minDistance = dist;
        bestSegmentIndex = idx;
        bestT = tVal;
      }
    });

    setAppliances((prev) =>
      prev.map((app) =>
        app.id === activeDragId
          ? { ...app, segmentIndex: bestSegmentIndex, t: bestT }
          : app
      )
    );
  };

  const handlePointerUp = () => {
    if (activeDragId && onChangeAppliances) {
      onChangeAppliances(
        appliances.map((a) => ({
          id: a.id,
          segmentIndex: a.segmentIndex,
          t: a.t
        }))
      );
    }
    setActiveDragId(null);
  };

  // Build grid markers for every foot
  const gridLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i <= lVal; i++) {
      lines.push({ type: "v", val: i });
    }
    for (let j = 0; j <= wVal; j++) {
      lines.push({ type: "h", val: j });
    }
    return lines;
  }, [lVal, wVal]);

  return (
    <div className="space-y-4" id="blueprint-canvas-container">
      {/* Interactive Blueprint Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${readOnly ? "bg-[#86868B]" : "bg-[#0071E3] animate-pulse"}`}></div>
          <span className="text-xs font-bold text-[#86868B] dark:text-[#a1a1a6] uppercase tracking-wider">
            {readOnly ? "Architectural 2D Layout Blueprint (Reference)" : "Interactive CAD 2D Blueprint Editor"}
          </span>
        </div>
        {!readOnly && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-[#F5F5F7] dark:bg-[#161618] dark:hover:bg-[#1e1e21] border border-[#D2D2D7]/40 dark:border-white/10 rounded-xl text-xs font-semibold text-[#6E6E73] dark:text-[#a1a1a6] transition-all cursor-pointer shadow-sm active:scale-95"
            title="Reset appliances to standard layout positions"
            type="button"
          >
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* Main Architectural Graphic Canvas */}
      <div className="relative border border-[#D2D2D7]/50 dark:border-white/10 rounded-2xl overflow-hidden bg-[#F5F5F7]/40 dark:bg-[#0a0a0c]/80 flex flex-col items-center justify-center shadow-inner">
        
        {/* SVG Editor Area */}
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          className="w-full h-auto select-none touch-none cursor-crosshair"
          onPointerMove={handleSvgPointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          id="blueprint-svg"
        >
          {/* DEFINITIONS FOR SVG GRADIENTS AND EFFECTS */}
          <defs>
            {/* Grid Pattern */}
            <pattern id="room-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-200/50 dark:text-zinc-800/30" />
            </pattern>
            {/* Soft Shadow Filter */}
            <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.12" floodColor="#000" />
            </filter>
            {/* Active Glow Filter */}
            <filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* BACKGROUND SYSTEM GRID */}
          <rect width={viewWidth} height={viewHeight} fill="none" />
          
          {/* ROOM WALLS BOUNDARY & GRID BACKING */}
          <g id="grid-group">
            {/* Grid Box */}
            <rect
              x={toPixelsX(0)}
              y={toPixelsY(0)}
              width={lVal * scale}
              height={wVal * scale}
              fill="url(#room-grid)"
              stroke="currentColor"
              strokeWidth="2.5"
              className="fill-[#F5F5F7]/30 dark:fill-[#0d0d11]/40 text-[#D2D2D7]/70 dark:text-zinc-800"
            />

            {/* Scale Helper Lines */}
            {gridLines.map((gl, index) => {
              if (gl.type === "v" && gl.val > 0 && gl.val < lVal) {
                return (
                  <line
                    key={`v-${index}`}
                    x1={toPixelsX(gl.val)}
                    y1={toPixelsY(0)}
                    x2={toPixelsX(gl.val)}
                    y2={toPixelsY(wVal)}
                    stroke="currentColor"
                    strokeWidth="0.5"
                    strokeDasharray="4 4"
                    className="text-slate-300/40 dark:text-zinc-800/40"
                  />
                );
              }
              if (gl.type === "h" && gl.val > 0 && gl.val < wVal) {
                return (
                  <line
                    key={`h-${index}`}
                    x1={toPixelsX(0)}
                    y1={toPixelsY(gl.val)}
                    x2={toPixelsX(lVal)}
                    y2={toPixelsY(gl.val)}
                    stroke="currentColor"
                    strokeWidth="0.5"
                    strokeDasharray="4 4"
                    className="text-slate-300/40 dark:text-zinc-800/40"
                  />
                );
              }
              return null;
            })}
          </g>

          {/* COUNTERTOP BLOCKS DRAWING */}
          <g id="countertops-group" opacity="0.85">
            {/* Draw active countertop boxes depending on Layout Shape */}
            {layoutType === "Straight Kitchen" && (
              <rect
                x={toPixelsX(0)}
                y={toPixelsY(wVal - 2.0)}
                width={lVal * scale}
                height={2.0 * scale}
                className="fill-slate-100 dark:fill-zinc-900 stroke-slate-400 dark:stroke-zinc-700"
                strokeWidth="2"
                rx={4}
              />
            )}
            {layoutType === "L Shape Kitchen" && (
              <>
                {/* Horizontal Top Counter */}
                <rect
                  x={toPixelsX(0)}
                  y={toPixelsY(0)}
                  width={lVal * scale}
                  height={2.0 * scale}
                  className="fill-slate-100 dark:fill-zinc-900 stroke-slate-400 dark:stroke-zinc-700"
                  strokeWidth="2"
                  rx={4}
                />
                {/* Vertical Left Counter */}
                <rect
                  x={toPixelsX(0)}
                  y={toPixelsY(2.0)}
                  width={2.0 * scale}
                  height={(wVal - 2.0) * scale}
                  className="fill-slate-100 dark:fill-zinc-900 stroke-slate-400 dark:stroke-zinc-700"
                  strokeWidth="2"
                  rx={4}
                />
              </>
            )}
            {layoutType === "U Shape Kitchen" && (
              <>
                {/* Left Counter */}
                <rect
                  x={toPixelsX(0)}
                  y={toPixelsY(0)}
                  width={2.0 * scale}
                  height={wVal * scale}
                  className="fill-slate-100 dark:fill-zinc-900 stroke-slate-400 dark:stroke-zinc-700"
                  strokeWidth="2"
                  rx={4}
                />
                {/* Back / Top Counter */}
                <rect
                  x={toPixelsX(2.0)}
                  y={toPixelsY(0)}
                  width={(lVal - 4.0) * scale}
                  height={2.0 * scale}
                  className="fill-slate-100 dark:fill-zinc-900 stroke-slate-400 dark:stroke-zinc-700"
                  strokeWidth="2"
                  rx={4}
                />
                {/* Right Counter */}
                <rect
                  x={toPixelsX(lVal - 2.0)}
                  y={toPixelsY(0)}
                  width={2.0 * scale}
                  height={wVal * scale}
                  className="fill-slate-100 dark:fill-zinc-900 stroke-slate-400 dark:stroke-zinc-700"
                  strokeWidth="2"
                  rx={4}
                />
              </>
            )}
            {layoutType === "Parallel Kitchen" && (
              <>
                {/* Top Counter */}
                <rect
                  x={toPixelsX(0)}
                  y={toPixelsY(0)}
                  width={lVal * scale}
                  height={2.0 * scale}
                  className="fill-slate-100 dark:fill-zinc-900 stroke-slate-400 dark:stroke-zinc-700"
                  strokeWidth="2"
                  rx={4}
                />
                {/* Bottom Counter */}
                <rect
                  x={toPixelsX(0)}
                  y={toPixelsY(wVal - 2.0)}
                  width={lVal * scale}
                  height={2.0 * scale}
                  className="fill-slate-100 dark:fill-zinc-900 stroke-slate-400 dark:stroke-zinc-700"
                  strokeWidth="2"
                  rx={4}
                />
              </>
            )}
          </g>

          {/* DRAG-CONSTRAINT SEGMENT CENTER LINES (ONLY DISPLAY WHILE DRAGGING) */}
          {activeDragId && (
            <g id="guide-lines" opacity="0.6" className="animate-pulse">
              {segments.map((seg, idx) => (
                <line
                  key={`guide-${idx}`}
                  x1={toPixelsX(seg.ax)}
                  y1={toPixelsY(seg.ay)}
                  x2={toPixelsX(seg.bx)}
                  y2={toPixelsY(seg.by)}
                  stroke="#0071E3"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="4 2"
                />
              ))}
            </g>
          )}

          {/* WORK TRIANGLE GLOWING POLYGON */}
          <g id="work-triangle" className="transition-all duration-300">
            {/* Draw dotted polygon representing work triangle path */}
            <polygon
              points={`
                ${toPixelsX(triangleStats.sinkPos.x)},${toPixelsY(triangleStats.sinkPos.y)}
                ${toPixelsX(triangleStats.hobPos.x)},${toPixelsY(triangleStats.hobPos.y)}
                ${toPixelsX(triangleStats.fridgePos.x)},${toPixelsY(triangleStats.fridgePos.y)}
              `}
              fill="rgba(0, 113, 227, 0.04)"
              stroke="#0071E3"
              strokeWidth="2"
              strokeDasharray="5 4"
            />

            {/* Dimension Indicators along legs */}
            {/* Leg 1: Sink -> Hob */}
            <g transform={`translate(${(toPixelsX(triangleStats.sinkPos.x) + toPixelsX(triangleStats.hobPos.x)) / 2}, ${(toPixelsY(triangleStats.sinkPos.y) + toPixelsY(triangleStats.hobPos.y)) / 2})`}>
              <rect x="-24" y="-10" width="48" height="20" rx="6" className="fill-white dark:fill-zinc-900 stroke-[#D2D2D7]/40 dark:stroke-zinc-800" strokeWidth="1" filter="url(#soft-shadow)" />
              <text textAnchor="middle" y="4" fontSize="10" fontWeight="bold" className="fill-[#1D1D1F] dark:fill-[#f5f5f7] font-mono">
                {triangleStats.leg1.toFixed(1)} ft
              </text>
            </g>

            {/* Leg 2: Hob -> Fridge */}
            <g transform={`translate(${(toPixelsX(triangleStats.hobPos.x) + toPixelsX(triangleStats.fridgePos.x)) / 2}, ${(toPixelsY(triangleStats.hobPos.y) + toPixelsY(triangleStats.fridgePos.y)) / 2})`}>
              <rect x="-24" y="-10" width="48" height="20" rx="6" className="fill-white dark:fill-zinc-900 stroke-[#D2D2D7]/40 dark:stroke-zinc-800" strokeWidth="1" filter="url(#soft-shadow)" />
              <text textAnchor="middle" y="4" fontSize="10" fontWeight="bold" className="fill-[#1D1D1F] dark:fill-[#f5f5f7] font-mono">
                {triangleStats.leg2.toFixed(1)} ft
              </text>
            </g>

            {/* Leg 3: Fridge -> Sink */}
            <g transform={`translate(${(toPixelsX(triangleStats.fridgePos.x) + toPixelsX(triangleStats.sinkPos.x)) / 2}, ${(toPixelsY(triangleStats.fridgePos.y) + toPixelsY(triangleStats.sinkPos.y)) / 2})`}>
              <rect x="-24" y="-10" width="48" height="20" rx="6" className="fill-white dark:fill-zinc-900 stroke-[#D2D2D7]/40 dark:stroke-zinc-800" strokeWidth="1" filter="url(#soft-shadow)" />
              <text textAnchor="middle" y="4" fontSize="10" fontWeight="bold" className="fill-[#1D1D1F] dark:fill-[#f5f5f7] font-mono">
                {triangleStats.leg3.toFixed(1)} ft
              </text>
            </g>
          </g>

          {/* WALL LABELS AND ROOM MEASUREMENTS */}
          <g id="measurements-labels" fontSize="11" fontWeight="bold" className="fill-[#86868B] dark:fill-zinc-400 font-mono">
            {/* Top dimension label */}
            <text x={toPixelsX(lVal / 2)} y={toPixelsY(0) - 15} textAnchor="middle">
              Width: {lVal.toFixed(1)} ft
            </text>
            <path d={`M ${toPixelsX(0)} ${toPixelsY(0) - 20} L ${toPixelsX(lVal)} ${toPixelsY(0) - 20}`} stroke="#86868B" strokeWidth="1" strokeDasharray="2 2" />

            {/* Left dimension label */}
            <text x={toPixelsX(0) - 15} y={toPixelsY(wVal / 2)} textAnchor="middle" transform={`rotate(-90, ${toPixelsX(0) - 15}, ${toPixelsY(wVal / 2)})`}>
              Height: {wVal.toFixed(1)} ft
            </text>
            <path d={`M ${toPixelsX(0) - 20} ${toPixelsY(0)} L ${toPixelsX(0) - 20} ${toPixelsY(wVal)}`} stroke="#86868B" strokeWidth="1" strokeDasharray="2 2" />
          </g>

          {/* ACTIVE DRAGGABLE APPLIANCE CARDS */}
          <g id="appliances-nodes">
            {appliancePositions.map((app) => {
              const px = toPixelsX(app.x);
              const py = toPixelsY(app.y);
              const isDragging = activeDragId === app.id;
              
              // Size of appliance box (approx 1.2 ft in pixels)
              const boxSize = 1.3 * scale;

              return (
                <g
                  key={app.id}
                  transform={`translate(${px}, ${py})`}
                  onPointerDown={(e) => {
                    if (readOnly) return;
                    e.stopPropagation();
                    (e.target as Element).setPointerCapture(e.pointerId);
                    setActiveDragId(app.id);
                  }}
                  className={readOnly ? "" : "cursor-grab active:cursor-grabbing"}
                  filter={isDragging ? "url(#glow)" : "url(#soft-shadow)"}
                >
                  {/* Backdrop boundary */}
                  <rect
                    x={-boxSize / 2}
                    y={-boxSize / 2}
                    width={boxSize}
                    height={boxSize}
                    rx={10}
                    fill={isDragging ? "rgba(0, 113, 227, 0.15)" : "rgba(255,255,255,0.02)"}
                    stroke={isDragging ? "#0071E3" : "transparent"}
                    strokeWidth="2.5"
                  />

                  {/* Appliance Real Graphics based on ID */}
                  {app.id === "sink" && (
                    <g>
                      {/* Double sink outer frame */}
                      <rect x={-boxSize / 2.2} y={-boxSize / 2.2} width={boxSize / 1.1} height={boxSize / 1.1} rx={8} fill="#2c2c2e" stroke="#34C759" strokeWidth="1.5" />
                      {/* Left basin */}
                      <rect x={-boxSize / 2.6} y={-boxSize / 2.6} width={boxSize / 2.7} height={boxSize / 1.3} rx={4} fill="#1c1c1e" stroke="#34C759" strokeWidth="1" />
                      <circle cx={-boxSize / 4} cy={0} r="3" fill="#34C759" fillOpacity="0.5" />
                      {/* Right basin */}
                      <rect x={boxSize / 52} y={-boxSize / 2.6} width={boxSize / 2.7} height={boxSize / 1.3} rx={4} fill="#1c1c1e" stroke="#34C759" strokeWidth="1" />
                      <circle cx={boxSize / 4} cy={0} r="3" fill="#34C759" fillOpacity="0.5" />
                      {/* Faucet connection line */}
                      <path d="M 0 5 L 0 -5 L -2 -5" stroke="#a1a1a6" strokeWidth="2.5" strokeLinecap="round" />
                    </g>
                  )}

                  {app.id === "hob" && (
                    <g>
                      {/* 4-burner cooktop glass panel */}
                      <rect x={-boxSize / 2.2} y={-boxSize / 2.2} width={boxSize / 1.1} height={boxSize / 1.1} rx={8} fill="#1e1e1e" stroke="#FF9500" strokeWidth="1.5" />
                      {/* Burners */}
                      <circle cx={-boxSize / 5} cy={-boxSize / 5} r={boxSize / 6} fill="none" stroke="#FF9500" strokeWidth="1.5" strokeDasharray="3 2" />
                      <circle cx={-boxSize / 5} cy={-boxSize / 5} r={boxSize / 10} fill="#FF9500" fillOpacity="0.3" />
                      
                      <circle cx={boxSize / 5} cy={boxSize / 5} r={boxSize / 6} fill="none" stroke="#FF9500" strokeWidth="1.5" strokeDasharray="3 2" />
                      <circle cx={boxSize / 5} cy={boxSize / 5} r={boxSize / 10} fill="#FF9500" fillOpacity="0.3" />

                      <circle cx={boxSize / 5} cy={-boxSize / 5} r={boxSize / 7} fill="none" stroke="#FF9500" strokeWidth="1" />
                      <circle cx={-boxSize / 5} cy={boxSize / 5} r={boxSize / 7} fill="none" stroke="#FF9500" strokeWidth="1" />
                    </g>
                  )}

                  {app.id === "fridge" && (
                    <g>
                      {/* Stainless Steel Refrigerator representation */}
                      <rect x={-boxSize / 2.2} y={-boxSize / 2.2} width={boxSize / 1.1} height={boxSize / 1.1} rx={8} fill="#5e5e62" stroke="#0071E3" strokeWidth="1.5" />
                      {/* Double Doors line */}
                      <line x1={0} y1={-boxSize / 2.4} x2={0} y2={boxSize / 2.4} stroke="#1c1c1e" strokeWidth="1.5" />
                      {/* Handle right door */}
                      <rect x={boxSize / 14} y={-boxSize / 4} width="4" height={boxSize / 2} rx="1" fill="#0071E3" />
                      {/* Handle left door */}
                      <rect x={-boxSize / 14 - 4} y={-boxSize / 4} width="4" height={boxSize / 2} rx="1" fill="#0071E3" />
                    </g>
                  )}

                  {/* Rounded Tag Label */}
                  <g transform={`translate(0, ${boxSize / 2 + 10})`}>
                    <rect
                      x={-28}
                      y={-6}
                      width={56}
                      height={12}
                      rx="4"
                      fill={isDragging ? "#0071E3" : "#1D1D1F"}
                      className="opacity-90 shadow-sm"
                    />
                    <text
                      textAnchor="middle"
                      y="3"
                      fontSize="8"
                      fontWeight="bold"
                      fill="#ffffff"
                      className="font-sans"
                    >
                      {app.name.toUpperCase()}
                    </text>
                  </g>

                  {/* Drag Indicator Overlay on Hover */}
                  {!readOnly && (
                    <g opacity={isDragging ? 1 : 0.4} transform="translate(0, 0)">
                      <circle cx="0" cy="0" r="11" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                      <path d="M-3 0 L3 0 M0 -3 L0 3" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* WORK TRIANGLE HUD / STATS FLOATING OVERLAY */}
        <div className="absolute bottom-3 left-3 right-3 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md rounded-2xl border border-[#D2D2D7]/40 dark:border-white/10 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm">
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold text-[#86868B] dark:text-zinc-400 uppercase tracking-widest block">
              Ergonomics Dashboard
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-[#1D1D1F] dark:text-white leading-none font-mono">
                Work Triangle Perimeter: {triangleStats.sum.toFixed(1)} ft
              </span>
            </div>
            <p className="text-[10.5px] text-[#6E6E73] dark:text-zinc-400 font-medium leading-relaxed max-w-sm">
              {triangleStats.adviceText}
            </p>
          </div>

          <div className={`px-3 py-1.5 rounded-xl border text-center font-bold text-xs shrink-0 flex items-center justify-center gap-1.5 ${triangleStats.ratingColor}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{triangleStats.statusText}</span>
          </div>
        </div>
      </div>

      {/* Guide Card of Ergonomics Tips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#161618] border border-[#D2D2D7]/50 dark:border-white/10 p-3 rounded-2xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#34C759]/10 flex items-center justify-center text-[#34C759] shrink-0 font-bold text-xs">
            1
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-[#86868B] dark:text-zinc-400 font-bold uppercase tracking-wide block">Wet Zone</span>
            <h5 className="text-xs font-semibold text-[#1D1D1F] dark:text-white truncate">Sink Position</h5>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161618] border border-[#D2D2D7]/50 dark:border-white/10 p-3 rounded-2xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FF9500]/10 flex items-center justify-center text-[#FF9500] shrink-0 font-bold text-xs">
            2
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-[#86868B] dark:text-zinc-400 font-bold uppercase tracking-wide block">Hot Zone</span>
            <h5 className="text-xs font-semibold text-[#1D1D1F] dark:text-white truncate">Cooking Hob</h5>
          </div>
        </div>

        <div className="bg-white dark:bg-[#161618] border border-[#D2D2D7]/50 dark:border-white/10 p-3 rounded-2xl flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] shrink-0 font-bold text-xs">
            3
          </div>
          <div className="min-w-0">
            <span className="text-[10px] text-[#86868B] dark:text-zinc-400 font-bold uppercase tracking-wide block">Cold Zone</span>
            <h5 className="text-xs font-semibold text-[#1D1D1F] dark:text-white truncate">Refrigerator</h5>
          </div>
        </div>
      </div>
    </div>
  );
}
