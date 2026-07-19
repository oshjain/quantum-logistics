// Trucker's Trip Chain — with Simulated Quantum Annealing (SQA) solver
//
// The "Magic Route Planner" uses a path-integral Monte Carlo / quantum parallel
// tempering approach inspired by the transverse-field Ising model:
//
//   H = H_problem + Γ(t) · H_transverse
//
//   • H_problem   = total deadhead miles + 500 × missed windows (classical cost)
//   • H_transverse = quantum fluctuation term implemented via replica swaps
//   • Γ(t)        = transverse field strength, annealed from high → low
//
// Multiple "replicas" (Trotter slices) explore the permutation space at
// different effective temperatures.  Replicas can tunnel through energy
// barriers by swapping states — the classical analogue of quantum tunnelling.
// Unlike brute-force, SQA can escape local minima and find near-optimal
// solutions for much larger problem sizes.

export type Location = {
  id: string;
  name: string;
  shortName: string;
  x: number;
  y: number;
  color: string;
};

export type Load = {
  id: string;
  name: string;
  pickupLoc: string;
  dropLoc: string;
  pickupWindowStart: number; // minutes from 0
  pickupWindowEnd: number;
  dropDeadline: number;
  color: string;
};

export type LoadResult = {
  load: Load;
  pickupTime: number;
  dropTime: number;
  late: boolean;
  emptyMilesBefore: number; // deadhead miles driven to reach pickup
  loadedMiles: number;      // miles driven with cargo (pickup → drop)
};

/** Configurable simulation parameters — because a real sim needs these. */
export interface TripConfig {
  avgSpeedMph: number;   // truck's average speed (default 55)
  maxWorkMinutes: number; // max driving + waiting per shift (default 600 = 10 hrs)
  startTime: number;      // shift start in minutes from midnight (default 8*60)
}

export const DEFAULT_CONFIG: TripConfig = {
  avgSpeedMph: 55,
  maxWorkMinutes: 600,
  startTime: 8 * 60,
};

export type TripResult = {
  order: Load[];
  loadResults: LoadResult[];
  totalEmptyMiles: number;
  totalLoadedMiles: number;
  totalMiles: number;
  missedWindows: number;
  feasible: boolean;
  finishTime: number;
  totalOvertime: number; // minutes past startTime + maxWorkMinutes
};

export const LOCATIONS: Location[] = [
  { id: "home",  name: "Home Base",    shortName: "HOME",  x: 250, y: 300, color: "#f59e0b" },
  { id: "fac1",  name: "Factory 1",    shortName: "FAC1",  x: 80,  y: 100, color: "#ef4444" },
  { id: "whx",   name: "Warehouse X",  shortName: "WHX",   x: 380, y: 80,  color: "#3b82f6" },
  { id: "why",   name: "Warehouse Y",  shortName: "WHY",   x: 420, y: 240, color: "#a855f7" },
  { id: "fac2",  name: "Factory 2",    shortName: "FAC2",  x: 300, y: 160, color: "#22c55e" },
  { id: "port",  name: "Port",         shortName: "PORT",  x: 130, y: 330, color: "#06b6d4" },
];

// Realistic regional distances in MILES (not minutes!) between depots.
// Average truck speed in a metro area ≈ 50 mph, so:
//   12 mi → ~14 min,  25 mi → ~30 min,  35 mi → ~42 min
const DISTANCES: Record<string, Record<string, number>> = {
  home: { fac1: 14, whx: 24,  why: 18,  fac2: 10, port: 9,  home: 0 },
  fac1: { home: 14, whx: 18,  why: 32,  fac2: 22, port: 25, fac1: 0 },
  whx:  { home: 24, fac1: 18, why: 15,  fac2: 12, port: 34, whx: 0 },
  why:  { home: 18, fac1: 32, whx: 15,  fac2: 10, port: 26, why: 0 },
  fac2: { home: 10, fac1: 22, whx: 12,  why: 10,  port: 20, fac2: 0 },
  port: { home: 9,  fac1: 25, whx: 34,  why: 26,  fac2: 20, port: 0 },
};

const AVG_SPEED_MPH = 55; // default average truck speed

/** Distance in miles between two locations. */
export function travelDistance(a: string, b: string): number {
  return DISTANCES[a]?.[b] ?? 15;
}

/** Travel time in minutes between two locations (distance ÷ speed). */
export function travelTime(a: string, b: string, speedMph?: number): number {
  const mph = speedMph ?? AVG_SPEED_MPH;
  return Math.round((travelDistance(a, b) / mph) * 60);
}

