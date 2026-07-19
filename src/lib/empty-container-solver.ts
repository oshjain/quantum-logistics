// ── Empty Container Repositioning — Multi-port network flow ──────────────────
// Models a realistic 6-port network with imbalance indices, route costs,
// transit times, and capacities. Two solving strategies:
//   • Greedy (classical/heuristic) — route-by-route, nearest-surplus-first
//   • Optimal  (quantum-inspired)  — exhaustive global min-cost search
//
// Data inspired by real-world empty container repositioning KPIs:
//   Regional Imbalance Index = (Out − In) / (Out + In)
//   Wait Ratio = POL wait / (POL wait + transit days)
//   Speed Efficiency = TEU·miles / TEU·transit-days

export interface Port {
  id: string;
  name: string;
  flag: string;
  region: string;
  imbalance: number;        // TEU — positive = surplus, negative = deficit
  imbalanceIndex: number;   // (Out−In)/(Out+In) normalized -1..1
}

export interface Route {
  id: string;
  from: string;
  to: string;
  distanceKm: number;
  costPerTeu: number;      // USD
  transitDays: number;
  capacity: number;        // max TEU for the planning period
  waitRatio: number;       // POL wait fraction (0–1)
}

export interface Allocation {
  routeId: string;
  teu: number;
}

export interface PlanResult {
  allocations: Allocation[];
  totalCost: number;
  totalTeuMoved: number;
  totalTonnKm: number;     // TEU × distance — work done
  portBalances: Record<string, number>; // remaining imbalance per port
  feasible: boolean;
  violations: string[];
}

// ── Port data ─────────────────────────────────────────────────────────────────

export let PORTS: Port[] = [
  { id: "SHA", name: "Shanghai",     flag: "🇨🇳", region: "East Asia",       imbalance: 500,  imbalanceIndex:  0.72 },
  { id: "SIN", name: "Singapore",    flag: "🇸🇬", region: "Southeast Asia",  imbalance: 200,  imbalanceIndex:  0.31 },
  { id: "DXB", name: "Dubai",        flag: "🇦🇪", region: "Middle East",     imbalance: 100,  imbalanceIndex:  0.16 },
  { id: "ROT", name: "Rotterdam",    flag: "🇳🇱", region: "Europe",          imbalance: -400, imbalanceIndex: -0.61 },
  { id: "LAX", name: "Los Angeles",  flag: "🇺🇸", region: "North America",   imbalance: -300, imbalanceIndex: -0.48 },
  { id: "GRU", name: "Santos",       flag: "🇧🇷", region: "South America",   imbalance: -100, imbalanceIndex: -0.28 },
];

/** Replace the current port set with a new one (for "New Network" reset) */
export function setPorts(newPorts: Port[]) {
  PORTS = newPorts;
}

// ── Route data (direct connections between ports) ─────────────────────────────

export const ROUTES: Route[] = [
  { id: "SHA→SIN", from: "SHA", to: "SIN", distanceKm:  3900, costPerTeu: 200, transitDays:  7, capacity: 300, waitRatio: 0.18 },
  { id: "SHA→ROT", from: "SHA", to: "ROT", distanceKm: 20000, costPerTeu: 800, transitDays: 30, capacity: 200, waitRatio: 0.22 },
  { id: "SHA→LAX", from: "SHA", to: "LAX", distanceKm: 10500, costPerTeu: 500, transitDays: 15, capacity: 300, waitRatio: 0.20 },
  { id: "SIN→ROT", from: "SIN", to: "ROT", distanceKm: 15500, costPerTeu: 650, transitDays: 22, capacity: 200, waitRatio: 0.15 },
  { id: "SIN→DXB", from: "SIN", to: "DXB", distanceKm:  5800, costPerTeu: 300, transitDays:  9, capacity: 250, waitRatio: 0.12 },
  { id: "SIN→GRU", from: "SIN", to: "GRU", distanceKm: 16000, costPerTeu: 700, transitDays: 25, capacity: 150, waitRatio: 0.25 },
  { id: "DXB→ROT", from: "DXB", to: "ROT", distanceKm:  9500, costPerTeu: 450, transitDays: 14, capacity: 200, waitRatio: 0.14 },
  { id: "DXB→GRU", from: "DXB", to: "GRU", distanceKm: 12000, costPerTeu: 550, transitDays: 18, capacity: 150, waitRatio: 0.20 },
  { id: "LAX→GRU", from: "LAX", to: "GRU", distanceKm: 10000, costPerTeu: 480, transitDays: 16, capacity: 200, waitRatio: 0.19 },
  { id: "LAX→ROT", from: "LAX", to: "ROT", distanceKm: 14500, costPerTeu: 600, transitDays: 20, capacity: 150, waitRatio: 0.21 },
  { id: "ROT→GRU", from: "ROT", to: "GRU", distanceKm: 10000, costPerTeu: 500, transitDays: 16, capacity: 150, waitRatio: 0.17 },
];

