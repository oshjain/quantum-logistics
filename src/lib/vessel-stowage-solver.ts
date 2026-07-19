// Vessel Stowage Tetris — constraint satisfaction solver
// 3x3 grid, 3 ports (A,B,C), weight (heavy/light)
// Rules: heavy must be tier 0 (bottom). Port A containers must be accessible before B before C.
// Columns visited top-to-bottom (tier 2 = top, tier 0 = bottom).

export type Port = "A" | "B" | "C";
export type Weight = "heavy" | "light";

export type CargoContainer = {
  id: string;
  port: Port;
  weight: Weight;
  emoji: string;
  color: string;
};

// Grid: [col][tier] — tier 0=bottom, tier 2=top
export type Grid = (CargoContainer | null)[][];

export const CONTAINERS: CargoContainer[] = [
  { id: "A1", port: "A", weight: "heavy", emoji: "⚓", color: "#ef4444" },
  { id: "A2", port: "A", weight: "light", emoji: "🪶", color: "#ef4444" },
  { id: "A3", port: "A", weight: "light", emoji: "🪶", color: "#ef4444" },
  { id: "B1", port: "B", weight: "heavy", emoji: "⚓", color: "#3b82f6" },
  { id: "B2", port: "B", weight: "light", emoji: "🪶", color: "#3b82f6" },
  { id: "B3", port: "B", weight: "light", emoji: "🪶", color: "#3b82f6" },
  { id: "C1", port: "C", weight: "heavy", emoji: "⚓", color: "#22c55e" },
  { id: "C2", port: "C", weight: "light", emoji: "🪶", color: "#22c55e" },
  { id: "C3", port: "C", weight: "light", emoji: "🪶", color: "#22c55e" },
];

export function emptyGrid(): Grid {
  return Array.from({ length: 3 }, () => [null, null, null]);
}

export function countRestows(grid: Grid, visitOrder: Port[]): number {
  let restows = 0;
  for (let col = 0; col < 3; col++) {
    for (const currentPort of visitOrder) {
      // Find containers for currentPort in this column, check if anything is on top
      for (let tier = 0; tier < 3; tier++) {
        const c = grid[col][tier];
        if (!c || c.port !== currentPort) continue;
        // Check if any container above has a later port
        const portRank = (p: Port) => visitOrder.indexOf(p);
        for (let above = tier + 1; above < 3; above++) {
          const a = grid[col][above];
          if (a && portRank(a.port) > portRank(currentPort)) {
            restows++;
          }
        }
      }
    }
  }
  return restows;
}

export function checkWeightRule(grid: Grid): boolean {
  for (let col = 0; col < 3; col++) {
    for (let tier = 0; tier < 3; tier++) {
      const c = grid[col][tier];
      if (!c) continue;
      if (c.weight === "heavy" && tier !== 0) return false;
      if (c.weight === "light" && tier === 0) {
        // Light at bottom only ok if no heavy exists for this column
        const colContainers = grid[col].filter(Boolean);
        if (colContainers.some((x) => x!.weight === "heavy")) return false;
      }
    }
  }
  return true;
}

export function solveStowage(): Grid {
  // Optimal arrangement: per column, place heavy at bottom, then by port order C,B,A top-to-bottom
  // so A (first port) is on top (accessible first), C (last) at bottom
  // Column layout: tier0=heavy-C, tier1=light-B, tier2=light-A  (each col one of each port)
  const grid = emptyGrid();
  // col0: A1(heavy bottom), B2(light mid), C2(light top) — but A heavy must be bottom...
  // Since A must be unloaded first, A containers should be on TOP of each col
  // Heavy containers of any port must be at tier 0.
  // So: tier0 = heavy (A1, B1, C1), tier1 = light (port C so accessible last), tier2 = light (port A first)
  // Ideal: col0: [A1, C3, A2], col1: [B1, C2, B2], col2: [C1, B3, A3] — no this mixes ports in col
  // Actually best: keep same port in a column: col0=all A, col1=all B, col2=all C
  // col0: A1(heavy,tier0), A2(light,tier1), A3(light,tier2)
  // col1: B1(heavy,tier0), B2(light,tier1), B3(light,tier2)
  // col2: C1(heavy,tier0), C2(light,tier1), C3(light,tier2)
  // restows: 0 — A is entirely in col0, unloaded first, nothing blocks it from other ports
  grid[0][0] = CONTAINERS.find((c) => c.id === "A1")!;
  grid[0][1] = CONTAINERS.find((c) => c.id === "A2")!;
  grid[0][2] = CONTAINERS.find((c) => c.id === "A3")!;
  grid[1][0] = CONTAINERS.find((c) => c.id === "B1")!;
  grid[1][1] = CONTAINERS.find((c) => c.id === "B2")!;
  grid[1][2] = CONTAINERS.find((c) => c.id === "B3")!;
  grid[2][0] = CONTAINERS.find((c) => c.id === "C1")!;
  grid[2][1] = CONTAINERS.find((c) => c.id === "C2")!;
  grid[2][2] = CONTAINERS.find((c) => c.id === "C3")!;
  return grid;
}

export const PORT_COLORS: Record<Port, string> = {
  A: "#ef4444",
  B: "#3b82f6",
  C: "#22c55e",
};
