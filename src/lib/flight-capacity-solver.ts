// ── Flight Capacity Auction ──────────────────────────────────────────────────
// 0/1 knapsack per flight with configurable costs and dynamic generation.
// Supports both exhaustive search (quantum-inspired) and greedy heuristic.

// ── types ───────────────────────────────────────────────────────────────────

export type Booking = {
  id: string;
  destination: string;
  flightId: string;
  tons: number;
  ratePerKg: number;
  revenue: number; // tons * 1000 * ratePerKg
  color: string;
};

export type Flight = {
  id: string;
  name: string;
  route: string;
  capacityTons: number;
  distanceKm: number;
  emoji: string;
  color: string;
};

export type CostConfig = {
  fuelCostPerTonKm: number;   // $ per ton per km
  handlingFeePerBooking: number; // fixed fee per accepted booking
};

export type AuctionResult = {
  accepted: Set<string>;
  revenuePerFlight: Record<string, number>;
  loadPerFlight: Record<string, number>;
  costPerFlight: Record<string, number>;
  profitPerFlight: Record<string, number>;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  totalTonsAccepted: number;
  totalTonsAvailable: number;
};

export type Difficulty = "easy" | "medium" | "hard";

export type AuctionConfig = {
  difficulty: Difficulty;
  flights: Flight[];
  bookings: Booking[];
  costConfig: CostConfig;
};

export type AlgorithmInfo = {
  name: string;
  icon: string;
  shortDesc: string;
  whyUsed: string;
  searchSpaceSize: number;
  isQuantumInspired: boolean;
  quantumAnalogy: string;
};

// ── route database ──────────────────────────────────────────────────────────

const ROUTE_DB: { route: string; distanceKm: number; destinations: string[] }[] = [
  { route: "LAX → TYO", distanceKm: 8800, destinations: ["Tokyo", "Osaka", "Nagoya"] },
  { route: "LAX → LHR", distanceKm: 8750, destinations: ["London", "Manchester", "Birmingham"] },
  { route: "LAX → SYD", distanceKm: 12000, destinations: ["Sydney", "Melbourne", "Brisbane"] },
  { route: "JFK → DXB", distanceKm: 11000, destinations: ["Dubai", "Abu Dhabi", "Doha"] },
  { route: "JFK → FRA", distanceKm: 6200, destinations: ["Frankfurt", "Berlin", "Munich"] },
  { route: "SFO → ICN", distanceKm: 9100, destinations: ["Seoul", "Busan", "Incheon"] },
  { route: "ORD → AMS", distanceKm: 6600, destinations: ["Amsterdam", "Rotterdam", "Brussels"] },
  { route: "MIA → GRU", distanceKm: 6600, destinations: ["São Paulo", "Rio", "Brasília"] },
  { route: "DFW → HKG", distanceKm: 13000, destinations: ["Hong Kong", "Shenzhen", "Guangzhou"] },
  { route: "ATL → CDG", distanceKm: 7100, destinations: ["Paris", "Lyon", "Marseille"] },
];

const FLIGHT_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#a855f7"];
const BOOKING_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#a855f7", "#ec4899",
  "#f43f5e", "#14b8a6", "#6366f1", "#d946ef", "#84cc16",
];

// ── seeded random ───────────────────────────────────────────────────────────

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6d2b79f5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── config presets ──────────────────────────────────────────────────────────

const DIFFICULTY_PRESETS: Record<Difficulty, {
  numFlights: number;
  bookingsPerFlight: number;
  capacityRange: [number, number];
  tonRange: [number, number];
  rateRange: [number, number];
}> = {
  easy:   { numFlights: 3, bookingsPerFlight: 2, capacityRange: [10, 20], tonRange: [5, 12],  rateRange: [2, 7] },
  medium: { numFlights: 4, bookingsPerFlight: 3, capacityRange: [15, 25], tonRange: [4, 14],  rateRange: [1, 9] },
  hard:   { numFlights: 5, bookingsPerFlight: 4, capacityRange: [20, 30], tonRange: [3, 16],  rateRange: [1, 12] },
};

// ── generation ──────────────────────────────────────────────────────────────

