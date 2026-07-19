import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import NavBar from "@/components/NavBar.tsx";
import { cn } from "@/lib/utils.ts";
import {
  MODE_COLORS, MODE_EMOJIS,
  NETWORK_PRESETS,
  findAllRoutes, solveIntermodal,
  type Edge, type Route, type ModeType, type SolveStats, type NetworkPreset, type Node,
} from "@/lib/intermodal-solver.ts";

// ─── helpers ────────────────────────────────────────────────────────────────

function nodeById(id: string, nodes: Node[]) {
  return nodes.find(n => n.id === id)!;
}

function buildChain(edgeIds: string[], edges: Edge[], startId: string, endId: string): {
  connected: boolean; chain: Edge[]; pathNodes: string[]; orphans: number;
} {
  const pool = edges.filter(e => edgeIds.includes(e.id));
  let current = startId;
  const chain: Edge[] = [];
  const remaining = [...pool];
  const pathNodes = [startId];

  for (;;) {
    const idx = remaining.findIndex(e => e.from === current);
    if (idx === -1) break;
    const next = remaining[idx];
    chain.push(next);
    remaining.splice(idx, 1);
    current = next.to;
    pathNodes.push(current);
  }

  return { connected: current === endId && remaining.length === 0, chain, pathNodes, orphans: remaining.length };
}

// ─── component ───────────────────────────────────────────────────────────────

