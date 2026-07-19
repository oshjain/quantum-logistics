// Dock Door Scheduling — optimal makespan scheduler
// 4 trucks, 3 doors. Find the schedule that finishes all trucks earliest.

export type Truck = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  minutes: number;
};

export type DoorAssignment = {
  door: number; // 0, 1, 2
  truck: Truck;
  startTime: number;
  endTime: number;
};

export interface ScheduleResult {
  assignments: DoorAssignment[];
  makespan: number; // total time until last truck done
  wave1: Truck[]; // trucks in first wave (3 trucks)
  wave2: Truck; // truck that waits
}

/** Generate all ways to pick 3 trucks out of 4 for wave 1, then assign orders */
function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) {
      result.push([arr[i], ...perm]);
    }
  }
  return result;
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  const [first, ...rest] = arr;
  const withFirst = combinations(rest, k - 1).map((c) => [first, ...c]);
  const withoutFirst = combinations(rest, k);
  return [...withFirst, ...withoutFirst];
}

export function solveSchedule(trucks: Truck[]): ScheduleResult {
  // 4 trucks, 3 doors — try all ways to pick 3 for wave 1, then all 3! door orderings
  let bestMakespan = Infinity;
  let bestResult: ScheduleResult | null = null;

  const wave1Combos = combinations(trucks, 3);

  for (const wave1 of wave1Combos) {
    const wave2Truck = trucks.find((t) => !wave1.includes(t))!;

    // Try all 3! assignments of wave1 trucks to doors 0,1,2
    for (const doorPerm of permutations([0, 1, 2])) {
      const wave1Assignments: DoorAssignment[] = wave1.map((truck, i) => ({
        door: doorPerm[i],
        truck,
        startTime: 0,
        endTime: truck.minutes,
      }));

      // First door to free up
      const sorted = [...wave1Assignments].sort((a, b) => a.endTime - b.endTime);
      const firstFree = sorted[0];
      const wave2Assignment: DoorAssignment = {
        door: firstFree.door,
        truck: wave2Truck,
        startTime: firstFree.endTime,
        endTime: firstFree.endTime + wave2Truck.minutes,
      };

      const makespan = Math.max(
        ...wave1Assignments.map((a) => a.endTime),
        wave2Assignment.endTime
      );

      if (makespan < bestMakespan) {
        bestMakespan = makespan;
        bestResult = {
          assignments: [...wave1Assignments, wave2Assignment],
          makespan,
          wave1,
          wave2: wave2Truck,
        };
      }
    }
  }

  return bestResult!;
}

export function totalCombinations(numTrucks: number, numDoors: number): number {
  // C(n,k) * k! * (n-k)! arrangements
  return factorial(numTrucks);
}
