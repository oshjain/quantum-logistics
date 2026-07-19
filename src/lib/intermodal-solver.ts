// Intermodal Puzzle — graph shortest path with time/cost constraints

export type ModeType = "truck" | "rail" | "barge" | "ocean" | "air";

export type Node = { id: string; name: string; shortName: string; x: number; y: number };

export type Edge = {
  id: string;
  from: string;
  to: string;
  mode: ModeType;
  days: number;
  cost: number; // USD
  label: string;
};

export type Route = {
  edges: Edge[];
  totalDays: number;
  totalCost: number;
  valid: boolean; // within the time window
  nodes: string[];
};

export type SolveStats = {
  totalPathsExplored: number;
  validRoutesFound: number;
  maxDepth: number;
  branchingFactor: number;
  computeTimeMs: number;
  graphNodes: number;
  graphEdges: number;
};

export type NetworkPreset = {
  id: string;
  label: string;
  description: string;
  startId: string;
  endId: string;
  timeMin: number;
  timeMax: number;
  nodes: Node[];
  edges: Edge[];
};

// ─── Preset Networks ─────────────────────────────────────────────────────────

export const NETWORK_PRESETS: NetworkPreset[] = [
  {
    id: "usa-europe",
    label: "🇺🇸 USA Midwest → Hamburg",
    description: "Machine parts from Omaha to Germany via US rail hubs + ocean freight",
    startId: "omaha", endId: "hamburg", timeMin: 10, timeMax: 20,
    nodes: [
      { id: "omaha",  name: "Omaha",        shortName: "OMA", x: 260, y: 200 },
      { id: "kc",     name: "Kansas City",  shortName: "KC",  x: 300, y: 260 },
      { id: "chicago",name: "Chicago",      shortName: "CHI", x: 380, y: 140 },
      { id: "stlouis",name: "St. Louis",    shortName: "STL", x: 340, y: 240 },
      { id: "la",     name: "Los Angeles",  shortName: "LA",  x: 80,  y: 280 },
      { id: "ny",     name: "New York",     shortName: "NY",  x: 500, y: 130 },
      { id: "no",     name: "New Orleans",  shortName: "NO",  x: 320, y: 360 },
      { id: "dallas", name: "Dallas",       shortName: "DAL", x: 270, y: 330 },
      { id: "hamburg",name: "Hamburg \uD83C\uDDE9\uD83C\uDDEA", shortName: "HAM", x: 560, y: 60  },
    ],
    edges: [
      { id: "e1",  from: "omaha",   to: "kc",      mode: "truck", days: 1,  cost: 300,  label: "Truck 1d $300" },
      { id: "e2",  from: "omaha",   to: "chicago", mode: "truck", days: 1,  cost: 400,  label: "Truck 1d $400" },
      { id: "e3",  from: "omaha",   to: "stlouis", mode: "truck", days: 1,  cost: 350,  label: "Truck 1d $350" },
      { id: "e4",  from: "omaha",   to: "dallas",  mode: "truck", days: 1,  cost: 500,  label: "Truck 1d $500" },
      { id: "e5",  from: "kc",      to: "la",      mode: "rail",  days: 3,  cost: 800,  label: "Rail 3d $800" },
      { id: "e6",  from: "chicago", to: "ny",      mode: "rail",  days: 2,  cost: 700,  label: "Rail 2d $700" },
      { id: "e7",  from: "stlouis", to: "no",      mode: "barge", days: 5,  cost: 500,  label: "Barge 5d $500" },
      { id: "e8",  from: "la",      to: "hamburg", mode: "ocean", days: 12, cost: 900,  label: "Ocean 12d $900" },
      { id: "e9",  from: "ny",      to: "hamburg", mode: "ocean", days: 10, cost: 1100, label: "Ocean 10d $1100" },
      { id: "e10", from: "no",      to: "hamburg", mode: "ocean", days: 12, cost: 950,  label: "Ocean 12d $950" },
      { id: "e11", from: "dallas",  to: "hamburg", mode: "air",   days: 1,  cost: 4500, label: "Air 1d $4500" },
    ],
  },
  {
    id: "asia-europe",
    label: "\uD83C\uDDE8\uD83C\uDDF3 Shanghai → Rotterdam",
    description: "Electronics from China to Netherlands across the New Silk Road",
    startId: "shanghai", endId: "rotterdam", timeMin: 14, timeMax: 28,
    nodes: [
      { id: "shanghai",  name: "Shanghai \uD83C\uDDE8\uD83C\uDDF3", shortName: "SHA", x: 560, y: 200 },
      { id: "chengdu",   name: "Chengdu",       shortName: "CDU", x: 480, y: 240 },
      { id: "singapore", name: "Singapore",     shortName: "SGP", x: 490, y: 340 },
      { id: "colombo",   name: "Colombo \uD83C\uDDF1\uD83C\uDDF0", shortName: "CMB", x: 360, y: 320 },
      { id: "dubai",     name: "Dubai \uD83C\uDDE6\uD83C\uDDEA",   shortName: "DXB", x: 240, y: 260 },
      { id: "istanbul",  name: "Istanbul",      shortName: "IST", x: 140, y: 160 },
      { id: "moscow",    name: "Moscow",        shortName: "MSK", x: 160, y: 60  },
      { id: "rotterdam", name: "Rotterdam \uD83C\uDDF3\uD83C\uDDF1", shortName: "RTM", x: 60,  y: 100 },
      { id: "hamburg2",  name: "Hamburg \uD83C\uDDE9\uD83C\uDDEA", shortName: "HAM", x: 80,  y: 40  },
    ],
    edges: [
      { id: "a1",  from: "shanghai",  to: "chengdu",   mode: "truck", days: 2,  cost: 500,  label: "Truck 2d $500" },
      { id: "a2",  from: "shanghai",  to: "singapore", mode: "ocean", days: 6,  cost: 600,  label: "Ocean 6d $600" },
      { id: "a3",  from: "chengdu",   to: "moscow",    mode: "rail",  days: 12, cost: 1800, label: "Rail 12d $1800" },
      { id: "a4",  from: "chengdu",   to: "dubai",     mode: "rail",  days: 9,  cost: 1400, label: "Rail 9d $1400" },
      { id: "a5",  from: "singapore", to: "colombo",   mode: "ocean", days: 2,  cost: 300,  label: "Ocean 2d $300" },
      { id: "a6",  from: "colombo",   to: "dubai",     mode: "ocean", days: 5,  cost: 500,  label: "Ocean 5d $500" },
      { id: "a7",  from: "dubai",     to: "istanbul",  mode: "truck", days: 4,  cost: 900,  label: "Truck 4d $900" },
      { id: "a8",  from: "dubai",     to: "rotterdam", mode: "ocean", days: 14, cost: 1100, label: "Ocean 14d $1100" },
      { id: "a9",  from: "istanbul",  to: "rotterdam", mode: "truck", days: 3,  cost: 700,  label: "Truck 3d $700" },
      { id: "a10", from: "moscow",    to: "rotterdam", mode: "rail",  days: 5,  cost: 1000, label: "Rail 5d $1000" },
      { id: "a11", from: "moscow",    to: "hamburg2",  mode: "rail",  days: 4,  cost: 900,  label: "Rail 4d $900" },
      { id: "a12", from: "istanbul",  to: "hamburg2",  mode: "rail",  days: 4,  cost: 850,  label: "Rail 4d $850" },
      { id: "a13", from: "shanghai",  to: "dubai",     mode: "air",   days: 1,  cost: 6000, label: "Air 1d $6000" },
      { id: "a14", from: "hamburg2",  to: "rotterdam", mode: "truck", days: 1,  cost: 200,  label: "Truck 1d $200" },
    ],
  },
  {
    id: "sa-na",
    label: "\uD83C\uDDE7\uD83C\uDDF7 São Paulo → Los Angeles",
    description: "Coffee & agri-goods from Brazil to US West Coast via Panama Canal",
    startId: "saopaulo", endId: "la2", timeMin: 8, timeMax: 18,
    nodes: [
      { id: "saopaulo",   name: "São Paulo \uD83C\uDDE7\uD83C\uDDF7", shortName: "SAO", x: 520, y: 360 },
      { id: "manaus",     name: "Manaus",         shortName: "MAO", x: 400, y: 280 },
      { id: "bogota",     name: "Bogotá",         shortName: "BOG", x: 320, y: 300 },
      { id: "panama",     name: "Panama Canal",   shortName: "PAN", x: 240, y: 270 },
      { id: "mexicocity", name: "Mexico City",    shortName: "MEX", x: 140, y: 220 },
      { id: "houston",    name: "Houston",        shortName: "HOU", x: 200, y: 160 },
      { id: "miami",      name: "Miami",          shortName: "MIA", x: 340, y: 140 },
      { id: "la2",        name: "Los Angeles \uD83C\uDDFA\uD83C\uDDF8", shortName: "LA",  x: 60,  y: 180 },
    ],
    edges: [
      { id: "s1",  from: "saopaulo",   to: "manaus",     mode: "truck", days: 3,  cost: 700,  label: "Truck 3d $700" },
      { id: "s2",  from: "saopaulo",   to: "bogota",     mode: "air",   days: 1,  cost: 3500, label: "Air 1d $3500" },
      { id: "s3",  from: "manaus",     to: "bogota",     mode: "barge", days: 4,  cost: 400,  label: "Barge 4d $400" },
      { id: "s4",  from: "manaus",     to: "panama",     mode: "barge", days: 5,  cost: 500,  label: "Barge 5d $500" },
      { id: "s5",  from: "bogota",     to: "panama",     mode: "truck", days: 2,  cost: 450,  label: "Truck 2d $450" },
      { id: "s6",  from: "panama",     to: "mexicocity", mode: "ocean", days: 4,  cost: 600,  label: "Ocean 4d $600" },
      { id: "s7",  from: "panama",     to: "miami",      mode: "ocean", days: 3,  cost: 500,  label: "Ocean 3d $500" },
      { id: "s8",  from: "panama",     to: "houston",    mode: "ocean", days: 4,  cost: 550,  label: "Ocean 4d $550" },
      { id: "s9",  from: "mexicocity", to: "la2",        mode: "truck", days: 3,  cost: 650,  label: "Truck 3d $650" },
      { id: "s10", from: "miami",      to: "la2",        mode: "rail",  days: 4,  cost: 900,  label: "Rail 4d $900" },
      { id: "s11", from: "houston",    to: "la2",        mode: "truck", days: 2,  cost: 500,  label: "Truck 2d $500" },
    ],
  },
];

