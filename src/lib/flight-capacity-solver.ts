// Flight Capacity Auction — 0/1 knapsack per flight to maximise revenue

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
  color: string;
  emoji: string;
};

export const FLIGHTS: Flight[] = [
  { id: "F100", name: "Flight 100", route: "LAX → TYO", capacityTons: 20, color: "#ef4444", emoji: "✈️" },
  { id: "F200", name: "Flight 200", route: "LAX → LHR", capacityTons: 15, color: "#3b82f6", emoji: "✈️" },
  { id: "F300", name: "Flight 300", route: "LAX → SYD", capacityTons: 10, color: "#22c55e", emoji: "✈️" },
];

export const BOOKINGS: Booking[] = [
  { id: "A", destination: "Tokyo",  flightId: "F100", tons: 8,  ratePerKg: 5, revenue: 8*1000*5,  color: "#ef4444" },
  { id: "B", destination: "Tokyo",  flightId: "F100", tons: 12, ratePerKg: 3, revenue: 12*1000*3, color: "#f97316" },
  { id: "C", destination: "London", flightId: "F200", tons: 7,  ratePerKg: 6, revenue: 7*1000*6,  color: "#3b82f6" },
  { id: "D", destination: "London", flightId: "F200", tons: 10, ratePerKg: 4, revenue: 10*1000*4, color: "#06b6d4" },
  { id: "E", destination: "Sydney", flightId: "F300", tons: 5,  ratePerKg: 7, revenue: 5*1000*7,  color: "#22c55e" },
  { id: "F", destination: "Sydney", flightId: "F300", tons: 5,  ratePerKg: 2, revenue: 5*1000*2,  color: "#a855f7" },
];

export type AuctionResult = {
  accepted: Set<string>;
  revenuePerFlight: Record<string, number>;
  loadPerFlight: Record<string, number>;
  totalRevenue: number;
};

export function evaluateSelection(accepted: Set<string>): AuctionResult {
  const revenuePerFlight: Record<string, number> = {};
  const loadPerFlight: Record<string, number> = {};

  for (const b of BOOKINGS) {
    if (!accepted.has(b.id)) continue;
    revenuePerFlight[b.flightId] = (revenuePerFlight[b.flightId] ?? 0) + b.revenue;
    loadPerFlight[b.flightId] = (loadPerFlight[b.flightId] ?? 0) + b.tons;
  }

  const totalRevenue = Object.values(revenuePerFlight).reduce((s, v) => s + v, 0);
  return { accepted, revenuePerFlight, loadPerFlight, totalRevenue };
}

export function isValidSelection(accepted: Set<string>): boolean {
  const load: Record<string, number> = {};
  for (const b of BOOKINGS) {
    if (!accepted.has(b.id)) continue;
    load[b.flightId] = (load[b.flightId] ?? 0) + b.tons;
  }
  for (const f of FLIGHTS) {
    if ((load[f.id] ?? 0) > f.capacityTons) return false;
  }
  return true;
}

export function solveAuction(): AuctionResult {
  // 2^6 = 64 combinations
  let best: AuctionResult | null = null;
  for (let mask = 0; mask < 64; mask++) {
    const accepted = new Set<string>();
    BOOKINGS.forEach((b, i) => { if (mask & (1 << i)) accepted.add(b.id); });
    if (!isValidSelection(accepted)) continue;
    const result = evaluateSelection(accepted);
    if (!best || result.totalRevenue > best.totalRevenue) best = result;
  }
  return best!;
}