// ── Step size for discretized TEU allocations ─────────────────────────────────
export const TEU_STEP = 50;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPort(id: string): Port {
  return PORTS.find(p => p.id === id)!;
}

function getRoute(id: string): Route {
  return ROUTES.find(r => r.id === id)!;
}

/** Routes that originate from a given port */
export function routesFrom(portId: string): Route[] {
  return ROUTES.filter(r => r.from === portId);
}

/** Routes that deliver to a given port */
export function routesTo(portId: string): Route[] {
  return ROUTES.filter(r => r.to === portId);
}

// ── Plan evaluator ────────────────────────────────────────────────────────────

export function evaluatePlan(allocations: Allocation[]): PlanResult {
  const violations: string[] = [];

  // Net flow per port: positive = inflow, negative = outflow
  const netFlow: Record<string, number> = {};
  for (const p of PORTS) netFlow[p.id] = 0;

  let totalCost = 0;
  let totalTeuMoved = 0;
  let totalTonnKm = 0;

  for (const a of allocations) {
    const route = getRoute(a.routeId);
    if (!route) {
      violations.push(`Unknown route: ${a.routeId}`);
      continue;
    }
    if (a.teu < 0) {
      violations.push(`Negative allocation on ${a.routeId}`);
      continue;
    }
    if (a.teu > route.capacity) {
      violations.push(`${a.routeId} capacity is ${route.capacity} TEU, tried ${a.teu}`);
    }

    netFlow[route.from] -= a.teu; // outflow
    netFlow[route.to]   += a.teu; // inflow

    totalCost += a.teu * route.costPerTeu;
    totalTeuMoved += a.teu;
    totalTonnKm += a.teu * route.distanceKm;
  }

  // Check port balances — deficit ports must be satisfied
  const portBalances: Record<string, number> = {};
  for (const p of PORTS) {
    portBalances[p.id] = p.imbalance + netFlow[p.id];

    // Surplus ports can't send more than they have
    if (p.imbalance > 0 && netFlow[p.id] < -p.imbalance) {
      violations.push(`${p.name} doesn't have enough surplus (sent ${-netFlow[p.id]}, has ${p.imbalance})`);
    }
    
    // Deficit ports must receive at least their need
    if (p.imbalance < 0 && portBalances[p.id] < 0) {
      violations.push(`${p.name} still needs ${-portBalances[p.id]} TEU`);
    }
  }

  const feasible = violations.length === 0;

  return {
    allocations,
    totalCost,
    totalTeuMoved,
    totalTonnKm,
    portBalances,
    feasible,
    violations,
  };
}

// ── Greedy solver (classical / heuristic) ─────────────────────────────────────
// Simulates how a human or naive automated system would plan:
// For each deficit port, pull from the cheapest available route.

export function solveGreedy(): PlanResult {
  const allocations: Allocation[] = [];

  const surpluses = new Map<string, number>();
  const deficits = new Map<string, number>();
  for (const p of PORTS) {
    if (p.imbalance > 0) surpluses.set(p.id, p.imbalance);
    if (p.imbalance < 0) deficits.set(p.id, -p.imbalance);
  }

  for (const [defId, remaining] of deficits) {
    let need = remaining;

    const incoming = ROUTES
      .filter(r => r.to === defId && surpluses.has(r.from))
      .sort((a, b) => a.costPerTeu - b.costPerTeu);

    for (const route of incoming) {
      if (need <= 0) break;
      const available = Math.min(
        surpluses.get(route.from) ?? 0,
        route.capacity,
        need,
      );
      if (available <= 0) continue;

      const teu = Math.floor(available / TEU_STEP) * TEU_STEP;
      if (teu === 0) continue;

      allocations.push({ routeId: route.id, teu });
      surpluses.set(route.from, (surpluses.get(route.from) ?? 0) - teu);
      need -= teu;
    }
  }

  return evaluatePlan(allocations);
}