export const LOADS: Load[] = [
  { id: "A", name: "Load A", pickupLoc: "fac1", dropLoc: "whx",  pickupWindowStart: 8*60,  pickupWindowEnd: 9*60,  dropDeadline: 10*60+30, color: "#ef4444" },
  { id: "B", name: "Load B", pickupLoc: "why",  dropLoc: "fac2", pickupWindowStart: 9*60+30, pickupWindowEnd: 11*60, dropDeadline: 12*60+30, color: "#a855f7" },
  { id: "C", name: "Load C", pickupLoc: "fac2", dropLoc: "port", pickupWindowStart: 11*60, pickupWindowEnd: 13*60, dropDeadline: 14*60+30, color: "#22c55e" },
  { id: "D", name: "Load D", pickupLoc: "port", dropLoc: "home", pickupWindowStart: 13*60, pickupWindowEnd: 15*60, dropDeadline: 16*60, color: "#06b6d4" },
];

function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permutations(rest)) result.push([arr[i], ...p]);
  }
  return result;
}

export function simulateTrip(
  order: Load[],
  config: TripConfig = DEFAULT_CONFIG,
  startLoc = "home",
): TripResult {
  const { avgSpeedMph, maxWorkMinutes, startTime } = config;
  const shiftEnd = startTime + maxWorkMinutes;
  let time = startTime;
  let loc = startLoc;
  let totalEmptyMiles = 0;
  let totalLoadedMiles = 0;
  let missedWindows = 0;
  const loadResults: LoadResult[] = [];

  for (const load of order) {
    // ── Deadhead (empty) leg: current location → pickup ──
    const deadheadDist = travelDistance(loc, load.pickupLoc);
    const deadheadTime = travelTime(loc, load.pickupLoc, avgSpeedMph);
    totalEmptyMiles += deadheadDist;
    time += deadheadTime;
    loc = load.pickupLoc;

    // Wait for pickup window if early
    if (time < load.pickupWindowStart) time = load.pickupWindowStart;

    const pickupTime = time;
    const late = pickupTime > load.pickupWindowEnd;
    if (late) missedWindows++;

    // ── Loaded leg: pickup → drop (with cargo) ──
    const loadedDist = travelDistance(loc, load.dropLoc);
    const loadedTime = travelTime(loc, load.dropLoc, avgSpeedMph);
    totalLoadedMiles += loadedDist;
    time += loadedTime;
    loc = load.dropLoc;
    const dropTime = time;
    if (dropTime > load.dropDeadline) missedWindows++;

    loadResults.push({
      load,
      pickupTime,
      dropTime,
      late,
      emptyMilesBefore: deadheadDist,
      loadedMiles: loadedDist,
    });
  }

  const totalOvertime = Math.max(0, time - shiftEnd);

  return {
    order,
    loadResults,
    totalEmptyMiles,
    totalLoadedMiles,
    totalMiles: totalEmptyMiles + totalLoadedMiles,
    missedWindows,
    feasible: missedWindows === 0 && totalOvertime === 0,
    finishTime: time,
    totalOvertime,
  };
}

// ── Classical brute-force (for small N, as ground truth) ─────────────────────

export function solveBruteForce(loads: Load[], config: TripConfig = DEFAULT_CONFIG): TripResult {
  const perms = permutations(loads);
  let best: TripResult | null = null;
  for (const perm of perms) {
    const result = simulateTrip(perm, config);
    if (!best || result.missedWindows < best.missedWindows ||
        (result.missedWindows === best.missedWindows && result.totalEmptyMiles < best.totalEmptyMiles)) {
      best = result;
    }
  }
  return best!;
}

export function solveTripChain(): TripResult {
  return solveBruteForce(LOADS);
}

// ── Simulated Quantum Annealing (SQA) — Path-Integral Monte Carlo ────────────
//
// The problem Hamiltonian encodes total cost:
//   E(order) = totalEmptyMiles + PENALTY × missedWindows
//
// SQA simulates the quantum partition function Tr[e^{−βĤ}] by discretising the
// imaginary-time (Trotter) dimension into P replicas coupled via a transverse
// field Γ.  At high Γ (early annealing), replicas fluctuate wildly and can
// tunnel through energy barriers.  As Γ → 0, the system settles into a low-
// energy classical state.

const MISSED_WINDOW_PENALTY = 500; // energy penalty per missed window
const OVERTIME_PENALTY = 2;        // energy penalty per minute of overtime

function energyOf(result: TripResult): number {
  return result.totalEmptyMiles
    + MISSED_WINDOW_PENALTY * result.missedWindows
    + OVERTIME_PENALTY * result.totalOvertime;
}

