// Cross-Dock Sprint — assign inbound trucks to doors, schedule forklift moves
// Doors have real yard positions — forklift travel time depends on door→outbound distance
// Exhaustive combinatorial search with Grover's quantum speedup angle

export type InboundTruck = {
  id: string;
  name: string;
  arrival: number; // minutes from midnight
  pallets: PalletGroup[];
  color: string;
  emoji: string;
};

export type OutboundTruck = {
  id: string;
  name: string;
  departure: number;
  destination: string;
  neededPallets: number;
  color: string;
  /** Position in yard (meters from origin) */
  x: number;
};

export type PalletGroup = {
  destination: string;
  count: number;
};

/** A dock door in the yard */
export type Door = {
  index: number;   // 0-based door number
  label: string;   // "Door 1"
  x: number;       // position along the dock wall (meters)
};

export type DoorAssign = { inbound: InboundTruck; door: number };

export type ForkMove = {
  from: string;
  to: string;
  pallets: number;
  travelDist: number;  // meters
  travelTime: number;  // minutes
  startTime: number;
  endTime: number;
  forklift: number;
};

export type CrossDockResult = {
  doorAssignments: DoorAssign[];
  forkMoves: ForkMove[];
  allOnTime: boolean;
  totalTime: number;
  totalTravel: number;  // total meters traveled
  lateOutbound: string[];
  onTimeCount: number;
  totalOutbound: number;
};

export type Difficulty = "easy" | "medium" | "hard";

// Forklift: 200 m/min (≈12 km/h in yard), 1 min per pallet group handling
const FORK_SPEED = 200;    // meters per minute
const HANDLING_TIME = 1;   // minutes per move (hook/unhook)
const NUM_FORKLIFTS = 2;

// ── Yard layout ──────────────────────────────────────────────────────────────
// Doors are along the north wall (y=0), spaced every 20m starting at x=10
// Outbound lanes are along the south wall (y=60), positioned to match common destinations
// Forklifts travel Manhattan-style: |door.x - lane.x| + 60m (north→south)

function travelDist(doorX: number, laneX: number): number {
  return Math.abs(doorX - laneX) + 60;
}

function travelTime(dist: number): number {
  return dist / FORK_SPEED + HANDLING_TIME;
}

// ── Data pools ───────────────────────────────────────────────────────────────

const INBOUND_POOL: InboundTruck[] = [
  {
    id: "X", name: "Truck X", arrival: 6 * 60,
    pallets: [
      { destination: "A", count: 5 },
      { destination: "B", count: 2 },
      { destination: "C", count: 3 },
    ],
    color: "#ef4444", emoji: "🔴",
  },
  {
    id: "Y", name: "Truck Y", arrival: 6 * 60 + 10,
    pallets: [
      { destination: "A", count: 2 },
      { destination: "B", count: 4 },
      { destination: "D", count: 3 },
    ],
    color: "#3b82f6", emoji: "🔵",
  },
  {
    id: "Z", name: "Truck Z", arrival: 6 * 60 + 25,
    pallets: [
      { destination: "C", count: 4 },
      { destination: "D", count: 3 },
      { destination: "A", count: 1 },
    ],
    color: "#22c55e", emoji: "🟢",
  },
  {
    id: "W", name: "Truck W", arrival: 6 * 60 + 15,
    pallets: [
      { destination: "B", count: 3 },
      { destination: "C", count: 2 },
      { destination: "D", count: 2 },
      { destination: "A", count: 1 },
    ],
    color: "#eab308", emoji: "🟡",
  },
  {
    id: "V", name: "Truck V", arrival: 6 * 60 + 35,
    pallets: [
      { destination: "A", count: 3 },
      { destination: "B", count: 2 },
      { destination: "D", count: 4 },
    ],
    color: "#f97316", emoji: "🟠",
  },
];

const OUTBOUND_POOL: OutboundTruck[] = [
  { id: "A", name: "Outbound A", departure: 8 * 60,       destination: "A", neededPallets: 8,  color: "#ef4444", x: 10 },
  { id: "B", name: "Outbound B", departure: 8 * 60 + 20,  destination: "B", neededPallets: 6,  color: "#22c55e", x: 30 },
  { id: "C", name: "Outbound C", departure: 8 * 60 + 40,  destination: "C", neededPallets: 7,  color: "#a855f7", x: 50 },
  { id: "D", name: "Outbound D", departure: 9 * 60,       destination: "D", neededPallets: 7,  color: "#eab308", x: 70 },
  { id: "E", name: "Outbound E", departure: 8 * 60 + 50,  destination: "A", neededPallets: 4,  color: "#ef4444", x: 15 },
  { id: "F", name: "Outbound F", departure: 9 * 60 + 10,  destination: "D", neededPallets: 5,  color: "#eab308", x: 65 },
];

// ── Config per difficulty ────────────────────────────────────────────────────

export type CrossDockConfig = {
  difficulty: Difficulty;
  label: string;
  desc: string;
  trucks: InboundTruck[];
  outbound: OutboundTruck[];
  doors: Door[];
  totalPermutations: number;
};

function makeDoors(count: number): Door[] {
  // Doors spaced along the dock wall at x = 10, 30, 50, 70, 90
  return Array.from({ length: count }, (_, i) => ({
    index: i,
    label: `Door ${i + 1}`,
    x: 10 + i * 20,
  }));
}