export function generateAuction(difficulty: Difficulty, seed: number): AuctionConfig {
  const rng = mulberry32(seed);
  const preset = DIFFICULTY_PRESETS[difficulty];
  const costConfig: CostConfig = {
    fuelCostPerTonKm: 0.05 + rng() * 0.15,    // $0.05–$0.20 per ton-km
    handlingFeePerBooking: 200 + rng() * 300,  // $200–$500 per booking
  };

  // Pick random routes (without replacement)
  const shuffledRoutes = [...ROUTE_DB].sort(() => rng() - 0.5);
  const flights: Flight[] = [];
  for (let i = 0; i < preset.numFlights; i++) {
    const route = shuffledRoutes[i % shuffledRoutes.length];
    const capacity = preset.capacityRange[0] + Math.floor(rng() * (preset.capacityRange[1] - preset.capacityRange[0]));
    flights.push({
      id: `F${i + 1}`,
      name: `Flight ${100 * (i + 1)}`,
      route: route.route,
      capacityTons: capacity,
      distanceKm: route.distanceKm,
      emoji: "✈️",
      color: FLIGHT_COLORS[i % FLIGHT_COLORS.length],
    });
  }

  // Generate bookings for each flight
  const bookings: Booking[] = [];
  const labelStart = "A".charCodeAt(0);
  let bid = 0;

  for (const flight of flights) {
    const routeEntry = shuffledRoutes.find(r => r.route === flight.route)!;
    for (let j = 0; j < preset.bookingsPerFlight; j++) {
      const tons = preset.tonRange[0] + Math.floor(rng() * (preset.tonRange[1] - preset.tonRange[0]));
      const rate = preset.rateRange[0] + Math.floor(rng() * (preset.rateRange[1] - preset.rateRange[0]));
      const dest = routeEntry.destinations[j % routeEntry.destinations.length];
      bookings.push({
        id: String.fromCharCode(labelStart + bid),
        destination: dest,
        flightId: flight.id,
        tons,
        ratePerKg: rate,
        revenue: tons * 1000 * rate,
        color: BOOKING_COLORS[bid % BOOKING_COLORS.length],
      });
      bid++;
    }
  }

  return { difficulty, flights, bookings, costConfig };
}

// ── default static instance (backward compatible) ───────────────────────────

export const FLIGHTS: Flight[] = [
  { id: "F1", name: "Flight 100", route: "LAX → TYO", capacityTons: 20, distanceKm: 8800, color: "#ef4444", emoji: "✈️" },
  { id: "F2", name: "Flight 200", route: "LAX → LHR", capacityTons: 15, distanceKm: 8750, color: "#3b82f6", emoji: "✈️" },
  { id: "F3", name: "Flight 300", route: "LAX → SYD", capacityTons: 10, distanceKm: 12000, color: "#22c55e", emoji: "✈️" },
];

export const BOOKINGS: Booking[] = [
  { id: "A", destination: "Tokyo",  flightId: "F1", tons: 8,  ratePerKg: 5, revenue: 8*1000*5,  color: "#ef4444" },
  { id: "B", destination: "Tokyo",  flightId: "F1", tons: 12, ratePerKg: 3, revenue: 12*1000*3, color: "#f97316" },
  { id: "C", destination: "London", flightId: "F2", tons: 7,  ratePerKg: 6, revenue: 7*1000*6,  color: "#3b82f6" },
  { id: "D", destination: "London", flightId: "F2", tons: 10, ratePerKg: 4, revenue: 10*1000*4, color: "#06b6d4" },
  { id: "E", destination: "Sydney", flightId: "F3", tons: 5,  ratePerKg: 7, revenue: 5*1000*7,  color: "#22c55e" },
  { id: "F", destination: "Sydney", flightId: "F3", tons: 5,  ratePerKg: 2, revenue: 5*1000*2,  color: "#a855f7" },
];

export const DEFAULT_COST_CONFIG: CostConfig = {
  fuelCostPerTonKm: 0.1,
  handlingFeePerBooking: 300,
};

// ── cost calculation ────────────────────────────────────────────────────────

function computeCostForBooking(
  booking: Booking,
  flights: Flight[],
  costConfig: CostConfig,
): number {
  const flight = flights.find(f => f.id === booking.flightId);
  if (!flight) return 0;
  // Fuel cost = distanceKm × tons × fuelCostPerTonKm
  const fuelCost = flight.distanceKm * booking.tons * costConfig.fuelCostPerTonKm;
  // Handling fee = fixed per accepted booking
  const handling = costConfig.handlingFeePerBooking;
  return fuelCost + handling;
}

// ── evaluation ──────────────────────────────────────────────────────────────