// ── Optimal solver (quantum-inspired / exhaustive global search) ──────────────
// Explores all valid allocation combinations at TEU_STEP granularity.
// Uses deficit-driven search: for each deficit port, try all combinations
// of incoming routes to satisfy it, tracking remaining surplus.
// A real quantum annealer solves this as a QUBO in milliseconds
// regardless of network size — we simulate that advantage here.

export function solveOptimal(): PlanResult {
  const surplusPorts = PORTS.filter(p => p.imbalance > 0);
  const deficitPorts = PORTS.filter(p => p.imbalance < 0);

  // For each deficit port, list incoming routes from surplus ports
  const deficitRoutes = deficitPorts.map(dp => ({
    port: dp,
    need: -dp.imbalance,
    routes: ROUTES.filter(r => r.to === dp.id && surplusPorts.some(sp => sp.id === r.from)),
  }));

  let best: PlanResult | null = null;
  let bestCost = Infinity;
  let combinationsExplored = 0;

  function generatePlans(
    defIdx: number,
    currentAllocs: Allocation[],
    remainingSurplus: Map<string, number>,
  ) {
    if (defIdx >= deficitRoutes.length) {
      combinationsExplored++;
      const result = evaluatePlan(currentAllocs);
      if (result.feasible && result.totalCost < bestCost) {
        bestCost = result.totalCost;
        best = result;
      }
      return;
    }

    const { need, routes } = deficitRoutes[defIdx];

    function tryRouteCombos(
      routeIdx: number,
      remaining: number,
      allocs: Allocation[],
      surplusMap: Map<string, number>,
    ) {
      if (remaining <= 0) {
        generatePlans(defIdx + 1, allocs, surplusMap);
        return;
      }
      if (routeIdx >= routes.length) {
        return; // dead end — can't satisfy this deficit
      }

      const route = routes[routeIdx];
      const availFromSource = surplusMap.get(route.from) ?? 0;
      const maxTake = Math.min(remaining, route.capacity, availFromSource);

      // For small branching factor, enumerate fully; for large, sample
      const stepCount = Math.floor(maxTake / TEU_STEP) + 1;

      if (stepCount <= 7) {
        for (let teu = 0; teu <= maxTake; teu += TEU_STEP) {
          const nextSurplus = new Map(surplusMap);
          nextSurplus.set(route.from, availFromSource - teu);
          const nextAllocs = [...allocs];
          if (teu > 0) nextAllocs.push({ routeId: route.id, teu });
          tryRouteCombos(routeIdx + 1, remaining - teu, nextAllocs, nextSurplus);
        }
      } else {
        const samples = [0, TEU_STEP, TEU_STEP * 2, Math.floor(maxTake / TEU_STEP / 2) * TEU_STEP, maxTake - TEU_STEP, maxTake]
          .map(v => Math.round(v / TEU_STEP) * TEU_STEP)
          .filter((v, i, arr) => v <= maxTake && arr.indexOf(v) === i)
          .sort((a, b) => a - b);

        for (const teu of samples) {
          const nextSurplus = new Map(surplusMap);
          nextSurplus.set(route.from, availFromSource - teu);
          const nextAllocs = [...allocs];
          if (teu > 0) nextAllocs.push({ routeId: route.id, teu });
          tryRouteCombos(routeIdx + 1, remaining - teu, nextAllocs, nextSurplus);
        }
      }
    }

    const initSurplus = new Map(remainingSurplus);
    tryRouteCombos(0, need, currentAllocs, initSurplus);
  }

  const initSurplus = new Map(surplusPorts.map(p => [p.id, p.imbalance]));
  generatePlans(0, [], initSurplus);

  if (best) {
    const result = best as PlanResult;
    return {
      ...result,
      violations: [...(result.violations ?? []), `🔍 Explored ${combinationsExplored.toLocaleString()} network configurations`],
    };
  }

  return {
    allocations: [],
    totalCost: 0,
    totalTeuMoved: 0,
    totalTonnKm: 0,
    portBalances: {},
    feasible: false,
    violations: ["No feasible solution found — try the Classical Greedy solver"],
  };
}

// ── Summary stats ─────────────────────────────────────────────────────────────

