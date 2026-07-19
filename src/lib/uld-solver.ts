// ULD Loading Challenge — constraint satisfaction for cargo plane loading

export type ULDShape = "standard" | "tall" | "long";

export type ULD = {
  id: string;
  weight: number; // tons
  shape: ULDShape;
  color: string;
  emoji: string;
};

export type Compartment = {
  id: string;
  name: string;
  maxWeight: number;
  allowsTall: boolean;
  allowsLong: boolean;
  color: string;
};

export type LoadPlan = {
  assignments: Record<string, string>; // uld.id -> compartment.id
  valid: boolean;
  errors: string[];
  weightPerComp: Record<string, number>;
  balanced: boolean;
};

export const ULDS: ULD[] = [
  { id: "A1", weight: 4, shape: "tall",     color: "#ef4444", emoji: "📦" },
  { id: "A2", weight: 3, shape: "standard", color: "#f97316", emoji: "📦" },
  { id: "B1", weight: 5, shape: "long",     color: "#3b82f6", emoji: "📦" },
  { id: "B2", weight: 2, shape: "standard", color: "#06b6d4", emoji: "📦" },
  { id: "C1", weight: 3, shape: "tall",     color: "#22c55e", emoji: "📦" },
  { id: "C2", weight: 4, shape: "standard", color: "#a855f7", emoji: "📦" },
];

export const COMPARTMENTS: Compartment[] = [
  { id: "fwd", name: "Forward",  maxWeight: 10, allowsTall: true,  allowsLong: false, color: "#3b82f6" },
  { id: "mid", name: "Middle",   maxWeight: 12, allowsTall: true,  allowsLong: true,  color: "#22c55e" },
  { id: "aft", name: "Aft",      maxWeight: 8,  allowsTall: false, allowsLong: false, color: "#f97316" },
];

export function validatePlan(assignments: Record<string, string>): LoadPlan {
  const errors: string[] = [];
  const weightPerComp: Record<string, number> = { fwd: 0, mid: 0, aft: 0 };

  for (const uld of ULDS) {
    const compId = assignments[uld.id];
    if (!compId) continue;
    const comp = COMPARTMENTS.find((c) => c.id === compId)!;

    if (uld.shape === "tall" && !comp.allowsTall) errors.push(`${uld.id} is tall — can't fit in ${comp.name}`);
    if (uld.shape === "long" && !comp.allowsLong) errors.push(`${uld.id} is long — only fits in Middle`);
    weightPerComp[compId] = (weightPerComp[compId] ?? 0) + uld.weight;
  }

  for (const comp of COMPARTMENTS) {
    if ((weightPerComp[comp.id] ?? 0) > comp.maxWeight) {
      errors.push(`${comp.name} overweight: ${weightPerComp[comp.id]}t / ${comp.maxWeight}t max`);
    }
  }

  const fwdW = weightPerComp["fwd"] ?? 0;
  const aftW = weightPerComp["aft"] ?? 0;
  const balanced = Math.abs(fwdW - aftW) <= 2;
  if (!balanced) errors.push(`Balance off: Forward ${fwdW}t vs Aft ${aftW}t (must be within 2t)`);

  return { assignments, valid: errors.length === 0, errors, weightPerComp, balanced };
}

export function solveULD(): LoadPlan {
  // Constraint: B1 (long) → mid only. A1,C1 (tall) → fwd or mid only. Others anywhere.
  // Weight: fwd≤10, mid≤12, aft≤8. Balance: |fwd-aft|≤2.
  // Try all permutations of assignments
  const compIds = COMPARTMENTS.map((c) => c.id);

  function recurse(idx: number, current: Record<string, string>): LoadPlan | null {
    if (idx === ULDS.length) {
      const plan = validatePlan(current);
      return plan.valid ? plan : null;
    }
    const uld = ULDS[idx];
    const candidates = compIds.filter((cid) => {
      const comp = COMPARTMENTS.find((c) => c.id === cid)!;
      if (uld.shape === "tall" && !comp.allowsTall) return false;
      if (uld.shape === "long" && !comp.allowsLong) return false;
      return true;
    });

    for (const cid of candidates) {
      const result = recurse(idx + 1, { ...current, [uld.id]: cid });
      if (result) return result;
    }
    return null;
  }

  return recurse(0, {}) ?? validatePlan({});
}