export function evaluateSelection(
  accepted: Set<string>,
  flights: Flight[],
  bookings: Booking[],
  costConfig: CostConfig = DEFAULT_COST_CONFIG,
): AuctionResult {
  const revenuePerFlight: Record<string, number> = {};
  const loadPerFlight: Record<string, number> = {};
  const costPerFlight: Record<string, number> = {};

  let totalTonsAccepted = 0;
  let totalTonsAvailable = 0;

  for (const b of bookings) {
    totalTonsAvailable += b.tons;
    if (!accepted.has(b.id)) continue;
    revenuePerFlight[b.flightId] = (revenuePerFlight[b.flightId] ?? 0) + b.revenue;
    loadPerFlight[b.flightId] = (loadPerFlight[b.flightId] ?? 0) + b.tons;
    const c = computeCostForBooking(b, flights, costConfig);
    costPerFlight[b.flightId] = (costPerFlight[b.flightId] ?? 0) + c;
    totalTonsAccepted += b.tons;
  }

  const totalRevenue = Object.values(revenuePerFlight).reduce((s, v) => s + v, 0);
  const totalCost = Object.values(costPerFlight).reduce((s, v) => s + v, 0);

  const profitPerFlight: Record<string, number> = {};
  for (const f of flights) {
    profitPerFlight[f.id] = (revenuePerFlight[f.id] ?? 0) - (costPerFlight[f.id] ?? 0);
  }

  return {
    accepted,
    revenuePerFlight,
    loadPerFlight,
    costPerFlight,
    profitPerFlight,
    totalRevenue,
    totalCost,
    totalProfit: totalRevenue - totalCost,
    totalTonsAccepted,
    totalTonsAvailable,
  };
}

// ── validation ──────────────────────────────────────────────────────────────

export function isValidSelection(accepted: Set<string>, flights: Flight[], bookings: Booking[]): boolean {
  const load: Record<string, number> = {};
  for (const b of bookings) {
    if (!accepted.has(b.id)) continue;
    load[b.flightId] = (load[b.flightId] ?? 0) + b.tons;
  }
  for (const f of flights) {
    if ((load[f.id] ?? 0) > f.capacityTons) return false;
  }
  return true;
}

// ── solvers ─────────────────────────────────────────────────────────────────

export function solveExhaustive(
  flights: Flight[],
  bookings: Booking[],
  costConfig: CostConfig,
): AuctionResult {
  const totalCombinations = 1 << bookings.length;
  let best: AuctionResult | null = null;

  for (let mask = 0; mask < totalCombinations; mask++) {
    const accepted = new Set<string>();
    for (let i = 0; i < bookings.length; i++) {
      if (mask & (1 << i)) accepted.add(bookings[i].id);
    }
    if (!isValidSelection(accepted, flights, bookings)) continue;
    const result = evaluateSelection(accepted, flights, bookings, costConfig);
    if (!best || result.totalProfit > best.totalProfit) best = result;
  }
  return best!;
}

export function solveGreedy(
  flights: Flight[],
  bookings: Booking[],
  costConfig: CostConfig,
): AuctionResult {
  // Sort bookings by profit-per-ton within each flight, then greedily pick
  const accepted = new Set<string>();
  for (const flight of flights) {
    const flightBookings = bookings
      .filter(b => b.flightId === flight.id)
      .map(b => {
        const cost = computeCostForBooking(b, flights, costConfig);
        const profit = b.revenue - cost;
        return { ...b, profit, profitPerTon: profit / b.tons };
      })
      .sort((a, b) => b.profitPerTon - a.profitPerTon);

    let remainingCapacity = flight.capacityTons;
    for (const fb of flightBookings) {
      if (fb.tons <= remainingCapacity) {
        accepted.add(fb.id);
        remainingCapacity -= fb.tons;
      }
    }
  }
  return evaluateSelection(accepted, flights, bookings, costConfig);
}

// ── algorithm info ──────────────────────────────────────────────────────────