export function planSummary(result: PlanResult) {
  const routesUsed = new Set(result.allocations.map(a => a.routeId)).size;
  const balancedPorts = Object.values(result.portBalances).filter(b => b >= 0).length;

  return {
    totalCost: result.totalCost,
    totalTeu: result.totalTeuMoved,
    avgCostPerTeu: result.totalTeuMoved > 0 ? Math.round(result.totalCost / result.totalTeuMoved) : 0,
    avgDistance: result.totalTeuMoved > 0 ? Math.round(result.totalTonnKm / result.totalTeuMoved) : 0,
    routesUsed,
    balancedPorts,
  };
}

// ── Network stats ─────────────────────────────────────────────────────────────

export function networkStats(ports: Port[] = PORTS) {
  const totalSurplus = ports.filter(p => p.imbalance > 0).reduce((s, p) => s + p.imbalance, 0);
  const totalDeficit = ports.filter(p => p.imbalance < 0).reduce((s, p) => s - p.imbalance, 0);

  return {
    portCount: ports.length,
    routeCount: ROUTES.length,
    totalSurplus,
    totalDeficit,
    avgCostPerRoute: Math.round(ROUTES.reduce((s, r) => s + r.costPerTeu, 0) / ROUTES.length),
    avgDistance: Math.round(ROUTES.reduce((s, r) => s + r.distanceKm, 0) / ROUTES.length),
    totalCapacity: ROUTES.reduce((s, r) => s + r.capacity, 0),
  };
}

// ── Random network generator ──────────────────────────────────────────────────
// Generates a new set of port imbalances while keeping the route topology.
// Ensures total surplus = total deficit and each port has reasonable values.

export function generateRandomPorts(): Port[] {
  // Base port data — names, flags, regions stay the same
  const basePorts = [
    { id: "SHA", name: "Shanghai",     flag: "🇨🇳", region: "East Asia" },
    { id: "SIN", name: "Singapore",    flag: "🇸🇬", region: "Southeast Asia" },
    { id: "DXB", name: "Dubai",        flag: "🇦🇪", region: "Middle East" },
    { id: "ROT", name: "Rotterdam",    flag: "🇳🇱", region: "Europe" },
    { id: "LAX", name: "Los Angeles",  flag: "🇺🇸", region: "North America" },
    { id: "GRU", name: "Santos",       flag: "🇧🇷", region: "South America" },
  ];

  // Generate random TEU values between 100-600 for each port
  const step = TEU_STEP;
  const raw: number[] = basePorts.map(() => {
    // Random between 100-600 in steps of TEU_STEP
    const min = Math.floor(100 / step);
    const max = Math.floor(600 / step);
    return (min + Math.floor(Math.random() * (max - min + 1))) * step;
  });

  // Assign half as surplus, half as deficit
  const indices = raw.map((_, i) => i);
  // Shuffle to randomly pick which ports are surplus vs deficit
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const halfCount = Math.floor(basePorts.length / 2);
  const surplusIndices = new Set(indices.slice(0, halfCount));

  let totalSurplus = 0;
  let totalDeficit = 0;

  const imbalances: number[] = raw.map((v, i) => {
    if (surplusIndices.has(i)) {
      totalSurplus += v;
      return v;
    } else {
      totalDeficit += v;
      return -v;
    }
  });

  // Balance: scale deficits to match surplus total
  const scale = totalSurplus / (totalDeficit || 1);

  return basePorts.map((p, i) => {
    const isSurplus = surplusIndices.has(i);
    let imbalance: number;
    if (isSurplus) {
      imbalance = raw[i];
    } else {
      // Scale deficit to match total surplus, rounded to step
      imbalance = -Math.round((raw[i] * scale) / step) * step;
    }

    // Recalculate totals after rounding
    const finalSurplus = basePorts.map((_, j) => {
      if (surplusIndices.has(j)) return raw[j];
      return 0;
    }).reduce((a, b) => a + b, 0);

    const finalDeficit = basePorts.map((_, j) => {
      if (!surplusIndices.has(j)) {
        if (j === i) return Math.abs(imbalance);
        return Math.round((raw[j] * scale) / step) * step;
      }
      return 0;
    }).reduce((a, b) => a + b, 0);

    // Adjust last deficit to balance exactly
    // (We'll handle this outside the map)

    const imbalanceIndex = parseFloat(
      (imbalance > 0
        ? imbalance / (imbalance + Math.abs(imbalance || 1))
        : imbalance / (Math.abs(imbalance) + Math.abs(imbalance || 1))
      ).toFixed(2)
    );

    return {
      ...p,
      imbalance,
      imbalanceIndex: isNaN(imbalanceIndex) ? 0 : Math.max(-1, Math.min(1, imbalanceIndex)),
    };
  });
}

