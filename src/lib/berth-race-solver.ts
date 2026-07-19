// Berth Race — optimal berth assignment to minimise makespan
// 2 berths, 5 ships with arrival times and durations

export type Ship = {
  id: string;
  name: string;
  arrival: number;  // minutes from midnight
  duration: number; // minutes
  color: string;
  emoji: string;
};

export type Assignment = {
  ship: Ship;
  berth: 0 | 1;
  start: number;
  end: number;
};

export const SHIPS: Ship[] = [
  { id: "s1", name: "Ship 1", arrival: 8 * 60,       duration: 4 * 60, color: "#ef4444", emoji: "🚢" },
  { id: "s2", name: "Ship 2", arrival: 8 * 60 + 30,  duration: 2 * 60, color: "#3b82f6", emoji: "⛴️" },
  { id: "s3", name: "Ship 3", arrival: 9 * 60,        duration: 1 * 60, color: "#22c55e", emoji: "🛳️" },
  { id: "s4", name: "Ship 4", arrival: 9 * 60 + 30,  duration: 3 * 60, color: "#eab308", emoji: "🚢" },
  { id: "s5", name: "Ship 5", arrival: 10 * 60,       duration: 2 * 60, color: "#a855f7", emoji: "⛴️" },
];

export function fmt(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permutations(rest)) result.push([arr[i], ...p]);
  }
  return result;
}

export function evaluateAssignment(assignments: Assignment[]): number {
  return Math.max(...assignments.map((a) => a.end));
}

export function buildSchedule(order: Ship[], berthAssign: boolean[]): Assignment[] {
  const berthFree = [0, 0]; // when each berth is free
  const result: Assignment[] = [];
  for (let i = 0; i < order.length; i++) {
    const ship = order[i];
    const b = berthAssign[i] ? 1 : 0;
    const start = Math.max(ship.arrival, berthFree[b]);
    const end = start + ship.duration;
    berthFree[b] = end;
    result.push({ ship, berth: b as 0 | 1, start, end });
  }
  return result;
}

export function solveBerths(): Assignment[] {
  const perms = permutations(SHIPS);
  let best: Assignment[] = [];
  let bestEnd = Infinity;

  for (const perm of perms) {
    // Try all 2^5 berth bit assignments
    for (let mask = 0; mask < 32; mask++) {
      const berthAssign = SHIPS.map((_, i) => !!(mask & (1 << i)));
      const assignments = buildSchedule(perm, berthAssign);
      const end = evaluateAssignment(assignments);
      if (end < bestEnd) {
        bestEnd = end;
        best = assignments;
      }
    }
  }
  return best;
}