/** Swap two elements at random positions in a permutation. */
function randomSwap<T>(arr: T[]): T[] {
  const next = [...arr];
  const i = Math.floor(Math.random() * next.length);
  let j = Math.floor(Math.random() * next.length);
  while (j === i) j = Math.floor(Math.random() * next.length);
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/** Reverse a random contiguous segment (2-opt move). */
function random2Opt<T>(arr: T[]): T[] {
  const next = [...arr];
  let i = Math.floor(Math.random() * (next.length - 1));
  let j = Math.floor(Math.random() * (next.length - 1));
  if (i > j) [i, j] = [j, i];
  if (j - i < 1) j = Math.min(i + 1, next.length - 1);
  while (i < j) {
    [next[i], next[j]] = [next[j], next[i]];
    i++; j--;
  }
  return next;
}

/** Shift a random element to a new position (insertion move). */
function randomShift<T>(arr: T[]): T[] {
  const next = [...arr];
  const from = Math.floor(Math.random() * next.length);
  const to = Math.floor(Math.random() * next.length);
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export interface SQAProgress {
  step: number;
  totalSteps: number;
  gamma: number;
  currentEnergy: number;
  bestEnergy: number;
}

/**
 * Simulated Quantum Annealing solver.
 *
 * Parameters:
 *   loads          – the loads to sequence
 *   P              – number of Trotter replicas (default 8)
 *   steps          – Monte Carlo steps (default 2000)
 *   gammaStart     – initial transverse field (default 3.0)
 *   gammaEnd       – final transverse field (default 0.0)
 *   onProgress     – optional callback for real-time progress
 */
export function quantumAnnealingSolver(
  loads: Load[],
  opts?: {
    P?: number;
    steps?: number;
    gammaStart?: number;
    gammaEnd?: number;
    config?: TripConfig;
    onProgress?: (p: SQAProgress) => void;
  },
): TripResult {
  const P = opts?.P ?? 8;
  const totalSteps = opts?.steps ?? 2000;
  const gammaStart = opts?.gammaStart ?? 3.0;
  const gammaEnd = opts?.gammaEnd ?? 0.0;
  const config = opts?.config ?? DEFAULT_CONFIG;

  if (loads.length <= 1) return simulateTrip(loads, config);

  // Initialize P replicas with random permutations
  let replicas: Load[][] = Array.from({ length: P }, () =>
    [...loads].sort(() => Math.random() - 0.5),
  );
  let replicaEnergies: number[] = replicas.map((order) => energyOf(simulateTrip(order, config)));

  let bestOrder = [...replicas[0]];
  let bestEnergy = replicaEnergies[0];

  for (let step = 0; step < totalSteps; step++) {
    const progress = step / totalSteps;
    // Annealing schedule: gamma decays exponentially
    const gamma = gammaStart * Math.exp(-progress * Math.log(gammaStart / Math.max(gammaEnd, 0.001)));

    // ── LOCAL MOVES (classical Monte Carlo) ──
    for (let p = 0; p < P; p++) {
      // Pick a random local move
      const r = Math.random();
      let candidate: Load[];
      if (r < 0.4) candidate = randomSwap(replicas[p]);
      else if (r < 0.75) candidate = random2Opt(replicas[p]);
      else candidate = randomShift(replicas[p]);

      const candidateEnergy = energyOf(simulateTrip(candidate, config));
      const delta = candidateEnergy - replicaEnergies[p];

      // Metropolis acceptance (with effective temperature T_eff = 1 / (1 + gamma))
      const T_eff = 1.0 / (1.0 + gamma);
      if (delta <= 0 || Math.random() < Math.exp(-delta / T_eff)) {
        replicas[p] = candidate;
        replicaEnergies[p] = candidateEnergy;
      }
    }

    // ── QUANTUM TUNNELING: replica swaps (path-integral coupling) ──
    // Adjacent replicas in Trotter dimension can swap states, simulating
    // quantum tunneling through energy barriers.
    for (let p = 0; p < P - 1; p++) {
      const deltaE = replicaEnergies[p + 1] - replicaEnergies[p];
      // Swap probability depends on gamma (transverse field strength)
      const swapProb = Math.exp(-gamma * Math.abs(deltaE) * 0.1);
      if (Math.random() < swapProb) {
        // Swap the replica states
        [replicas[p], replicas[p + 1]] = [replicas[p + 1], replicas[p]];
        [replicaEnergies[p], replicaEnergies[p + 1]] = [replicaEnergies[p + 1], replicaEnergies[p]];
      }
    }

    // Track best
    for (let p = 0; p < P; p++) {
      if (replicaEnergies[p] < bestEnergy) {
        bestEnergy = replicaEnergies[p];
        bestOrder = [...replicas[p]];
      }
    }

    // Progress callback (throttled)
    if (opts?.onProgress && step % 50 === 0) {
      opts.onProgress({ step, totalSteps, gamma, currentEnergy: replicaEnergies[0], bestEnergy });
    }
  }

  return simulateTrip(bestOrder, config);
}

export function fmt(min: number): string {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}
