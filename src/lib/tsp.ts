// Travelling Salesman Problem — brute-force solver for small N
// Returns the optimal tour starting and ending at index 0.

export type Point = { x: number; y: number; label: string; emoji: string; color: string };

export function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

export function routeDistance(tour: number[], points: Point[]): number {
  let total = 0;
  for (let i = 0; i < tour.length - 1; i++) {
    total += dist(points[tour[i]], points[tour[i + 1]]);
  }
  return total;
}

/** Generate all permutations of an array */
function permutations(arr: number[]): number[][] {
  if (arr.length <= 1) return [arr];
  const result: number[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

export interface TSPResult {
  tour: number[]; // indices into points array, starts and ends at 0
  distance: number;
  totalPermutations: number;
}

export function solveTSP(points: Point[]): TSPResult {
  // Fix start = 0 (the bakery), permute the rest
  const stops = points.slice(1).map((_, i) => i + 1);
  const perms = permutations(stops);
  const totalPermutations = perms.length;

  let bestTour: number[] = [];
  let bestDist = Infinity;

  for (const perm of perms) {
    const tour = [0, ...perm, 0];
    const d = routeDistance(tour, points);
    if (d < bestDist) {
      bestDist = d;
      bestTour = tour;
    }
  }

  return { tour: bestTour, distance: bestDist, totalPermutations };
}