// ─── Legacy exports (default to first preset) ───────────────────────────────

const DEFAULT = NETWORK_PRESETS[0];
export const NODES: Node[] = DEFAULT.nodes;
export const EDGES: Edge[] = DEFAULT.edges;

export const MODE_COLORS: Record<ModeType, string> = {
  truck: "#9ca3af",
  rail:  "#22c55e",
  barge: "#06b6d4",
  ocean: "#1d4ed8",
  air:   "#f97316",
};

export const MODE_EMOJIS: Record<ModeType, string> = {
  truck: "🚛",
  rail:  "🚂",
  barge: "⛵",
  ocean: "🚢",
  air:   "✈️",
};

let _exploreCount = 0;
let _maxDepthReached = 0;

function findRoutesFrom(
  startId: string,
  endId: string,
  edges: Edge[],
  visited: Set<string>,
  maxEdges = 5,
  depth = 0,
): Route[] {
  _exploreCount++;
  if (depth > _maxDepthReached) _maxDepthReached = depth;
  if (startId === endId) return [{ edges: [], totalDays: 0, totalCost: 0, valid: true, nodes: [startId] }];
  if (visited.size >= maxEdges) return [];

  const result: Route[] = [];
  const outgoing = edges.filter((e) => e.from === startId && !visited.has(e.id));

  for (const edge of outgoing) {
    const newVisited = new Set(visited);
    newVisited.add(edge.id);
    const subRoutes = findRoutesFrom(edge.to, endId, edges, newVisited, maxEdges, depth + 1);
    for (const sub of subRoutes) {
      result.push({
        edges: [edge, ...sub.edges],
        totalDays: edge.days + sub.totalDays,
        totalCost: edge.cost + sub.totalCost,
        valid: true,
        nodes: [startId, ...sub.nodes],
      });
    }
  }
  return result;
}

