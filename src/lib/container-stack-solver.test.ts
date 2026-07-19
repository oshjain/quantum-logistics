import { describe, it, expect } from "vitest";
import {
  generateRandomState,
  solveContainerStack,
  isGoal,
  TARGET_ORDER,
  type StackState,
  type StackId,
  type Move,
} from "./container-stack-solver.ts";

const SIDE_MAX = 3;
const ALL_STACKS: StackId[] = ["main", "side1", "side2"];
const MOVES: Move[] = [];
for (const from of ALL_STACKS) {
  for (const to of ALL_STACKS) {
    if (from !== to) MOVES.push({ from, to });
  }
}

function stackRef(s: StackState, id: StackId) {
  if (id === "main") return s.main;
  if (id === "side1") return s.side1;
  return s.side2;
}

function stateKey(s: StackState): string {
  return JSON.stringify(s);
}

function applyMove(s: StackState, move: Move): StackState | null {
  if (move.from === move.to) return null;
  const next = { main: [...s.main], side1: [...s.side1], side2: [...s.side2] };
  const src = stackRef(next, move.from);
  const dst = stackRef(next, move.to);
  if (src.length === 0) return null;
  if (move.to !== "main" && dst.length >= SIDE_MAX) return null;
  const top = src.pop()!;
  dst.push(top);
  return next;
}

describe("State space analysis (2 buffers)", () => {
  it("should have a rich reachable state space from goal", () => {
    const goal: StackState = { main: [...TARGET_ORDER], side1: [], side2: [] };
    const queue: { state: StackState; depth: number }[] = [{ state: goal, depth: 0 }];
    const visited = new Map<string, number>();
    visited.set(stateKey(goal), 0);

    let maxDepth = 0;
    const statesAtDepth = new Map<number, StackState[]>();

    while (queue.length > 0) {
      const { state, depth } = queue.shift()!;
      if (depth > maxDepth) maxDepth = depth;
      if (!statesAtDepth.has(depth)) statesAtDepth.set(depth, []);
      statesAtDepth.get(depth)!.push(state);

      for (const move of MOVES) {
        const next = applyMove(state, move);
        if (!next) continue;
        const key = stateKey(next);
        if (visited.has(key)) continue;
        visited.set(key, depth + 1);
        queue.push({ state: next, depth: depth + 1 });
      }
    }

    console.log(`\nTotal reachable states: ${visited.size}`);
    console.log(`Maximum distance from goal: ${maxDepth}`);
    console.log(`\nStates per depth:`);
    for (let d = 0; d <= maxDepth; d++) {
      const states = statesAtDepth.get(d) || [];
      console.log(`  Depth ${d}: ${states.length} states`);
    }

    expect(visited.size).toBeGreaterThan(20);
    expect(maxDepth).toBeGreaterThanOrEqual(5);
  }, 30000);

  it("should generate puzzles requiring at least 5 moves", () => {
    for (let i = 0; i < 20; i++) {
      const state = generateRandomState();
      expect(isGoal(state)).toBe(false);
      const sol = solveContainerStack(state);
      expect(sol).not.toBeNull();
      expect(sol!.length).toBeGreaterThanOrEqual(5);
    }
  }, 60000);
});