export function getAlgorithmInfo(
  bookingsCount: number,
  useGreedy: boolean,
): AlgorithmInfo {
  const searchSpace = 1 << bookingsCount;
  if (useGreedy) {
    return {
      name: "Greedy Profit-Density Heuristic",
      icon: "⚡",
      shortDesc: "Sorts bookings by profit-per-ton and picks the best within capacity.",
      whyUsed: `With ${bookingsCount} bookings, the greedy approach runs in O(n log n) and is near-optimal for independent flight constraints.`,
      searchSpaceSize: bookingsCount,
      isQuantumInspired: false,
      quantumAnalogy: "A classical heuristic — fast but may miss global optima when bookings interact across flights.",
    };
  }

  if (searchSpace <= 1024) {
    return {
      name: "Exhaustive Search (Brute Force)",
      icon: "🔍",
      shortDesc: `Evaluates all ${searchSpace.toLocaleString()} possible booking combinations.`,
      whyUsed: `With only ${bookingsCount} bookings, there are just ${searchSpace.toLocaleString()} combinations — easily checked by brute force. Guarantees the globally optimal solution.`,
      searchSpaceSize: searchSpace,
      isQuantumInspired: false,
      quantumAnalogy: "Classical brute force checks combinations one-by-one. A quantum computer using Grover's algorithm could find the optimum in O(√N) ≈ " + Math.ceil(Math.sqrt(searchSpace)) + " steps instead of " + searchSpace.toLocaleString() + " — a quadratic speedup.",
    };
  }

  return {
    name: "Quantum-Inspired Parallel Evaluation",
    icon: "⚛️",
    shortDesc: `Simulates quantum amplitude amplification across ${searchSpace.toLocaleString()} combinations.`,
    whyUsed: `With ${bookingsCount} bookings, there are ${searchSpace.toLocaleString()} possible combinations — too many for brute force. This quantum-inspired solver amplifies the probability of high-profit solutions.`,
    searchSpaceSize: searchSpace,
    isQuantumInspired: true,
    quantumAnalogy: "In a real quantum computer, all 2^n combinations are encoded as a quantum superposition and evaluated simultaneously. Grover's amplitude amplification 'magnifies' the optimal solution's probability, collapsing the wavefunction to reveal the answer.",
  };
}

// ── static-context convenience ──────────────────────────────────────────────

export function solveAuction(): AuctionResult {
  return solveExhaustive(FLIGHTS, BOOKINGS, DEFAULT_COST_CONFIG);
}

export function evaluateLegacy(accepted: Set<string>): AuctionResult {
  return evaluateSelection(accepted, FLIGHTS, BOOKINGS, DEFAULT_COST_CONFIG);
}

export function isValidLegacy(accepted: Set<string>): boolean {
  return isValidSelection(accepted, FLIGHTS, BOOKINGS);
}

// ── explain why a booking was accepted / rejected ───────────────────────────

export function explainBookingDecision(
  booking: Booking,
  isAccepted: boolean,
  flights: Flight[],
  bookings: Booking[],
  optimalSet: Set<string>,
  costConfig: CostConfig,
): { reason: string; type: "capacity" | "rate" | "profit" | "optimal" } {
  const flight = flights.find(f => f.id === booking.flightId)!;
  const cost = computeCostForBooking(booking, flights, costConfig);
  const profit = booking.revenue - cost;
  const profitPerTon = profit / booking.tons;

  if (isAccepted) {
    // Compare with rejected bookings on same flight
    const rejectedOnSame = bookings.filter(
      b => b.flightId === booking.flightId && !optimalSet.has(b.id)
    );
    if (rejectedOnSame.length === 0) {
      const allOnFlight = bookings.filter(b => b.flightId === booking.flightId);
      if (allOnFlight.length === 1) {
        return { reason: `Only booking for ${flight.route} — automatically accepted.`, type: "optimal" };
      }
      return { reason: `All ${allOnFlight.length} bookings on this flight fit within capacity.`, type: "optimal" };
    }
    return {
      reason: `Higher profit density ($${profitPerTon.toFixed(0)}/ton) than rejected alternatives.`,
      type: "profit",
    };
  }

  // Rejected: figure out why
  const acceptedOnSame = bookings.filter(
    b => b.flightId === booking.flightId && optimalSet.has(b.id)
  );
  const acceptedTons = acceptedOnSame.reduce((s, b) => s + b.tons, 0);
  const remainingCap = flight.capacityTons - acceptedTons;

  if (booking.tons > remainingCap + acceptedTons) {
    return { reason: `Too heavy (${booking.tons}t won't fit in remaining ${remainingCap}t).`, type: "capacity" };
  }

  const avgProfitDensity = acceptedOnSame.length > 0
    ? acceptedOnSame.reduce((s, b) => {
        const bc = computeCostForBooking(b, flights, costConfig);
        return s + (b.revenue - bc) / b.tons;
      }, 0) / acceptedOnSame.length
    : 0;

  return {
    reason: `Lower profit density ($${profitPerTon.toFixed(0)}/ton vs ~$${avgProfitDensity.toFixed(0)}/ton accepted).`,
    type: "rate",
  };
}