export function findAllRoutes(preset?: NetworkPreset): Route[] {
  const p = preset ?? NETWORK_PRESETS[0];
  _exploreCount = 0; _maxDepthReached = 0;
  const routes = findRoutesFrom(p.startId, p.endId, p.edges, new Set());
  return routes.map((r) => ({
    ...r,
    valid: r.totalDays >= p.timeMin && r.totalDays <= p.timeMax,
  }));
}

export function solveIntermodal(preset?: NetworkPreset): { route: Route; stats: SolveStats } {
  const p = preset ?? NETWORK_PRESETS[0];
  const t0 = performance.now();
  _exploreCount = 0; _maxDepthReached = 0;

  const allRoutes = findRoutesFrom(p.startId, p.endId, p.edges, new Set());
  const valid = allRoutes.filter((r) => r.totalDays >= p.timeMin && r.totalDays <= p.timeMax);
  const best = valid.sort((a, b) => a.totalCost - b.totalCost)[0];

  const t1 = performance.now();
  const outDegrees = p.nodes.map(n => p.edges.filter(e => e.from === n.id).length);
  const avgBranch = outDegrees.reduce((a, b) => a + b, 0) / outDegrees.filter(d => d > 0).length;

  return {
    route: best,
    stats: {
      totalPathsExplored: allRoutes.length,
      validRoutesFound: valid.length,
      maxDepth: _maxDepthReached,
      branchingFactor: Math.round(avgBranch * 10) / 10,
      computeTimeMs: Math.round((t1 - t0) * 100) / 100,
      graphNodes: p.nodes.length,
      graphEdges: p.edges.length,
    },
  };
}