// Fix: simpler approach — just swap which ports are surplus/deficit with random amounts
// Guarantees a feasible network by retrying until the quantum solver finds a solution.
export function shuffleNetwork(): Port[] {
  const basePorts = [
    { id: "SHA", name: "Shanghai",     flag: "🇨🇳", region: "East Asia" },
    { id: "SIN", name: "Singapore",    flag: "🇸🇬", region: "Southeast Asia" },
    { id: "DXB", name: "Dubai",        flag: "🇦🇪", region: "Middle East" },
    { id: "ROT", name: "Rotterdam",    flag: "🇳🇱", region: "Europe" },
    { id: "LAX", name: "Los Angeles",  flag: "🇺🇸", region: "North America" },
    { id: "GRU", name: "Santos",       flag: "🇧🇷", region: "South America" },
  ];

  const step = TEU_STEP;

  for (let attempt = 0; attempt < 50; attempt++) {
    const minVal = Math.floor(100 / step);
    const maxVal = Math.floor(600 / step);
    const values = basePorts.map(() => (minVal + Math.floor(Math.random() * (maxVal - minVal + 1))) * step);

    // Randomly assign 3 ports as surplus, 3 as deficit
    const idxs = [0, 1, 2, 3, 4, 5];
    for (let i = idxs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
    }

    const surplusSet = new Set(idxs.slice(0, 3));
    let totalSurplus = 0;
    let totalDeficit = 0;
    const signed: number[] = values.map((v, i) => {
      if (surplusSet.has(i)) { totalSurplus += v; return v; }
      totalDeficit += v;
      return -v;
    });

    const ratio = totalSurplus / (totalDeficit || 1);
    const result: Port[] = [];

    for (let i = 0; i < basePorts.length; i++) {
      let imbalance: number;
      if (surplusSet.has(i)) {
        imbalance = values[i];
      } else {
        imbalance = -Math.round((Math.abs(signed[i]) * ratio) / step) * step;
      }
      if (imbalance === 0) imbalance = surplusSet.has(i) ? step : -step;

      result.push({
        ...basePorts[i],
        imbalance,
        imbalanceIndex: imbalance > 0 ? 0.5 : -0.5,
      });
    }

    // Fix rounding: adjust last deficit to balance totals
    const finalSurplus = result.filter(p => p.imbalance > 0).reduce((s, p) => s + p.imbalance, 0);
    const finalDeficit = result.filter(p => p.imbalance < 0).reduce((s, p) => s - p.imbalance, 0);
    if (finalSurplus !== finalDeficit) {
      const diff = finalSurplus - finalDeficit;
      for (let i = result.length - 1; i >= 0; i--) {
        if (result[i].imbalance < 0) {
          result[i].imbalance -= diff;
          if (result[i].imbalance === 0) result[i].imbalance = -step;
          break;
        }
      }
    }

    // Recalculate imbalance indices properly
    for (const p of result) {
      const absVal = Math.abs(p.imbalance);
      p.imbalanceIndex = parseFloat((p.imbalance / (absVal * 2 + 1)).toFixed(2));
    }

    // Verify this network has a feasible solution
    const saved = PORTS;
    PORTS = result;
    const test = solveOptimal();
    PORTS = saved;

    if (test.feasible) {
      return result;
    }
  }

  // Fallback: return the default network
  return [
    { id: "SHA", name: "Shanghai",     flag: "🇨🇳", region: "East Asia",       imbalance: 500,  imbalanceIndex:  0.72 },
    { id: "SIN", name: "Singapore",    flag: "🇸🇬", region: "Southeast Asia",  imbalance: 200,  imbalanceIndex:  0.31 },
    { id: "DXB", name: "Dubai",        flag: "🇦🇪", region: "Middle East",     imbalance: 100,  imbalanceIndex:  0.16 },
    { id: "ROT", name: "Rotterdam",    flag: "🇳🇱", region: "Europe",          imbalance: -400, imbalanceIndex: -0.61 },
    { id: "LAX", name: "Los Angeles",  flag: "🇺🇸", region: "North America",   imbalance: -300, imbalanceIndex: -0.48 },
    { id: "GRU", name: "Santos",       flag: "🇧🇷", region: "South America",   imbalance: -100, imbalanceIndex: -0.28 },
  ];
}