export function getConfig(difficulty: Difficulty): CrossDockConfig {
  switch (difficulty) {
    case "easy":
      return {
        difficulty: "easy",
        label: "🟢 Easy",
        desc: "3 trucks, 4 doors — learn the yard",
        trucks: INBOUND_POOL.slice(0, 3),
        outbound: OUTBOUND_POOL.slice(0, 4),
        doors: makeDoors(4),
        totalPermutations: 24,  // P(4,3) = 24
      };
    case "medium":
      return {
        difficulty: "medium",
        label: "🟡 Medium",
        desc: "4 trucks, 5 doors — think about distances",
        trucks: INBOUND_POOL.slice(0, 4),
        outbound: OUTBOUND_POOL.slice(0, 5),
        doors: makeDoors(5),
        totalPermutations: 120, // P(5,4) = 120
      };
    case "hard":
      return {
        difficulty: "hard",
        label: "🔴 Hard",
        desc: "5 trucks, 6 doors — tight windows, long hauls",
        trucks: INBOUND_POOL.slice(0, 5),
        outbound: OUTBOUND_POOL.slice(0, 6),
        doors: makeDoors(6),
        totalPermutations: 720, // P(6,5) = 720
      };
  }
}

// Legacy compat
export const INBOUND = INBOUND_POOL.slice(0, 2);
export const OUTBOUND = OUTBOUND_POOL.slice(0, 4);

// ── Simulate ─────────────────────────────────────────────────────────────────

export function simulate(
  doorAssign: DoorAssign[],
  outbound: OutboundTruck[],
  doors: Door[],
  outboundOrder?: string[],  // if provided, process outbound trucks in this order
): CrossDockResult {
  const forkMoves: ForkMove[] = [];
  const forkFree = Array(NUM_FORKLIFTS).fill(6 * 60);
  const lateOutbound: string[] = [];
  let onTimeCount = 0;
  let totalTravel = 0;

  // Build door lookup
  const doorMap = new Map<number, Door>();
  for (const d of doors) doorMap.set(d.index, d);

  // Build inbound→door lookup
  const truckDoor = new Map<string, number>();
  for (const da of doorAssign) truckDoor.set(da.inbound.id, da.door);

  // Process outbound trucks in specified order (or default order)
  const processOrder = outboundOrder ?? outbound.map((o) => o.id);
  const outboundMap = new Map(outbound.map((o) => [o.id, o]));

  for (const obId of processOrder) {
    const ob = outboundMap.get(obId);
    if (!ob) continue;

    let palletsNeeded = ob.neededPallets;
    let lastMove: ForkMove | null = null;

    for (const da of doorAssign) {
      if (palletsNeeded <= 0) break;
      const group = da.inbound.pallets.find((p) => p.destination === ob.destination);
      if (!group || group.count === 0) continue;

      const pallets = Math.min(group.count, palletsNeeded);
      const door = doorMap.get(da.door)!;
      const dist = travelDist(door.x, ob.x);
      const tTime = travelTime(dist);

      // Pick least busy forklift
      let fi = 0;
      for (let f = 1; f < NUM_FORKLIFTS; f++) {
        if (forkFree[f] < forkFree[fi]) fi = f;
      }
      const startTime = Math.max(forkFree[fi], da.inbound.arrival);
      const endTime = startTime + tTime;
      forkFree[fi] = endTime;
      totalTravel += dist;

      forkMoves.push({
        from: door.label,
        to: ob.id,
        pallets,
        travelDist: dist,
        travelTime: tTime,
        startTime,
        endTime,
        forklift: fi,
      });
      lastMove = { from: door.label, to: ob.id, pallets, travelDist: dist, travelTime: tTime, startTime, endTime, forklift: fi };
      palletsNeeded -= pallets;
    }

    if (lastMove && lastMove.endTime > ob.departure) {
      lateOutbound.push(ob.name);
    } else {
      onTimeCount++;
    }
  }

  const totalTime = forkMoves.length > 0 ? Math.max(...forkMoves.map((m) => m.endTime)) : 0;
  return {
    doorAssignments: doorAssign,
    forkMoves,
    allOnTime: lateOutbound.length === 0,
    totalTime,
    totalTravel,
    lateOutbound,
    onTimeCount,
    totalOutbound: outbound.length,
  };
}

// ── Exhaustive optimal solver ────────────────────────────────────────────────

function* permuteDoors(trucks: InboundTruck[], numDoors: number): Generator<DoorAssign[]> {
  function* helper(idx: number, used: Set<number>, current: DoorAssign[]): Generator<DoorAssign[]> {
    if (idx === trucks.length) {
      yield [...current];
      return;
    }
    for (let d = 0; d < numDoors; d++) {
      if (used.has(d)) continue;
      used.add(d);
      current.push({ inbound: trucks[idx], door: d });
      yield* helper(idx + 1, used, current);
      current.pop();
      used.delete(d);
    }
  }
  yield* helper(0, new Set(), []);
}

export type SolveResult = {
  result: CrossDockResult;
  totalChecked: number;
};

function scoreResult(r: CrossDockResult): number {
  // Primary: maximize on-time. Secondary: minimize total travel distance.
  const latePenalty = (r.totalOutbound - r.onTimeCount) * 100000;
  return r.totalTravel + latePenalty;
}

export function solveCrossDockExhaustive(config: CrossDockConfig): SolveResult {
  let best: CrossDockResult | null = null;
  let bestScore = Infinity;
  let totalChecked = 0;

  for (const assignment of permuteDoors(config.trucks, config.doors.length)) {
    totalChecked++;
    const r = simulate(assignment, config.outbound, config.doors);
    const s = scoreResult(r);
    if (s < bestScore) {
      bestScore = s;
      best = r;
    }
  }

  return { result: best!, totalChecked };
}

// Legacy
export function solveCrossDock(): CrossDockResult {
  const cfg = getConfig("easy");
  return solveCrossDockExhaustive(cfg).result;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function fmt(min: number): string {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function fmtDuration(min: number): string {
  if (min < 60) return `${Math.round(min)}m`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function fmtDist(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)}km`;
  return `${Math.round(meters)}m`;
}

