import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import NavBar from "@/components/NavBar.tsx";
import { runGrovers, optimalIterations, type GroverResult, type GroverIteration } from "@/lib/grovers.ts";
import { cn } from "@/lib/utils.ts";

const PRIMARY = "oklch(0.75 0.22 310)";
const TARGET_COLOR = "oklch(0.78 0.2 140)";
const MUTED = "oklch(0.55 0.05 260)";

// ── Amplitude bar chart ──────────────────────────────────────────────────────

function AmplitudeChart({
  iteration,
  targetIndex,
  numStates,
  iterNum,
  optimal,
}: {
  iteration: GroverIteration;
  targetIndex: number;
  numStates: number;
  iterNum: number;
  optimal: number;
}) {
  const maxProb = Math.max(...iteration.probabilities);
  const displayMax = Math.max(maxProb, 1 / numStates + 0.05);

  // For large state spaces, limit display to show target + neighbors
  const maxDisplay = 32;
  let displayIndices: number[];
  if (numStates <= maxDisplay) {
    displayIndices = Array.from({ length: numStates }, (_, i) => i);
  } else {
    // Show target and surrounding states
    const half = Math.floor(maxDisplay / 2);
    const start = Math.max(0, Math.min(targetIndex - half, numStates - maxDisplay));
    displayIndices = Array.from({ length: maxDisplay }, (_, i) => start + i);
  }

  return (
    <div className="w-full">
      <div className="flex items-end gap-0.5 h-28 px-1">
        {displayIndices.map((i) => {
          const prob = iteration.probabilities[i];
          const heightPct = displayMax > 0 ? (prob / displayMax) * 100 : 0;
          const isTarget = i === targetIndex;
          const amp = iteration.amplitudes[i];
          const isNeg = amp < 0;

          return (
            <div key={i} className="flex flex-col items-center flex-1 h-full justify-end relative group">
              <div className="w-full relative flex flex-col items-center justify-end h-full">
                {/* Positive bar */}
                {!isNeg && (
                  <motion.div
                    layout
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="w-full rounded-t-sm"
                    style={{ background: isTarget ? TARGET_COLOR : `${PRIMARY}80` }}
                  />
                )}
                {/* Negative bar (flip down from center) */}
                {isNeg && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="w-full rounded-b-sm absolute bottom-0"
                    style={{ background: `oklch(0.65 0.23 25 / 0.7)`, top: "50%" }}
                  />
                )}
              </div>

              {/* Target marker */}
              {isTarget && (
                <div
                  className="absolute -top-5 text-[8px] font-mono font-bold"
                  style={{ color: TARGET_COLOR }}
                >
                  ★
                </div>
              )}

              {/* Tooltip */}
              <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                <div className="bg-popover border border-border rounded px-2 py-1 text-[9px] font-mono whitespace-nowrap shadow-lg">
                  <p>|{i}⟩</p>
                  <p>p={prob.toFixed(4)}</p>
                  <p>a={amp.toFixed(4)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* X labels */}
      <div className="flex gap-0.5 px-1 mt-1">
        {displayIndices.map((i) => (
          <div
            key={i}
            className="flex-1 text-center text-[8px] font-mono truncate"
            style={{ color: i === targetIndex ? TARGET_COLOR : MUTED }}
          >
            {numStates <= 16 ? i : i === targetIndex ? `${i}` : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Probability over iterations chart ────────────────────────────────────────

function ProbabilityTimeline({ result }: { result: GroverResult }) {
  const maxIter = result.iterations.length - 1;
  const svgWidth = 500;
  const svgHeight = 120;
  const padL = 36;
  const padR = 12;
  const padT = 10;
  const padB = 24;
  const chartW = svgWidth - padL - padR;
  const chartH = svgHeight - padT - padB;

  const points = result.iterations.map((it, idx) => {
    const x = padL + (idx / Math.max(maxIter, 1)) * chartW;
    const y = padT + chartH - it.targetProbability * chartH;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  // Optimal iteration marker
  const optX = padL + (result.optimalIterations / Math.max(maxIter, 1)) * chartW;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full max-w-xl"
        style={{ minWidth: 280 }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1.0].map((v) => {
          const y = padT + chartH - v * chartH;
          return (
            <g key={v}>
              <line x1={padL} y1={y} x2={svgWidth - padR} y2={y} stroke="oklch(0.22 0.03 260)" strokeWidth={0.5} />
              <text x={padL - 4} y={y + 3} textAnchor="end" fontSize={7} fill={MUTED} fontFamily="monospace">
                {v.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Optimal marker */}
        <line
          x1={optX}
          y1={padT}
          x2={optX}
          y2={padT + chartH}
          stroke={TARGET_COLOR}
          strokeWidth={1}
          strokeDasharray="3 2"
          opacity={0.7}
        />
        <text x={optX + 3} y={padT + 8} fontSize={7} fill={TARGET_COLOR} fontFamily="monospace">
          optimal
        </text>

        {/* 1/N baseline */}
        {(() => {
          const y = padT + chartH - (1 / result.numStates) * chartH;
          return (
            <line
              x1={padL}
              y1={y}
              x2={svgWidth - padR}
              y2={y}
              stroke={MUTED}
              strokeWidth={0.5}
              strokeDasharray="2 2"
              opacity={0.5}
            />
          );
        })()}

        {/* Line */}
        <path d={pathD} fill="none" stroke={PRIMARY} strokeWidth={1.5} />

        {/* Dots */}
        {result.iterations.map((it, idx) => {
          const x = padL + (idx / Math.max(maxIter, 1)) * chartW;
          const y = padT + chartH - it.targetProbability * chartH;
          return (
            <circle
              key={idx}
              cx={x}
              cy={y}
              r={idx === result.optimalIterations ? 3.5 : 2}
              fill={idx === result.optimalIterations ? TARGET_COLOR : PRIMARY}
            />
          );
        })}

        {/* X axis labels */}
        {result.iterations
          .filter((_, i) => i % Math.max(1, Math.floor(result.iterations.length / 8)) === 0)
          .map((it) => {
            const x = padL + (it.iterationNumber / Math.max(maxIter, 1)) * chartW;
            return (
              <text
                key={it.iterationNumber}
                x={x}
                y={svgHeight - 4}
                textAnchor="middle"
                fontSize={7}
                fill={MUTED}
                fontFamily="monospace"
              >
                {it.iterationNumber}
              </text>
            );
          })}

        {/* Axis labels */}
        <text x={padL + chartW / 2} y={svgHeight - 1} textAnchor="middle" fontSize={7} fill={MUTED} fontFamily="monospace">
          iterations
        </text>
        <text
          x={8}
          y={padT + chartH / 2}
          textAnchor="middle"
          fontSize={7}
          fill={MUTED}
          fontFamily="monospace"
          transform={`rotate(-90, 8, ${padT + chartH / 2})`}
        >
          P(target)
        </text>
      </svg>
    </div>
  );
}

// ── Classical vs Quantum comparison bar ──────────────────────────────────────

function SpeedupDisplay({ numQubits }: { numQubits: number }) {
  const N = Math.pow(2, numQubits);
  const classical = N / 2; // expected classical searches
  const quantum = optimalIterations(N);
  const speedup = classical / quantum;

  return (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Classical (avg N/2)</span>
          <span className="font-mono">{classical.toLocaleString()} ops</span>
        </div>
        <div className="h-3 rounded-full bg-secondary overflow-hidden">
          <div className="h-full rounded-full bg-destructive/60 w-full" />
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Grover's (π/4·√N)</span>
          <span className="font-mono">{quantum.toLocaleString()} ops</span>
        </div>
        <div className="h-3 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: TARGET_COLOR }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(2, (quantum / classical) * 100)}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Quantum speedup: <span className="font-mono font-semibold" style={{ color: TARGET_COLOR }}>~{speedup.toFixed(1)}×</span> faster
      </p>
    </div>
  );
}

// ── Main Grover's page ─────────────────────────────────────────────────────────

export default function GroversPage() {
  const [numQubits, setNumQubits] = useState(3);
  const [targetIndex, setTargetIndex] = useState(5);
  const [result, setResult] = useState<GroverResult | null>(null);
  const [activeIter, setActiveIter] = useState(0);
  const [running, setRunning] = useState(false);

  const N = Math.pow(2, numQubits);
  const safeTarget = Math.min(targetIndex, N - 1);

  const runSim = useCallback(() => {
    setRunning(true);
    setResult(null);
    setActiveIter(0);
    setTimeout(() => {
      const r = runGrovers(numQubits, safeTarget);
      setResult(r);
      setActiveIter(r.optimalIterations);
      setRunning(false);
    }, 80);
  }, [numQubits, safeTarget]);

  const currentIter: GroverIteration | null = result?.iterations[activeIter] ?? null;

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Title */}
        <div>
          <p className="text-xs font-mono text-muted-foreground mb-1">Quantum Search Algorithm</p>
          <h1 className="text-3xl font-bold" style={{ color: PRIMARY }}>
            Grover's Algorithm Visualizer
          </h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-2xl">
            Grover's algorithm searches an unsorted database of N items in O(√N) oracle queries —
            a quadratic speedup over any classical algorithm. Watch amplitude amplification iterate
            toward the target state.
          </p>
        </div>

        {/* Controls */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-sm mb-4">Configuration</h2>
          <div className="flex flex-wrap gap-6 items-end">
            <div>
              <label className="block text-xs text-muted-foreground mb-2 font-mono">
                Qubits: <span className="text-foreground">{numQubits}</span>
                <span className="text-muted-foreground ml-2">({N} states)</span>
              </label>
              <input
                type="range"
                min={2}
                max={6}
                step={1}
                value={numQubits}
                onChange={(e) => {
                  const q = Number(e.target.value);
                  setNumQubits(q);
                  const newN = Math.pow(2, q);
                  setTargetIndex((prev) => Math.min(prev, newN - 1));
                  setResult(null);
                }}
                className="w-40 accent-[oklch(0.75_0.22_310)]"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground font-mono mt-0.5 w-40">
                <span>2q (4)</span>
                <span>3q (8)</span>
                <span>4q (16)</span>
                <span>5q (32)</span>
                <span>6q (64)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-muted-foreground mb-2 font-mono">
                Target index: <span className="text-foreground">{safeTarget}</span>
                <span className="text-muted-foreground ml-2">(|{safeTarget.toString(2).padStart(numQubits, "0")}⟩)</span>
              </label>
              <input
                type="range"
                min={0}
                max={N - 1}
                step={1}
                value={safeTarget}
                onChange={(e) => {
                  setTargetIndex(Number(e.target.value));
                  setResult(null);
                }}
                className="w-40 accent-[oklch(0.78_0.2_140)]"
              />
            </div>

            <div className="text-xs font-mono text-muted-foreground space-y-0.5">
              <p>Optimal iterations: <span className="text-foreground">{optimalIterations(N)}</span></p>
              <p>Classical avg: <span className="text-foreground">{Math.floor(N / 2)} queries</span></p>
            </div>

            <button
              onClick={runSim}
              disabled={running}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
              style={{ background: PRIMARY, color: "oklch(0.06 0.02 260)" }}
            >
              {running ? "Simulating…" : "Run Algorithm"}
            </button>
          </div>
        </div>

        {/* Results */}
        <AnimatePresence>
          {result && currentIter && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-5"
            >
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "State space N", value: result.numStates, color: PRIMARY },
                  { label: "Optimal iters", value: result.optimalIterations, color: PRIMARY },
                  {
                    label: "Success probability",
                    value: `${(result.successProbability * 100).toFixed(1)}%`,
                    color: TARGET_COLOR,
                  },
                  {
                    label: "Measured",
                    value: `|${result.finalMeasurement}⟩`,
                    color: result.finalMeasurement === result.targetIndex ? TARGET_COLOR : "oklch(0.65 0.23 25)",
                  },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                    <p className="text-xs text-muted-foreground font-mono mb-1">{s.label}</p>
                    <p className="text-2xl font-bold font-mono" style={{ color: s.color }}>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Measurement result */}
              <div
                className={cn(
                  "rounded-xl border p-4 flex items-start gap-3",
                  result.finalMeasurement === result.targetIndex
                    ? "border-primary/30 bg-primary/10"
                    : "border-destructive/30 bg-destructive/10"
                )}
              >
                <span className="text-lg">
                  {result.finalMeasurement === result.targetIndex ? "✓" : "✗"}
                </span>
                <div className="text-sm">
                  <p className="font-semibold">
                    {result.finalMeasurement === result.targetIndex
                      ? `Target found! Measured |${result.finalMeasurement}⟩`
                      : `Measured |${result.finalMeasurement}⟩ — not the target (statistical chance)`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Success probability at optimal iterations:{" "}
                    <span className="font-mono">{(result.successProbability * 100).toFixed(2)}%</span>.
                    Run again to see the Born rule sampling in action.
                  </p>
                </div>
              </div>

              {/* Amplitude visualization */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div>
                    <h2 className="font-semibold text-sm">Amplitude Distribution</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Iteration{" "}
                      <span className="font-mono text-foreground">{activeIter}</span> of{" "}
                      <span className="font-mono text-foreground">{result.iterations.length - 1}</span>
                      {activeIter === result.optimalIterations && (
                        <span className="ml-2 text-primary font-mono">[optimal]</span>
                      )}
                    </p>
                  </div>

                  {/* Iteration scrubber */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveIter((v) => Math.max(0, v - 1))}
                      disabled={activeIter === 0}
                      className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-sm hover:bg-secondary disabled:opacity-30 transition-colors"
                    >
                      ‹
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={result.iterations.length - 1}
                      value={activeIter}
                      onChange={(e) => setActiveIter(Number(e.target.value))}
                      className="w-32 accent-[oklch(0.75_0.22_310)]"
                    />
                    <button
                      onClick={() => setActiveIter((v) => Math.min(result.iterations.length - 1, v + 1))}
                      disabled={activeIter === result.iterations.length - 1}
                      className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-sm hover:bg-secondary disabled:opacity-30 transition-colors"
                    >
                      ›
                    </button>
                  </div>
                </div>

                {/* Key stats for current iter */}
                <div className="flex gap-4 mb-4 text-xs font-mono">
                  <span className="text-muted-foreground">
                    P(target): <span style={{ color: TARGET_COLOR }}>{(currentIter.targetProbability * 100).toFixed(2)}%</span>
                  </span>
                  <span className="text-muted-foreground">
                    avg amplitude: <span className="text-foreground">{currentIter.averageAmplitude.toFixed(4)}</span>
                  </span>
                </div>

                <AmplitudeChart
                  iteration={currentIter}
                  targetIndex={result.targetIndex}
                  numStates={result.numStates}
                  iterNum={activeIter}
                  optimal={result.optimalIterations}
                />

                <p className="text-xs text-muted-foreground mt-2">
                  {result.numStates > 32
                    ? `Showing states near target |${result.targetIndex}⟩. Hover bars for exact values.`
                    : "Hover bars for exact amplitude and probability values."}
                  <span className="ml-2">★ = target state</span>
                </p>
              </div>

              {/* Probability timeline */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-semibold text-sm mb-1">Target Probability vs. Iterations</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Amplitude amplification oscillates — past the optimal point, probability decreases.
                </p>
                <ProbabilityTimeline result={result} />
              </div>

              {/* Speedup comparison */}
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="rounded-xl border border-border bg-card p-5">
                  <h2 className="font-semibold text-sm mb-4">Classical vs. Quantum Speedup</h2>
                  <SpeedupDisplay numQubits={numQubits} />
                </div>

                <div className="rounded-xl border border-border bg-card p-5">
                  <h2 className="font-semibold text-sm mb-4">How It Works</h2>
                  <div className="space-y-3">
                    {[
                      {
                        step: "H⊗ⁿ",
                        title: "Hadamard transform",
                        desc: "All N states put into uniform superposition: amplitude 1/√N each.",
                      },
                      {
                        step: "Uω",
                        title: "Oracle phase kickback",
                        desc: "Flip the sign of only the target amplitude. Encodes 'is this the solution?' as a phase.",
                      },
                      {
                        step: "Us",
                        title: "Diffuser (inversion about mean)",
                        desc: "2|ψ⟩⟨ψ|−I: amplifies above-mean amplitudes, suppresses below-mean. Target grows ~2/√N per iteration.",
                      },
                      {
                        step: "M",
                        title: "Measure",
                        desc: `After ~π/4·√N iterations, Born rule gives ${(result.successProbability * 100).toFixed(0)}% chance of finding the target.`,
                      },
                    ].map((s) => (
                      <div key={s.step} className="flex gap-3 items-start">
                        <span
                          className="text-xs font-mono font-bold shrink-0 mt-0.5 w-8 text-right"
                          style={{ color: PRIMARY }}
                        >
                          {s.step}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{s.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!result && !running && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-4xl mb-4">|ψ⟩</p>
            <p className="text-sm">Configure and run the algorithm above.</p>
          </div>
        )}
      </main>
    </div>
  );
}
