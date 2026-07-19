// Container Stack Shuffle — BFS to find optimal crane move sequence
// Main stack target order (bottom to top): Red, Blue, Green, Yellow, Purple
// Two side buffers let the crane actually reorder containers (unlike 1 buffer = LIFO only)

export type Container = "Red" | "Blue" | "Green" | "Yellow" | "Purple";

export const TARGET_ORDER: Container[] = ["Red", "Blue", "Green", "Yellow", "Purple"];
// target[0] = bottom, target[4] = top

export type StackId = "main" | "side1" | "side2";

export type StackState = {
  main: Container[];   // index 0 = bottom
  side1: Container[];  // index 0 = bottom, max 3
  side2: Container[];  // index 0 = bottom, max 3
};

export type Move = { from: StackId; to: StackId };

function stackRef(s: StackState, id: StackId): Container[] {
  if (id === "main") return s.main;
  if (id === "side1") return s.side1;
  return s.side2;
}

function stateKey(s: StackState): string {
  return JSON.stringify(s);
}

export function isGoal(s: StackState): boolean {
  if (s.main.length !== TARGET_ORDER.length) return false;
  if (s.side1.length > 0 || s.side2.length > 0) return false;
  return TARGET_ORDER.every((c, i) => s.main[i] === c);
}

const SIDE_MAX = 3;

function applyMove(s: StackState, move: Move): StackState | null {
  if (move.from === move.to) return null;

  const next = {
    main: [...s.main],
    side1: [...s.side1],
    side2: [...s.side2],
  };

  const src = stackRef(next, move.from);
  const dst = stackRef(next, move.to);

  if (src.length === 0) return null;
  if (move.to !== "main" && dst.length >= SIDE_MAX) return null;

  const top = src.pop()!;
  dst.push(top);

  return next;
}

const ALL_STACKS: StackId[] = ["main", "side1", "side2"];

const MOVES: Move[] = [];
for (const from of ALL_STACKS) {
  for (const to of ALL_STACKS) {
    if (from !== to) MOVES.push({ from, to });
  }
}
// 6 moves: main↔side1, main↔side2, side1↔side2

// Returns the optimal move sequence, or null if no solution exists from this state
export function solveContainerStack(initial: StackState): Move[] | null {
  if (isGoal(initial)) return [];

  // BFS — no depth cap so we always find the true optimal or confirm unsolvable
  const queue: { state: StackState; path: Move[] }[] = [{ state: initial, path: [] }];
  const visited = new Set<string>([stateKey(initial)]);

  while (queue.length > 0) {
    const { state, path } = queue.shift()!;
    for (const move of MOVES) {
      const next = applyMove(state, move);
      if (!next) continue;
      const key = stateKey(next);
      if (visited.has(key)) continue;
      visited.add(key);
      const newPath = [...path, move];
      if (isGoal(next)) return newPath;
      queue.push({ state: next, path: newPath });
    }
  }
  return null;
}

export function applyMoveToState(s: StackState, move: Move): StackState {
  return applyMove(s, move) ?? s;
}

export const CONTAINER_COLORS: Record<Container, string> = {
  Red: "#e74c3c",
  Blue: "#3498db",
  Green: "#2ecc71",
  Yellow: "#f1c40f",
  Purple: "#9b59b6",
};

export const CONTAINER_LETTERS: Record<Container, string> = {
  Red: "R",
  Blue: "B",
  Green: "G",
  Yellow: "Y",
  Purple: "P",
};

export type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_RANGES: Record<Difficulty, { min: number; max: number }> = {
  easy: { min: 2, max: 5 },
  medium: { min: 5, max: 9 },
  hard: { min: 9, max: 14 },
};

export function generateRandomState(difficulty: Difficulty = "medium"): StackState {
  const target = DIFFICULTY_RANGES[difficulty];
  const MAX_ATTEMPTS = 300;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let state: StackState = { main: [...TARGET_ORDER], side1: [], side2: [] };
    const numMoves = 30 + Math.floor(Math.random() * 60); // 30–90 scramble moves

    let lastMove: Move | null = null;

    for (let i = 0; i < numMoves; i++) {
      let possible = MOVES.filter((m) => {
        if (applyMove(state, m) === null) return false;
        if (lastMove && m.from === lastMove.to && m.to === lastMove.from) return false;
        return true;
      });

      if (possible.length === 0) {
        possible = MOVES.filter((m) => applyMove(state, m) !== null);
      }
      if (possible.length === 0) break;

      const pick = possible[Math.floor(Math.random() * possible.length)];
      state = applyMove(state, pick)!;
      lastMove = pick;
    }

    if (isGoal(state)) continue;

    const solution = solveContainerStack(state);
    if (solution !== null && solution.length >= target.min && solution.length <= target.max) {
      return state;
    }
  }

  // Fallback: heavy unbiased scramble
  let state: StackState = { main: [...TARGET_ORDER], side1: [], side2: [] };
  for (let i = 0; i < 300; i++) {
    const possible = MOVES.filter((m) => applyMove(state, m) !== null);
    if (possible.length === 0) break;
    state = applyMove(state, possible[Math.floor(Math.random() * possible.length)])!;
  }
  if (!isGoal(state)) return state;

  // Ultra-fallback
  return {
    main: ["Red", "Blue", "Green", "Yellow"],
    side1: ["Purple"],
    side2: [],
  };
}
