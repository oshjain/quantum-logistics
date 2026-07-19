// Quantum Shipment Lifecycle Game - Core Types & Logic

export type StageId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface StageResult {
  manualCost: number;
  manualTime: number; // in days
  quantumCost: number;
  quantumTime: number;
  savings: { cost: number; time: number };
  completed: boolean;
  quantumBoosted: boolean;
  manualChoice?: string;
  quantumChoice?: string;
  manualOutcome?: string;
  quantumOutcome?: string;
}

export interface GameState {
  currentStage: StageId;
  stageResults: Partial<Record<StageId, StageResult>>;
  // Pre-seeded random values per stage (determined at stage start, hidden)
  seeds: Partial<Record<StageId, number[]>>;
  totalManualCost: number;
  totalManualTime: number;
  totalQuantumCost: number;
  totalQuantumTime: number;
  gameOver: boolean;
}

export function createInitialGameState(): GameState {
  return {
    currentStage: 1,
    stageResults: {},
    seeds: {},
    totalManualCost: 0,
    totalManualTime: 0,
    totalQuantumCost: 0,
    totalQuantumTime: 0,
    gameOver: false,
  };
}

// Seeded random number generator (mulberry32)
export function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate seeds for a stage (array of random values pre-committed)
export function generateSeedsForStage(stageId: StageId): number[] {
  const baseSeed = Date.now() ^ (stageId * 0x9e3779b9);
  const rng = seededRandom(baseSeed);
  return Array.from({ length: 20 }, () => rng());
}

// ---- STAGE 1: Empty Container Pickup ----
export interface Stage1Seeds {
  depotAOccupied: boolean; // 70% chance occupied
  depotBOccupied: boolean; // always available
  depotCOccupied: boolean; // always available
}

export function parseStage1Seeds(seeds: number[]): Stage1Seeds {
  return {
    depotAOccupied: seeds[0] < 0.7,
    depotBOccupied: false,
    depotCOccupied: false,
  };
}

export const STAGE1_DEPOTS = [
  { id: "A", name: "Depot A", distance: 45, available: 1 },
  { id: "B", name: "Depot B", distance: 60, available: 4 },
  { id: "C", name: "Depot C", distance: 80, available: 2 },
];

export function calcStage1Cost(
  depotId: string,
  seeds: Stage1Seeds
): { cost: number; time: number; penalised: boolean } {
  const depot = STAGE1_DEPOTS.find((d) => d.id === depotId)!;
  const baseCost = depot.distance * 2;
  const isOccupied =
    depotId === "A" ? seeds.depotAOccupied : depotId === "B" ? seeds.depotBOccupied : seeds.depotCOccupied;
  const penalty = isOccupied ? 50 : 0;
  const timeDelay = isOccupied ? 0.5 : 0;
  return {
    cost: baseCost + penalty,
    time: 0.5 + timeDelay,
    penalised: isOccupied,
  };
}

export function quantumStage1(seeds: Stage1Seeds): {
  choice: string;
  cost: number;
  time: number;
  message: string;
} {
  // Quantum scans all depots: picks cheapest certain option
  // Depot A: 70% chance occupied ($90 + $50 penalty risk), Depot B: $120 guaranteed
  // Best deterministic: B at $120
  const results = STAGE1_DEPOTS.map((d) => {
    const r = calcStage1Cost(d.id, seeds);
    return { ...d, ...r };
  });
  const best = results.reduce((a, b) => {
    // Quantum knows true state, picks lowest actual cost
    return a.cost < b.cost ? a : b;
  });
  return {
    choice: best.id,
    cost: best.cost,
    time: best.time,
    message: `Optimized pickup: Depot ${best.id} (${best.distance}km), cost $${best.cost}, ${best.penalised ? "0.5 day delay" : "no delay"}.`,
  };
}

// ---- STAGE 2: Factory Loading ----
export interface PalletType {
  id: number;
  weight: "heavy" | "light";
}

