// BB84 Quantum Key Distribution Protocol - Full implementation
// No mocks. All quantum behavior simulated with correct probability math.

export type Basis = "rectilinear" | "diagonal";
export type Bit = 0 | 1;

export interface QubitState {
  bit: Bit;
  basis: Basis;
  // Actual quantum state vector [alpha, beta] in computational basis
  // |0⟩ = [1,0], |1⟩ = [0,1]
  // |+⟩ = [1/√2, 1/√2], |−⟩ = [1/√2, -1/√2]
  stateVector: [number, number];
}

export interface BB84Step {
  index: number;
  aliceBit: Bit;
  aliceBasis: Basis;
  aliceState: QubitState;
  evePresent: boolean;
  eveBasis?: Basis;
  eveMeasuredBit?: Bit;
  eveModifiedState?: QubitState;
  bobBasis: Basis;
  bobMeasuredBit: Bit;
  basesMatch: boolean;
  errorDetected: boolean; // only meaningful if basesMatch
}

export interface BB84Result {
  steps: BB84Step[];
  aliceKey: Bit[];
  bobKey: Bit[];
  rawKeyLength: number;
  siftedKeyLength: number;
  errorRate: number;
  keyMatch: boolean;
}

function randomBit(): Bit {
  return Math.random() < 0.5 ? 0 : 1;
}

function randomBasis(): Basis {
  return Math.random() < 0.5 ? "rectilinear" : "diagonal";
}

/** Encode a bit in a given basis → state vector */
function encodeQubit(bit: Bit, basis: Basis): QubitState {
  const INV_SQRT2 = 1 / Math.sqrt(2);
  let stateVector: [number, number];

  if (basis === "rectilinear") {
    // |0⟩ or |1⟩
    stateVector = bit === 0 ? [1, 0] : [0, 1];
  } else {
    // |+⟩ = (|0⟩+|1⟩)/√2 for bit=0, |−⟩ = (|0⟩−|1⟩)/√2 for bit=1
    stateVector = bit === 0 ? [INV_SQRT2, INV_SQRT2] : [INV_SQRT2, -INV_SQRT2];
  }

  return { bit, basis, stateVector };
}

/**
 * Measure a qubit state in a given basis.
 * Returns the measured bit and collapses the state.
 *
 * Quantum mechanics:
 * - If measuring in same basis as preparation: deterministic (100% correct)
 * - If measuring in different basis: 50/50 random result (Born rule)
 */
function measureQubit(state: QubitState, measBasis: Basis): { bit: Bit; collapsedState: QubitState } {
  if (state.basis === measBasis) {
    // Measuring in same basis — deterministic outcome
    return { bit: state.bit, collapsedState: { ...state, basis: measBasis } };
  }

  // Different basis — quantum superposition causes random 50/50 outcome (Born rule)
  const measBit = randomBit();
  const collapsedState = encodeQubit(measBit, measBasis);
  return { bit: measBit, collapsedState };
}

export function runBB84(numQubits: number, eavesDrop: boolean): BB84Result {
  const steps: BB84Step[] = [];

  for (let i = 0; i < numQubits; i++) {
    const aliceBit = randomBit();
    const aliceBasis = randomBasis();
    const aliceState = encodeQubit(aliceBit, aliceBasis);

    let transmittedState = aliceState;
    let eveBasis: Basis | undefined;
    let eveMeasuredBit: Bit | undefined;
    let eveModifiedState: QubitState | undefined;

    if (eavesDrop) {
      // Eve intercepts: measures in a random basis, then re-sends her collapsed state
      eveBasis = randomBasis();
      const eveMeasurement = measureQubit(aliceState, eveBasis);
      eveMeasuredBit = eveMeasurement.bit;
      eveModifiedState = eveMeasurement.collapsedState;
      transmittedState = eveModifiedState;
    }

    const bobBasis = randomBasis();
    const bobMeasurement = measureQubit(transmittedState, bobBasis);
    const bobMeasuredBit = bobMeasurement.bit;
    const basesMatch = aliceBasis === bobBasis;

    // If bases match, without eavesdropping Alice and Bob must agree.
    // With eavesdropping, they may disagree 25% of the time.
    const errorDetected = basesMatch && bobMeasuredBit !== aliceBit;

    steps.push({
      index: i,
      aliceBit,
      aliceBasis,
      aliceState,
      evePresent: eavesDrop,
      eveBasis,
      eveMeasuredBit,
      eveModifiedState,
      bobBasis,
      bobMeasuredBit,
      basesMatch,
      errorDetected,
    });
  }

  // Sifting: keep only positions where bases matched
  const siftedSteps = steps.filter((s) => s.basesMatch);
  const aliceKey: Bit[] = siftedSteps.map((s) => s.aliceBit);
  const bobKey: Bit[] = siftedSteps.map((s) => s.bobMeasuredBit);

  const errors = siftedSteps.filter((s) => s.errorDetected).length;
  const errorRate = siftedSteps.length > 0 ? errors / siftedSteps.length : 0;
  const keyMatch = aliceKey.join("") === bobKey.join("");

  return {
    steps,
    aliceKey,
    bobKey,
    rawKeyLength: numQubits,
    siftedKeyLength: siftedSteps.length,
    errorRate,
    keyMatch,
  };
}
