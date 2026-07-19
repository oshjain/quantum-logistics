// Grover's Search Algorithm - Full quantum simulation
// Simulates the full 2^n dimensional state vector without mocks.
// Uses exact matrix operations for the Oracle and Diffuser.

export interface GroverIteration {
  iterationNumber: number;
  amplitudes: number[]; // Real amplitudes (we keep purely real for standard Grover's)
  probabilities: number[];
  targetProbability: number;
  averageAmplitude: number;
}

export interface GroverResult {
  numQubits: number;
  numStates: number;
  targetIndex: number;
  optimalIterations: number;
  iterations: GroverIteration[];
  finalMeasurement: number;
  successProbability: number;
}

/**
 * Apply Hadamard to all qubits simultaneously (tensor product H⊗n)
 * Starting from |0...0⟩ this gives uniform superposition: 1/√N for all states.
 */
function initUniformSuperposition(N: number): number[] {
  const amp = 1 / Math.sqrt(N);
  return new Array(N).fill(amp);
}

/**
 * Oracle: flips the sign of the target state amplitude.
 * This encodes the search target as a phase kickback.
 */
function applyOracle(amplitudes: number[], target: number): number[] {
  const result = [...amplitudes];
  result[target] = -result[target];
  return result;
}

/**
 * Grover Diffuser (inversion about the mean):
 * D = 2|ψ⟩⟨ψ| - I
 * For each amplitude: new_amp[i] = 2*mean - amp[i]
 * This amplifies the target amplitude and suppresses others.
 */
function applyDiffuser(amplitudes: number[]): number[] {
  const N = amplitudes.length;
  const mean = amplitudes.reduce((sum, a) => sum + a, 0) / N;
  return amplitudes.map((a) => 2 * mean - a);
}

function computeProbabilities(amplitudes: number[]): number[] {
  return amplitudes.map((a) => a * a);
}

/**
 * Optimal number of Grover iterations: floor(π/4 * √N)
 * This maximizes success probability.
 */
export function optimalIterations(N: number): number {
  return Math.floor((Math.PI / 4) * Math.sqrt(N));
}

export function runGrovers(numQubits: number, targetIndex: number): GroverResult {
  const N = Math.pow(2, numQubits);
  const optimal = optimalIterations(N);

  let amplitudes = initUniformSuperposition(N);

  const iterations: GroverIteration[] = [];

  // Record initial state (iteration 0 = after Hadamard, before any oracle)
  const initProbs = computeProbabilities(amplitudes);
  iterations.push({
    iterationNumber: 0,
    amplitudes: [...amplitudes],
    probabilities: initProbs,
    targetProbability: initProbs[targetIndex],
    averageAmplitude: amplitudes.reduce((s, a) => s + a, 0) / N,
  });

  // Run enough iterations to show the full oscillation pattern
  // We run up to 2*optimal+1 iterations to show amplitude amplification and decay
  const maxIter = Math.max(optimal * 2 + 1, 3);

  for (let iter = 1; iter <= maxIter; iter++) {
    amplitudes = applyOracle(amplitudes, targetIndex);
    amplitudes = applyDiffuser(amplitudes);

    const probs = computeProbabilities(amplitudes);
    iterations.push({
      iterationNumber: iter,
      amplitudes: [...amplitudes],
      probabilities: probs,
      targetProbability: probs[targetIndex],
      averageAmplitude: amplitudes.reduce((s, a) => s + a, 0) / N,
    });
  }

  // Final measurement at optimal iterations (Born rule sampling)
  const optimalAmps = iterations[optimal];
  const probs = optimalAmps.probabilities;

  // Sample from probability distribution
  const rand = Math.random();
  let cumulative = 0;
  let finalMeasurement = 0;
  for (let i = 0; i < N; i++) {
    cumulative += probs[i];
    if (rand <= cumulative) {
      finalMeasurement = i;
      break;
    }
  }

  return {
    numQubits,
    numStates: N,
    targetIndex,
    optimalIterations: optimal,
    iterations,
    finalMeasurement,
    successProbability: probs[targetIndex],
  };
}