export default function IntermodalPage() {
  const [selectedEdges, setSelectedEdges] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [solvedRoute, setSolvedRoute] = useState<Route | null>(null);
  const [solving, setSolving] = useState(false);
  const [solveStats, setSolveStats] = useState<SolveStats | null>(null);
  const [userRoute, setUserRoute] = useState<{ cost: number; days: number } | null>(null);
  const [networkId, setNetworkId] = useState<string>(NETWORK_PRESETS[0].id);

  // current network
  const network = useMemo(
    () => NETWORK_PRESETS.find(p => p.id === networkId) ?? NETWORK_PRESETS[0],
    [networkId],
  );

  // reset selection when network changes
  const switchNetwork = useCallback((id: string) => {
    setNetworkId(id);
    setSelectedEdges([]);
    setSolved(false);
    setSolvedRoute(null);
    setSolveStats(null);
    setUserRoute(null);
  }, []);

  // ── draggable node state ──
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  // reset positions when network changes
  useEffect(() => {
    const map: Record<string, { x: number; y: number }> = {};
    network.nodes.forEach(n => { map[n.id] = { x: n.x, y: n.y }; });
    setNodePositions(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkId]);

  const [dragging, setDragging] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // build a live node list from positions
  const liveNodes = useMemo(() =>
    network.nodes.map(n => ({ ...n, x: nodePositions[n.id]?.x ?? n.x, y: nodePositions[n.id]?.y ?? n.y })),
    [nodePositions, network.nodes],
  );

  // precompute which edges connect to each node
  const nodeEdges = useMemo(() => {
    const map: Record<string, string[]> = {};
    network.nodes.forEach(n => { map[n.id] = []; });
    network.edges.forEach(e => {
      map[e.from]?.push(e.id);
      map[e.to]?.push(e.id);
    });
    return map;
  }, [network]);

  // which edges should be "lit up" based on hover
  const connectedEdgeIds = useMemo(() => {
    if (hoveredNode) return new Set(nodeEdges[hoveredNode] ?? []);
    if (hoveredEdge) return new Set([hoveredEdge]);
    return null;
  }, [hoveredNode, hoveredEdge, nodeEdges]);

  const validRoutes = useMemo(
    () => findAllRoutes(network).filter(r => r.valid).sort((a, b) => a.totalCost - b.totalCost),
    [network],
  );

  const { connected, chain, pathNodes, orphans } = useMemo(
    () => buildChain(selectedEdges, network.edges, network.startId, network.endId),
    [selectedEdges, network],
  );

  const totalCost = chain.reduce((s, e) => s + e.cost, 0);
  const totalDays  = chain.reduce((s, e) => s + e.days, 0);
  const dayWarning = selectedEdges.length > 0 && connected && (totalDays < network.timeMin || totalDays > network.timeMax);

  const highlightedIds = solved && solvedRoute
    ? solvedRoute.edges.map(e => e.id)
    : selectedEdges;

  function toggleEdge(id: string) {
    setSolved(false); setSolvedRoute(null); setSolveStats(null);
    setSelectedEdges(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function clearRoute() { setSelectedEdges([]); setSolved(false); setSolvedRoute(null); setSolveStats(null); }

  async function runSolver() {
    setUserRoute(connected ? { cost: totalCost, days: totalDays } : null);
    setSolving(true); setSolved(false);
    await new Promise<void>(r => setTimeout(r, 1000));
    const { route, stats } = solveIntermodal(network);
    setSolvedRoute(route);
    setSolveStats(stats);
    setSelectedEdges(route.edges.map(e => e.id));
    setSolved(true); setSolving(false);
  }

  // ── drag handlers ──
  const getSvgCoords = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: e.clientX, y: e.clientY };
    const svgPt = pt.matrixTransform(ctm.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }, []);

  const handleNodeMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
    if (nodeId === network.startId || nodeId === network.endId) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging(nodeId);
  }, [network.startId, network.endId]);

  const handleSvgMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging) return;
    const { x, y } = getSvgCoords(e);
    // clamp to svg bounds
    const cx = Math.max(30, Math.min(590, x));
    const cy = Math.max(30, Math.min(370, y));
    setNodePositions(prev => ({
      ...prev,
      [dragging]: { x: cx, y: cy },
    }));
  }, [dragging, getSvgCoords]);

  const handleSvgMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ── Title ── */}
        <motion.div initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">🗺️ Intermodal Puzzle</h1>
            {/* Network Selector */}
            <div className="relative">
              <select
                value={networkId}
                onChange={(e) => switchNetwork(e.target.value)}
                className="appearance-none bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm font-medium cursor-pointer hover:bg-secondary/80 transition-colors pr-8"
              >
                {NETWORK_PRESETS.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">▼</span>
            </div>
          </div>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
            {network.description}. Pick the best route — the customer needs it in{" "}
            <span className="text-primary font-semibold">{network.timeMin}–{network.timeMax} days</span>, as cheap as possible!
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Left column ── */}
          <div className="flex-1 min-w-0">
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-3">
              {(["truck", "rail", "barge", "ocean", "air"] as ModeType[]).map(m => (
                <span key={m} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ background: MODE_COLORS[m] }} />
                  {MODE_EMOJIS[m]} {m}
                </span>
              ))}
              <span className="text-xs text-muted-foreground ml-auto italic">
                {dragging ? "↕️ drag node to reposition" : "🖱️ click edges · drag nodes to rearrange"}
              </span>
            </div>

            {/* SVG Map */}
            <div className="bg-[#0f172a] border border-border rounded-xl overflow-hidden">
              <svg
                ref={svgRef}
                viewBox="0 0 620 400"
                className="w-full select-none"
                style={{ maxHeight: 370, cursor: dragging ? "grabbing" : "default" }}
                onMouseMove={handleSvgMouseMove}
                onMouseUp={handleSvgMouseUp}
                onMouseLeave={handleSvgMouseUp}
              >
                <rect width="620" height="400" fill="#0f172a" />

                {/* Edges */}
                {network.edges.map(edge => {
                  const f = nodeById(edge.from, liveNodes);
                  const t = nodeById(edge.to, liveNodes);
                  const hi = highlightedIds.includes(edge.id);
                  const isHovered = hoveredEdge === edge.id;
                  const isConnectedToHover = connectedEdgeIds?.has(edge.id) ?? true;
                  const dimmed = connectedEdgeIds !== null && !connectedEdgeIds.has(edge.id);
                  const mx = (f.x + t.x) / 2;
                  const my = (f.y + t.y) / 2;

                  // compute label offset perpendicular to edge
                  const dx = t.x - f.x;
                  const dy = t.y - f.y;
                  const len = Math.sqrt(dx * dx + dy * dy);
                  const nx = len > 0 ? -dy / len : 0;
                  const ny = len > 0 ? dx / len : 0;
                  const labelOx = nx * 12;
                  const labelOy = ny * 12;

                  return (
                    <g key={edge.id}>
                      {/* visible line */}
                      <line
                        x1={f.x} y1={f.y} x2={t.x} y2={t.y}
                        stroke={MODE_COLORS[edge.mode]}
                        strokeWidth={hi || isHovered ? 4 : 2.5}
                        strokeOpacity={dimmed ? 0.12 : hi ? 1 : isHovered ? 0.9 : 0.4}
                        strokeDasharray={edge.mode === "ocean" ? "6 3" : undefined}
                        style={{ transition: "stroke-opacity 0.2s, stroke-width 0.2s" }}
                      />
                      {/* invisible hit area — clipped to not overlap nodes */}
                      <line
                        x1={f.x} y1={f.y} x2={t.x} y2={t.y}
                        stroke="transparent"
                        strokeWidth={20}
                        className="cursor-pointer"
                        onClick={() => toggleEdge(edge.id)}
                        onMouseEnter={() => { setHoveredEdge(edge.id); setHoveredNode(null); }}
                        onMouseLeave={() => setHoveredEdge(null)}
                      />
                      {/* label pill */}
                      <g
                        className="cursor-pointer"
                        onClick={() => toggleEdge(edge.id)}
                        onMouseEnter={() => { setHoveredEdge(edge.id); setHoveredNode(null); }}
                        onMouseLeave={() => setHoveredEdge(null)}
                      >
                        <rect
                          x={mx + labelOx - 32} y={my + labelOy - 9}
                          width={64} height={16}
                          rx={4}
                          fill={dimmed ? "transparent" : hi ? "rgba(15,23,42,0.85)" : isHovered ? "rgba(30,41,59,0.9)" : "rgba(15,23,42,0.7)"}
                          stroke={dimmed ? "transparent" : hi ? MODE_COLORS[edge.mode] : "transparent"}
                          strokeWidth={1}
                          style={{ transition: "all 0.2s" }}
                        />
                        <text x={mx + labelOx} y={my + labelOy + 4} textAnchor="middle" fontSize={9}
                          fill={dimmed ? "#334155" : hi ? "#e2e8f0" : isHovered ? "#f1f5f9" : "#94a3b8"}
                          fontFamily="monospace" fontWeight={hi ? "bold" : "normal"}
                          style={{ transition: "fill 0.2s" }}>
                          ${edge.cost} · {edge.days}d · {MODE_EMOJIS[edge.mode]}
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Nodes */}
                {liveNodes.map(node => {
                  const inPath = pathNodes.includes(node.id);
                  const isEndpoint = node.id === network.startId || node.id === network.endId;
                  const isDragging = dragging === node.id;
                  const isHovered = hoveredNode === node.id;
                  const draggable = !isEndpoint;

                  return (
                    <g key={node.id}
                      onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                      onMouseEnter={() => { setHoveredNode(node.id); setHoveredEdge(null); }}
                      onMouseLeave={() => setHoveredNode(null)}
                      style={{ cursor: draggable ? (isDragging ? "grabbing" : "grab") : "default" }}
                    >
                      {/* glow ring when hovered */}
                      {(isHovered || isDragging) && (
                        <circle cx={node.x} cy={node.y} r={22}
                          fill="none" stroke="#7c3aed" strokeWidth={2} strokeOpacity={0.5}
                          className="animate-pulse" />
                      )}
                      {/* main circle */}
                      <circle cx={node.x} cy={node.y} r={isDragging ? 18 : 16}
                        fill={inPath ? "#7c3aed" : "#1e293b"}
                        stroke={isEndpoint ? "#f59e0b" : isHovered ? "#a78bfa" : "#334155"}
                        strokeWidth={isEndpoint ? 2.5 : isHovered ? 2 : 1.5}
                        style={{ transition: "all 0.15s" }}
                      />
                      {/* label */}
                      <text x={node.x} y={node.y + 4} textAnchor="middle" fontSize={9}
                        fill="#f1f5f9" fontWeight="bold" fontFamily="monospace"
                        style={{ pointerEvents: "none" }}>
                        {node.shortName}
                      </text>
                      {/* full name tooltip on hover */}
                      {isHovered && (
                        <text x={node.x} y={node.y - 22} textAnchor="middle" fontSize={10}
                          fill="#fbbf24" fontFamily="sans-serif" fontWeight="semibold"
                          style={{ pointerEvents: "none" }}>
                          {node.name}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Buttons */}
            <div className="mt-4 flex gap-3 flex-wrap">
              <button onClick={clearRoute}
                className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 cursor-pointer transition-colors">
                Clear Route
              </button>
              <button onClick={runSolver} disabled={solving}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  solving ? "bg-primary/40 text-primary-foreground/60 cursor-wait" : "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer",
                )}>
                {solving ? "🔍 Solving…" : "🔍 Optimal Route Finder"}
              </button>
            </div>

            {/* Route Summary */}
            {selectedEdges.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 bg-card border border-border rounded-xl p-4">
                <h2 className="font-semibold text-sm mb-3">
                  {solved ? "✅ Optimal Route" : "📦 Your Route"}
                </h2>

                {chain.length === 0 && orphans > 0 && (
                  <p className="text-xs text-red-400 mb-2">⚠️ No connected path from {nodeById(network.startId, network.nodes).shortName} yet — select edges that chain together.</p>
                )}
                {orphans > 0 && chain.length > 0 && (
                  <p className="text-xs text-yellow-400 mb-2">⚠️ {orphans} disconnected edge(s) ignored — route has gaps.</p>
                )}

                <ol className="space-y-1 mb-3">
                  {chain.map((edge, i) => (
                    <li key={edge.id} className="flex items-center gap-2 text-xs">
                      <span className="text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                      <span className="shrink-0">{MODE_EMOJIS[edge.mode]}</span>
                      <span className="font-mono">
                        {nodeById(edge.from, network.nodes).shortName} → {nodeById(edge.to, network.nodes).shortName}
                      </span>
                      <span className="text-muted-foreground">{edge.days}d</span>
                      <span className="text-green-400 ml-auto">${edge.cost.toLocaleString()}</span>
                    </li>
                  ))}
                </ol>

                <div className="flex flex-wrap gap-4 text-sm border-t border-border pt-3 items-center">
                  <div>
                    <span className="text-muted-foreground">Cost: </span>
                    <span className="font-bold">${totalCost.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Days: </span>
                    <span className={cn("font-bold", dayWarning ? "text-red-400" : connected ? "text-green-400" : "")}>
                      {totalDays}d
                    </span>
                  </div>
                  <div>
                    {connected
                      ? dayWarning
                        ? <span className="text-red-400 font-semibold text-xs">❌ Outside {network.timeMin}–{network.timeMax}d window</span>
                        : <span className="text-green-400 font-semibold text-xs">✅ Valid {network.timeMin}–{network.timeMax}d window</span>
                      : <span className="text-muted-foreground text-xs">Route incomplete</span>}
                  </div>
                </div>

                {solved && solvedRoute && (
                  <p className="mt-2 text-xs text-primary font-semibold">
                    Cheapest valid route: ${solvedRoute.totalCost.toLocaleString()}, {solvedRoute.totalDays} days
                  </p>
                )}
              </motion.div>
            )}
          </div>

          {/* ── Sidebar: Valid Routes ── */}
          <div className="lg:w-72 shrink-0">
            <div className="bg-card border border-border rounded-xl p-4 sticky top-20">
              <h2 className="font-semibold text-sm mb-3">
                Valid Routes{" "}
                <span className="text-muted-foreground font-normal text-xs">({validRoutes.length} found)</span>
              </h2>
              <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                {validRoutes.map((route, i) => (
                  <div key={i}
                    className={cn(
                      "rounded-lg p-2 text-xs border",
                      i === 0 ? "border-green-500/40 bg-green-500/5" : "border-border bg-background/40",
                    )}>
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-foreground">${route.totalCost.toLocaleString()}</span>
                      <span className="text-muted-foreground">{route.totalDays}d</span>
                    </div>
                    <div className="flex flex-wrap gap-0.5 items-center">
                      {route.edges.map(e => (
                        <span key={e.id} title={e.label}>{MODE_EMOJIS[e.mode]}</span>
                      ))}
                      <span className="text-muted-foreground font-mono text-[10px] ml-1">
                        {route.nodes.map(n => nodeById(n, network.nodes).shortName).join("›")}
                      </span>
                    </div>
                    {i === 0 && <span className="text-green-400 font-bold text-[10px] mt-0.5 block">★ Cheapest valid</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* User vs Optimal comparison + Algorithm Interpretation */}
        <AnimatePresence>
          {solved && solveStats && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 space-y-6"
            >
              {/* ── Comparison bar ── */}
              {userRoute && solvedRoute && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Your Route</p>
                      <p className="mt-1 text-xl font-black text-blue-400">${userRoute.cost.toLocaleString()}</p>
                      <p className="text-[11px] text-muted-foreground">{userRoute.days} days</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-green-400">Optimal</p>
                      <p className="mt-1 text-xl font-black text-green-400">${solvedRoute.totalCost.toLocaleString()}</p>
                      <p className="text-[11px] text-muted-foreground">{solvedRoute.totalDays} days</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Savings</p>
                      <p className="mt-1 text-xl font-black text-amber-400">
                        ${Math.max(0, userRoute.cost - solvedRoute.totalCost).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Algorithm Interpretation ── */}
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="font-bold text-lg mb-4">🧠 How the Solver Found the Optimum</h2>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Graph Size</p>
                    <p className="text-2xl font-black text-foreground">{solveStats.graphNodes} nodes</p>
                    <p className="text-xs text-muted-foreground">{solveStats.graphEdges} edges</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Paths Explored</p>
                    <p className="text-2xl font-black text-purple-400">{solveStats.totalPathsExplored}</p>
                    <p className="text-xs text-muted-foreground">DFS recursive calls</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Valid Routes</p>
                    <p className="text-2xl font-black text-green-400">{solveStats.validRoutesFound}</p>
                    <p className="text-xs text-muted-foreground">{network.timeMin}–{network.timeMax}d window</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Compute Time</p>
                    <p className="text-2xl font-black text-amber-400">{solveStats.computeTimeMs}ms</p>
                    <p className="text-xs text-muted-foreground">avg branch {solveStats.branchingFactor}</p>
                  </div>
                </div>

                {/* Algorithm explanation */}
                <div className="space-y-4 text-sm text-muted-foreground">
                  <div>
                    <h3 className="text-foreground font-semibold mb-1">🔍 Algorithm: Exhaustive DFS + Constraint Filtering</h3>
                    <p>
                      The solver performs a <strong className="text-foreground">depth-first search (DFS)</strong> from{" "}
                      <span className="text-purple-400 font-mono">{nodeById(network.startId, network.nodes).shortName}</span> to{" "}
                      <span className="text-purple-400 font-mono">{nodeById(network.endId, network.nodes).shortName}</span>,
                      enumerating every possible path up to {solveStats.maxDepth} segments.
                      Each path is checked against the <strong className="text-foreground">{network.timeMin}–{network.timeMax} day window</strong> —
                      only {solveStats.validRoutesFound} out of {solveStats.totalPathsExplored} paths qualify.
                      The cheapest valid route wins.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-foreground font-semibold mb-1">📐 Complexity: O(b<sup>d</sup>)</h3>
                    <p>
                      With an average branching factor of <strong className="text-foreground">{solveStats.branchingFactor}</strong>{" "}
                      and max depth <strong className="text-foreground">{solveStats.maxDepth}</strong>, the worst-case search space is{" "}
                      <strong className="text-foreground">{solveStats.branchingFactor}<sup>{solveStats.maxDepth}</sup> ≈ {Math.round(Math.pow(solveStats.branchingFactor, solveStats.maxDepth))}</strong> paths.
                      The time-window constraint prunes this to just {solveStats.totalPathsExplored} explored paths, completed in{" "}
                      <strong className="text-amber-400">{solveStats.computeTimeMs}ms</strong>.
                    </p>
                  </div>

                  {/* Dynamic scaling analysis */}
                  {(() => {
                    const scale = 100;
                    const scaledPaths = solveStats.totalPathsExplored * scale * scale; // O(n²) roughly for grid-like graphs
                    const classicalTimeMs = solveStats.computeTimeMs * scale * Math.log2(scale);
                    const quantumTimeMs = solveStats.computeTimeMs * Math.sqrt(scale);
                    const classicalLabel = classicalTimeMs < 1000
                      ? `${Math.round(classicalTimeMs)}ms`
                      : classicalTimeMs < 60000
                        ? `${(classicalTimeMs / 1000).toFixed(1)}s`
                        : `${(classicalTimeMs / 60000).toFixed(1)}min`;
                    const quantumLabel = quantumTimeMs < 1000
                      ? `${Math.round(quantumTimeMs)}ms`
                      : quantumTimeMs < 60000
                        ? `${(quantumTimeMs / 1000).toFixed(1)}s`
                        : `${(quantumTimeMs / 60000).toFixed(1)}min`;

                    return (
                      <div>
                        <h3 className="text-foreground font-semibold mb-1">⚛️ What If the Network Grew {scale}× Larger?</h3>
                        <p>
                          If this network scaled from {solveStats.graphNodes} →{" "}
                          <strong className="text-foreground">{solveStats.graphNodes * scale} nodes</strong> and{" "}
                          {solveStats.graphEdges} →{" "}
                          <strong className="text-foreground">{solveStats.graphEdges * scale} edges</strong>:
                        </p>
                        <div className="mt-3 grid sm:grid-cols-2 gap-3">
                          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 mb-1">🖥️ Classical CPU</p>
                            <p className="text-xs">
                              A Dijkstra-based TMS solver would scale ~<strong className="text-blue-400">O((V+E) log V)</strong> for single-objective,
                              but multi-constraint optimization (cost + time + mode) is <strong className="text-blue-400">NP-hard</strong>.
                              Estimated: <strong className="text-blue-400">~{classicalLabel}</strong> — usable but slowing down.
                            </p>
                          </div>
                          <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 mb-1">⚛️ Quantum Approach</p>
                            <p className="text-xs">
                              <strong className="text-purple-400">Grover's search</strong> could find the optimal route in{" "}
                              <strong className="text-purple-400">O(√N)</strong> steps — a quadratic speedup.
                              A <strong className="text-purple-400">quantum annealer</strong> (D-Wave) maps routes to qubits and finds the global minimum energy state.
                              Estimated: <strong className="text-purple-400">~{quantumLabel}</strong> —{String(Number(quantumTimeMs)) < String(Number(classicalTimeMs)) ? " dramatically faster at scale" : " comparable at this small size, dominant at larger scales"}.
                            </p>
                          </div>
                        </div>
                        <p className="mt-2 text-xs">
                          💡 <strong className="text-foreground">Key insight:</strong> For small graphs like this ({solveStats.graphNodes} nodes),
                          classical brute-force is actually faster. Quantum advantage emerges when the search space explodes —
                          at {scale}× scale, Grover's quadratic speedup becomes decisive. Real-world TMS systems with thousands
                          of hubs already push classical solvers to their limits — this is where quantum computing promises the biggest disruption in logistics.
                        </p>
                      </div>
                    );
                  })()}

                  <div>
                    <h3 className="text-foreground font-semibold mb-1">🧬 Where Quantum Fits in Logistics</h3>
                    <div className="grid sm:grid-cols-3 gap-3 mt-2">
                      <div className="bg-secondary/30 rounded-lg p-3">
                        <p className="text-xs font-semibold text-foreground mb-0.5">🌐 Grover's Search</p>
                        <p className="text-xs">Unstructured search over N possible routes in O(√N) — quadratic speedup over classical O(N).</p>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-3">
                        <p className="text-xs font-semibold text-foreground mb-0.5">🔮 Quantum Annealing</p>
                        <p className="text-xs">D-Wave maps cost functions to qubit energy landscapes. The lowest-energy state = cheapest route.</p>
                      </div>
                      <div className="bg-secondary/30 rounded-lg p-3">
                        <p className="text-xs font-semibold text-foreground mb-0.5">⚡ QAOA (Near-Term)</p>
                        <p className="text-xs">Quantum Approximate Optimization Algorithm — runs on NISQ devices, ideal for constrained routing.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Mode explainer ── */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-bold text-lg mb-4">📦 How Intermodal Logistics Works</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 text-sm text-muted-foreground">
                  <div>
                    <h3 className="text-foreground font-semibold mb-1">🚛 Trucks — First/Last Mile</h3>
                    <p>Flexible door-to-door delivery. Expensive per mile but essential for reaching inland hubs no rail or water can touch.</p>
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold mb-1">🚂 Rail — Bulk Overland</h3>
                    <p>3–5× cheaper per ton-mile than trucks. US rail is the world's largest freight network, moving 1.7 trillion ton-miles/year.</p>
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold mb-1">⛵ Barges — River Highways</h3>
                    <p>One barge replaces 70 trucks. The Mississippi corridor carries 500+ million tons annually at ultra-low cost.</p>
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold mb-1">🚢 Ocean Freight — Global Backbone</h3>
                    <p>90% of world trade by volume travels by sea. A single container ship holds 24,000 TEUs — equal to 24,000 truck loads.</p>
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold mb-1">✈️ Air — Speed at a Price</h3>
                    <p>4–8× more expensive than ocean but delivers in hours not weeks. Reserved for time-critical or ultra-high-value cargo.</p>
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold mb-1">🔀 The Algorithm</h3>
                    <p>Real TMS software (SAP, Oracle) runs variants of Dijkstra / Bellman-Ford over a multi-modal graph with time-window constraints — exactly what this puzzle simulates.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