export function generatePallets(seeds: number[]): PalletType[] {
  // 4 heavy, 6 light - random order
  const pallets: PalletType[] = [
    ...Array.from({ length: 4 }, (_, i) => ({ id: i, weight: "heavy" as const })),
    ...Array.from({ length: 6 }, (_, i) => ({ id: i + 4, weight: "light" as const })),
  ];
  // Fisher-Yates shuffle with seeds
  const arr = [...pallets];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seeds[i] * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function calcStage2Penalties(pallets: PalletType[], placement: number[]): number {
  // placement[i] = slot index (0-9), 0-4 = front (heavy zone), 5-9 = rear (light zone)
  let penalties = 0;
  pallets.forEach((pallet, i) => {
    const slot = placement[i];
    if (pallet.weight === "heavy" && slot >= 5) penalties++;
    if (pallet.weight === "light" && slot < 5) penalties++;
  });
  return penalties;
}

export function quantumStage2(pallets: PalletType[]): number[] {
  // Optimal: place heavy in slots 0-3, light in slots 4-9 (or similar zero-penalty arrangement)
  const heavySlots = [0, 1, 2, 3];
  const lightSlots = [4, 5, 6, 7, 8, 9];
  const placement: number[] = new Array(pallets.length);
  let hi = 0,
    li = 0;
  pallets.forEach((p, i) => {
    if (p.weight === "heavy") {
      placement[i] = heavySlots[hi++];
    } else {
      placement[i] = lightSlots[li++];
    }
  });
  return placement;
}

// ---- STAGE 3: Drayage to Port ----
export const STAGE3_ROUTES = {
  highway: {
    id: "highway",
    name: "Highway Route",
    speed: 80,
    distance: 900,
    toll: 150,
    extraHours: 0,
  },
  state: {
    id: "state",
    name: "State Roads",
    speed: 60,
    distance: 900,
    toll: 0,
    extraHours: 2,
  },
};

export function calcStage3(routeId: "highway" | "state"): {
  cost: number;
  time: number;
  overnight: boolean;
} {
  const route = STAGE3_ROUTES[routeId];
  const driveHours = route.distance / route.speed + route.extraHours;
  const overnight = driveHours > 10;
  const overnightCost = overnight ? 200 : 0;
  const overnightTime = overnight ? 0.5 : 0;
  const totalHours = driveHours;
  const transitDays = totalHours / 10 + overnightTime; // rough
  return {
    cost: route.toll + overnightCost,
    time: Math.ceil(totalHours / 10) * 0.5 + overnightTime,
    overnight,
  };
}

export function quantumStage3(): {
  choice: "highway" | "state";
  cost: number;
  time: number;
  message: string;
} {
  const hw = calcStage3("highway");
  const st = calcStage3("state");
  // Highway: $150 toll, no overnight (11.25h > 10h actually overnight)
  // Let's recalculate: 900/80 = 11.25h > 10h → overnight for highway too
  // So highway: $150 + $200 = $350, state: $0 + $200 = $200
  // Quantum picks state roads
  if (hw.cost < st.cost) {
    return {
      choice: "highway",
      cost: hw.cost,
      time: hw.time,
      message: `Highway route: $${hw.cost} total (toll + overnight), ${hw.time.toFixed(1)} days`,
    };
  }
  return {
    choice: "state",
    cost: st.cost,
    time: st.time,
    message: `State roads: $${st.cost} total (overnight stop, no toll), ${st.time.toFixed(1)} days`,
  };
}

// ---- STAGE 4: Container Yard Stacking ----
// 5 existing containers + 1 new (yours). Ship retrieves your container 3rd.
// Each unnecessary block above costs $80.

export function calcStage4Cost(position: number, retrievalOrder: number): number {
  // position: 0 = bottom, 5 = top of stack (6 items total including yours)
  // retrievalOrder: 3 means 2 containers are retrieved before yours
  // Containers above yours in stack need to be moved first
  const stackSize = 6; // including ours
  const itemsAbove = stackSize - 1 - position; // items above our container
  // Containers retrieved before ours that are above = extra reshuffles needed
  // Simplified: items above that shouldn't be above = reshuffles
  const reshuffles = Math.max(0, itemsAbove - (stackSize - retrievalOrder));
  return reshuffles * 80;
}

export function quantumStage4(retrievalOrder: number): {
  position: number;
  cost: number;
  message: string;
} {
  // Optimal: place container so items above = stackSize - retrievalOrder
  // retrievalOrder=3: we want 3 items above us so crane picks those first
  // stackSize=6, 3rd to be retrieved → 2 containers retrieved before ours → place at top-2
  const stackSize = 6;
  const optimalPosition = stackSize - 1 - (retrievalOrder - 1); // 0-indexed from bottom
  return {
    position: Math.max(0, Math.min(5, optimalPosition)),
    cost: 0,
    message: `Optimal position: slot ${optimalPosition + 1} from bottom — 0 reshuffles needed, saved $${calcStage4Cost(0, retrievalOrder) > 0 ? calcStage4Cost(0, retrievalOrder) : 160}.`,
  };
}

// ---- STAGE 5: Vessel Stowage ----
// 3x3 grid: 3 bays (columns), 3 tiers (rows, 0=bottom, 2=top)
// Rules: Heavy only bottom tier (row 0). Singapore-bound before further destinations.
// Your container: Singapore-bound, medium weight.

export type ContainerDest = "singapore" | "newyork";
export type ContainerWeight = "heavy" | "light" | "medium";

export interface StowageContainer {
  id: number;
  dest: ContainerDest;
  weight: ContainerWeight;
  isYours: boolean;
}

export function generateStowageContainers(seeds: number[]): StowageContainer[] {
  // 8 others + yours (id=0)
  const others: StowageContainer[] = [
    { id: 1, dest: "singapore", weight: "heavy", isYours: false },
    { id: 2, dest: "singapore", weight: "light", isYours: false },
    { id: 3, dest: "newyork", weight: "heavy", isYours: false },
    { id: 4, dest: "newyork", weight: "light", isYours: false },
    { id: 5, dest: "singapore", weight: "light", isYours: false },
    { id: 6, dest: "newyork", weight: "medium", isYours: false },
    { id: 7, dest: "singapore", weight: "medium", isYours: false },
    { id: 8, dest: "newyork", weight: "heavy", isYours: false },
  ];
  const yours: StowageContainer = { id: 0, dest: "singapore", weight: "medium", isYours: true };
  return [yours, ...others];
}

export function calcStowagePenalties(grid: (StowageContainer | null)[][]): number {
  // grid[tier][bay], tier 0=bottom, 2=top
  let penalties = 0;
  for (let tier = 0; tier < 3; tier++) {
    for (let bay = 0; bay < 3; bay++) {
      const c = grid[tier][bay];
      if (!c) continue;
      // Heavy must be bottom tier
      if (c.weight === "heavy" && tier !== 0) penalties++;
      // Singapore containers must not have newyork above them
      if (c.dest === "newyork" && tier < 2) {
        const above = grid[tier + 1][bay];
        if (above && above.dest === "singapore") penalties++;
      }
    }
  }
  return penalties;
}

export function quantumStowage(containers: StowageContainer[]): (StowageContainer | null)[][] {
  const grid: (StowageContainer | null)[][] = [
    [null, null, null],
    [null, null, null],
    [null, null, null],
  ];
  // Optimal placement:
  // Bottom tier: heavy containers
  // Middle: singapore light/medium
  // Top: newyork light/medium (loaded last, unloaded last)
  const heavy = containers.filter((c) => c.weight === "heavy");
  const sgpLight = containers.filter(
    (c) => c.weight !== "heavy" && c.dest === "singapore"
  );
  const nyLight = containers.filter(
    (c) => c.weight !== "heavy" && c.dest === "newyork"
  );

  let idx = 0;
  // Place heavy at bottom
  for (let bay = 0; bay < 3 && idx < heavy.length; bay++, idx++) {
    grid[0][bay] = heavy[idx];
  }
  // Place sgp light at mid/top accessible positions
  let sgpIdx = 0;
  for (let tier = 1; tier < 3 && sgpIdx < sgpLight.length; tier++) {
    for (let bay = 0; bay < 3 && sgpIdx < sgpLight.length; bay++) {
      if (!grid[tier][bay]) {
        grid[tier][bay] = sgpLight[sgpIdx++];
      }
    }
  }
  // Fill rest with ny
  let nyIdx = 0;
  for (let tier = 1; tier < 3 && nyIdx < nyLight.length; tier++) {
    for (let bay = 0; bay < 3 && nyIdx < nyLight.length; bay++) {
      if (!grid[tier][bay]) {
        grid[tier][bay] = nyLight[nyIdx++];
      }
    }
  }
  return grid;
}

// Route nodes for world map
export interface RouteNode {
  id: StageId;
  name: string;
  label: string;
  x: number; // percentage
  y: number; // percentage
  location: string;
}

export const ROUTE_NODES: RouteNode[] = [
  { id: 1, name: "Empty Container Pickup", label: "Delhi Depot", x: 62, y: 35, location: "Delhi, India" },
  { id: 2, name: "Factory Loading", label: "Factory", x: 64, y: 38, location: "Delhi, India" },
  { id: 3, name: "Drayage to Port", label: "Mundra Road", x: 60, y: 44, location: "Gujarat, India" },
  { id: 4, name: "Container Yard", label: "Mundra Port", x: 58, y: 46, location: "Mundra, India" },
  { id: 5, name: "Vessel Stowage", label: "Mundra → SG", x: 70, y: 55, location: "Indian Ocean" },
  { id: 6, name: "Transshipment Hub", label: "Singapore", x: 76, y: 58, location: "Singapore" },
  { id: 7, name: "Ocean Transit", label: "Pacific", x: 88, y: 48, location: "Pacific Ocean" },
  { id: 8, name: "NY Customs", label: "New York", x: 23, y: 32, location: "New York, USA" },
  { id: 9, name: "Rail Scheduling", label: "NY → Chicago Rail", x: 20, y: 30, location: "Eastern USA" },
  { id: 10, name: "Last-Mile Delivery", label: "Chicago", x: 18, y: 28, location: "Chicago, USA" },
];
