// Spot Bid Battle — assignment problem: maximise broker profit

export type SpotLoad = {
  id: string;
  name: string;
  from: string;
  to: string;
  maxRate: number; // $ shipper will pay
  miles: number;
  color: string;
};

export type Carrier = {
  id: string;
  name: string;
  ratePerMile: number;
  maxLoads: number;
  description: string;
  color: string;
  emoji: string;
};

export type Assignment = {
  load: SpotLoad;
  carrier: Carrier;
  carrierCost: number;
  brokerRevenue: number;
  profit: number;
  valid: boolean;
  reason?: string;
};

export type BidResult = {
  assignments: Assignment[];
  totalProfit: number;
  allCovered: boolean;
};

export const LOADS: SpotLoad[] = [
  { id: "L1", name: "Load 1", from: "Dallas",  to: "Houston",     maxRate: 800, miles: 240, color: "#ef4444" },
  { id: "L2", name: "Load 2", from: "Dallas",  to: "Austin",      maxRate: 500, miles: 200, color: "#3b82f6" },
  { id: "L3", name: "Load 3", from: "Houston", to: "San Antonio", maxRate: 600, miles: 200, color: "#22c55e" },
  { id: "L4", name: "Load 4", from: "Austin",  to: "Dallas",      maxRate: 400, miles: 200, color: "#eab308" },
];

export const CARRIERS: Carrier[] = [
  { id: "X", name: "Carrier X", ratePerMile: 1.80, maxLoads: 2, description: "Up to 2 loads, Texas lanes", color: "#ef4444", emoji: "🔴" },
  { id: "Y", name: "Carrier Y", ratePerMile: 2.00, maxLoads: 1, description: "1 long run",                 color: "#3b82f6", emoji: "🔵" },
  { id: "Z", name: "Carrier Z", ratePerMile: 1.50, maxLoads: 1, description: "1 short run",                color: "#22c55e", emoji: "🟢" },
];

function evaluateAssignments(assignments: Record<string, string>): BidResult {
  const carrierLoadCount: Record<string, number> = {};
  const result: Assignment[] = [];

  for (const load of LOADS) {
    const carrierId = assignments[load.id];
    if (!carrierId) {
      result.push({ load, carrier: CARRIERS[0], carrierCost: 0, brokerRevenue: load.maxRate, profit: 0, valid: false, reason: "Unassigned" });
      continue;
    }
    const carrier = CARRIERS.find((c) => c.id === carrierId)!;
    carrierLoadCount[carrierId] = (carrierLoadCount[carrierId] ?? 0) + 1;

    const carrierCost = Math.round(carrier.ratePerMile * load.miles);
    const brokerRevenue = load.maxRate;
    const profit = brokerRevenue - carrierCost;
    const overCapacity = carrierLoadCount[carrierId] > carrier.maxLoads;
    const unprofitable = profit < 0;

    result.push({
      load,
      carrier,
      carrierCost,
      brokerRevenue,
      profit,
      valid: !overCapacity && !unprofitable,
      reason: overCapacity ? "Carrier over capacity" : unprofitable ? "Carrier costs more than shipper pays" : undefined,
    });
  }

  const totalProfit = result.filter((r) => r.valid).reduce((s, r) => s + r.profit, 0);
  const allCovered = result.every((r) => r.valid);
  return { assignments: result, totalProfit, allCovered };
}

export function solveSpotBid(): BidResult {
  const carrierIds = CARRIERS.map((c) => c.id);
  let best: BidResult | null = null;

  // Enumerate all assignments (4^3 = 64 combinations for 4 loads x 3 carriers)
  function recurse(loadIdx: number, current: Record<string, string>) {
    if (loadIdx === LOADS.length) {
      const result = evaluateAssignments(current);
      if (result.allCovered && (!best || result.totalProfit > best.totalProfit)) {
        best = result;
      }
      return;
    }
    for (const cid of carrierIds) {
      recurse(loadIdx + 1, { ...current, [LOADS[loadIdx].id]: cid });
    }
  }

  recurse(0, {});
  return best ?? evaluateAssignments({ L1: "X", L2: "X", L3: "Y", L4: "Z" });
}

export function evaluateManual(assignments: Record<string, string>): BidResult {
  return evaluateAssignments(assignments);
}
