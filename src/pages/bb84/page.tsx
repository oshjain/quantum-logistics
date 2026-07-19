import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import NavBar from "@/components/NavBar.tsx";
import { runBB84, type BB84Result, type BB84Step, type Basis, type Bit } from "@/lib/bb84.ts";
import { cn } from "@/lib/utils.ts";

// ── Symbol helpers ────────────────────────────────────────────────────────────

function basisSymbol(basis: Basis, bit: Bit): string {
  if (basis === "rectilinear") return bit === 0 ? "→" : "↑";
  return bit === 0 ? "↗" : "↘";
}

function basisLabel(basis: Basis): string {
  return basis === "rectilinear" ? "+" : "×";
}

const ALICE_COLOR = "oklch(0.72 0.22 200)";
const BOB_COLOR = "oklch(0.78 0.2 140)";
const EVE_COLOR = "oklch(0.65 0.23 25)";

// ── Cell component ─────────────────────────────────────────────────────────────

function Cell({
  value,
  color,
  mono = false,
  highlight = false,
  dim = false,
}: {
  value: string;
  color?: string;
  mono?: boolean;
  highlight?: boolean;
  dim?: boolean;
}) {
  return (
    <div
      className={cn(
        "text-center text-xs py-1.5 px-1 rounded transition-all",
        mono && "font-mono",
        highlight && "ring-1 ring-inset",
        dim && "opacity-30"
      )}
      style={{
        color: color ?? "inherit",
        background: highlight ? `${color}18` : "transparent",
      }}
    >
      {value}
    </div>
  );
}

// ── Qubit row display ──────────────────────────────────────────────────────────

function QubitTable({ result, showEve }: { result: BB84Result; showEve: boolean }) {
  const steps = result.steps.slice(0, 24); // Show first 24 for readability

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Header */}
        <div
          className="grid text-[10px] font-mono text-muted-foreground mb-1 px-1"
          style={{ gridTemplateColumns: showEve ? "2rem repeat(24, 1fr)" : "2rem repeat(24, 1fr)" }}
        >
          <div className="text-right pr-2">#</div>
          {steps.map((s) => (
            <div key={s.index} className="text-center">
              {s.index + 1}
            </div>
          ))}
        </div>

        {/* Alice bit */}
        <div
          className="grid items-center mb-0.5"
          style={{ gridTemplateColumns: "2rem repeat(24, 1fr)" }}
        >
          <div className="text-[10px] text-right pr-2 font-mono" style={{ color: ALICE_COLOR }}>
            A bit
          </div>
          {steps.map((s) => (
            <Cell key={s.index} value={String(s.aliceBit)} color={ALICE_COLOR} mono />
          ))}
        </div>

        {/* Alice basis */}
        <div
          className="grid items-center mb-0.5"
          style={{ gridTemplateColumns: "2rem repeat(24, 1fr)" }}
        >
          <div className="text-[10px] text-right pr-2 font-mono" style={{ color: ALICE_COLOR }}>
            A basis
          </div>
          {steps.map((s) => (
            <Cell key={s.index} value={basisLabel(s.aliceBasis)} color={ALICE_COLOR} />
          ))}
        </div>

        {/* Alice photon symbol */}
        <div
          className="grid items-center mb-1"
          style={{ gridTemplateColumns: "2rem repeat(24, 1fr)" }}
        >
          <div className="text-[10px] text-right pr-2 font-mono" style={{ color: ALICE_COLOR }}>
            A photon
          </div>
          {steps.map((s) => (
            <Cell key={s.index} value={basisSymbol(s.aliceBasis, s.aliceBit)} color={ALICE_COLOR} />
          ))}
        </div>

        {/* Eve rows */}
        {showEve && (
          <>
            <div className="h-px bg-border/30 my-1" />
            <div
              className="grid items-center mb-0.5"
              style={{ gridTemplateColumns: "2rem repeat(24, 1fr)" }}
            >
              <div className="text-[10px] text-right pr-2 font-mono" style={{ color: EVE_COLOR }}>
                E basis
              </div>
              {steps.map((s) => (
                <Cell
                  key={s.index}
                  value={s.eveBasis ? basisLabel(s.eveBasis) : "-"}
                  color={EVE_COLOR}
                />
              ))}
            </div>
            <div
              className="grid items-center mb-1"
              style={{ gridTemplateColumns: "2rem repeat(24, 1fr)" }}
            >
              <div className="text-[10px] text-right pr-2 font-mono" style={{ color: EVE_COLOR }}>
                E meas
              </div>
              {steps.map((s) => (
                <Cell
                  key={s.index}
                  value={s.eveMeasuredBit !== undefined ? String(s.eveMeasuredBit) : "-"}
                  color={EVE_COLOR}
                />
              ))}
            </div>
            <div className="h-px bg-border/30 my-1" />
          </>
        )}

        {/* Bob basis */}
        <div
          className="grid items-center mb-0.5"
          style={{ gridTemplateColumns: "2rem repeat(24, 1fr)" }}
        >
          <div className="text-[10px] text-right pr-2 font-mono" style={{ color: BOB_COLOR }}>
            B basis
          </div>
          {steps.map((s) => (
            <Cell key={s.index} value={basisLabel(s.bobBasis)} color={BOB_COLOR} />
          ))}
        </div>

        {/* Bob measurement */}
        <div
          className="grid items-center mb-0.5"
          style={{ gridTemplateColumns: "2rem repeat(24, 1fr)" }}
        >
          <div className="text-[10px] text-right pr-2 font-mono" style={{ color: BOB_COLOR }}>
            B meas
          </div>
          {steps.map((s) => (
            <Cell key={s.index} value={String(s.bobMeasuredBit)} color={BOB_COLOR} mono />
          ))}
        </div>

        {/* Sifted / discarded */}
        <div
          className="grid items-center mt-1"
          style={{ gridTemplateColumns: "2rem repeat(24, 1fr)" }}
        >
          <div className="text-[10px] text-right pr-2 font-mono text-muted-foreground">sift</div>
          {steps.map((s) => (
            <div
              key={s.index}
              className={cn(
                "text-center text-xs py-1 rounded font-mono",
                s.basesMatch
                  ? s.errorDetected
                    ? "bg-destructive/20 text-destructive"
                    : "bg-primary/15 text-primary"
                  : "text-muted-foreground/40"
              )}
            >
              {s.basesMatch ? (s.errorDetected ? "✗" : "✓") : "×"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Key bits display ────────────────────────────────────────────────────────────

function KeyDisplay({ label, bits, color }: { label: string; bits: Bit[]; color: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground font-mono mb-2">{label}</p>
      <div className="flex flex-wrap gap-1">
        {bits.slice(0, 40).map((b, i) => (
          <span
            key={i}
            className="font-mono text-xs w-5 h-5 flex items-center justify-center rounded"
            style={{ background: `${color}20`, color }}
          >
            {b}
          </span>
        ))}
        {bits.length > 40 && (
          <span className="text-xs text-muted-foreground font-mono self-center">+{bits.length - 40} more</span>
        )}
      </div>
    </div>
  );
}

// ── Step-by-step detail modal ──────────────────────────────────────────────────

function StepDetail({ step, onClose }: { step: BB84Step; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-card border border-border rounded-xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold mb-4">Qubit #{step.index + 1} — Detail</h3>

        <div className="space-y-3 text-sm">
          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs font-mono mb-2" style={{ color: ALICE_COLOR }}>Alice</p>
            <p>Bit: <span className="font-mono">{step.aliceBit}</span></p>
            <p>Basis: <span className="font-mono">{basisLabel(step.aliceBasis)} ({step.aliceBasis})</span></p>
            <p>Photon: <span className="font-mono text-lg">{basisSymbol(step.aliceBasis, step.aliceBit)}</span></p>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              |ψ⟩ = [{step.aliceState.stateVector[0].toFixed(3)}, {step.aliceState.stateVector[1].toFixed(3)}]
            </p>
          </div>

          {step.evePresent && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-xs font-mono mb-2" style={{ color: EVE_COLOR }}>Eve (intercepted!)</p>
              <p>Measured basis: <span className="font-mono">{step.eveBasis ? basisLabel(step.eveBasis) : "—"}</span></p>
              <p>Measured bit: <span className="font-mono">{step.eveMeasuredBit ?? "—"}</span></p>
              {step.eveBasis !== step.aliceBasis && (
                <p className="text-xs text-destructive mt-1">⚠ Wrong basis — state collapsed!</p>
              )}
            </div>
          )}

          <div className="p-3 rounded-lg bg-secondary/50">
            <p className="text-xs font-mono mb-2" style={{ color: BOB_COLOR }}>Bob</p>
            <p>Basis: <span className="font-mono">{basisLabel(step.bobBasis)} ({step.bobBasis})</span></p>
            <p>Measured: <span className="font-mono">{step.bobMeasuredBit}</span></p>
          </div>

          <div className={cn(
            "p-3 rounded-lg text-center font-medium",
            step.basesMatch
              ? step.errorDetected
                ? "bg-destructive/20 text-destructive"
                : "bg-primary/15 text-primary"
              : "bg-muted text-muted-foreground"
          )}>
            {step.basesMatch
              ? step.errorDetected
                ? "✗ Bases matched but bits differ — Eve detected!"
                : "✓ Bases matched — bit kept in key"
              : "× Bases differ — bit discarded"}
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Close
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Main BB84 page ─────────────────────────────────────────────────────────────

export default function BB84Page() {
  const [numQubits, setNumQubits] = useState(40);
  const [eavesDrop, setEavesDrop] = useState(false);
  const [result, setResult] = useState<BB84Result | null>(null);
  const [selectedStep, setSelectedStep] = useState<BB84Step | null>(null);
  const [running, setRunning] = useState(false);

  const runSimulation = useCallback(() => {
    setRunning(true);
    setResult(null);
    // Small async delay for visual feedback
    setTimeout(() => {
      const r = runBB84(numQubits, eavesDrop);
      setResult(r);
      setRunning(false);
    }, 80);
  }, [numQubits, eavesDrop]);

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Title */}
        <div>
          <p className="text-xs font-mono text-muted-foreground mb-1">Quantum Key Distribution</p>
          <h1 className="text-3xl font-bold" style={{ color: ALICE_COLOR }}>
            BB84 Protocol Simulator
          </h1>
          <p className="text-muted-foreground text-sm mt-2 max-w-2xl">
            Alice encodes random bits in random quantum bases. Bob measures in random bases. They
            publicly compare bases, keep matching positions, and optionally detect eavesdropping via
            the quantum no-cloning theorem.
          </p>
        </div>

        {/* Controls */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-sm mb-4">Configuration</h2>
          <div className="flex flex-wrap gap-6 items-end">
            <div>
              <label className="block text-xs text-muted-foreground mb-2 font-mono">
                Number of qubits: <span className="text-foreground">{numQubits}</span>
              </label>
              <input
                type="range"
                min={16}
                max={120}
                step={4}
                value={numQubits}
                onChange={(e) => setNumQubits(Number(e.target.value))}
                className="w-48 accent-primary"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                onClick={() => setEavesDrop((v) => !v)}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors border",
                  eavesDrop ? "bg-destructive/80 border-destructive" : "bg-secondary border-border"
                )}
              >
                <div
                  className={cn(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm",
                    eavesDrop ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </div>
              <div>
                <p className="text-sm font-medium">Enable Eavesdropping (Eve)</p>
                <p className="text-xs text-muted-foreground">Eve intercepts and re-sends qubits</p>
              </div>
            </label>

            <button
              onClick={runSimulation}
              disabled={running}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
              style={{ background: ALICE_COLOR, color: "oklch(0.06 0.02 260)" }}
            >
              {running ? "Simulating…" : "Run Simulation"}
            </button>
          </div>
        </div>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-5"
            >
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Raw qubits", value: result.rawKeyLength, color: ALICE_COLOR },
                  { label: "Sifted key length", value: result.siftedKeyLength, color: BOB_COLOR },
                  {
                    label: "Error rate",
                    value: `${(result.errorRate * 100).toFixed(1)}%`,
                    color: result.errorRate > 0.05 ? EVE_COLOR : BOB_COLOR,
                  },
                  {
                    label: "Key match",
                    value: result.keyMatch ? "Yes" : "No",
                    color: result.keyMatch ? BOB_COLOR : EVE_COLOR,
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

              {/* Eavesdropping alert */}
              {eavesDrop && result.errorRate > 0.1 && (
                <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 flex items-start gap-3">
                  <span className="text-destructive text-lg">⚠</span>
                  <div>
                    <p className="font-semibold text-destructive text-sm">Eavesdropping Detected!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Error rate of {(result.errorRate * 100).toFixed(1)}% exceeds the 11% threshold.
                      Alice and Bob would abort the protocol. In BB84 without Eve, matching bases always
                      produce identical bits. Eve's 50% wrong-basis measurements introduce ~25% errors.
                    </p>
                  </div>
                </div>
              )}

              {!eavesDrop && result.errorRate === 0 && (
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 flex items-start gap-3">
                  <span className="text-primary text-lg">✓</span>
                  <div>
                    <p className="font-semibold text-primary text-sm">Secure Channel Established</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      No eavesdropping detected. Alice and Bob share an identical {result.siftedKeyLength}-bit
                      secret key. The quantum no-cloning theorem guarantees any intercept would have been
                      detected.
                    </p>
                  </div>
                </div>
              )}

              {/* Qubit table */}
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sm">
                    Qubit Exchange Table
                    <span className="text-muted-foreground font-normal ml-2 text-xs">
                      (showing first 24 of {result.rawKeyLength})
                    </span>
                  </h2>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-primary/40" />
                      kept
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-destructive/40" />
                      error
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-sm bg-secondary" />
                      discarded
                    </span>
                  </div>
                </div>
                <QubitTable result={result} showEve={eavesDrop} />
              </div>

              {/* Keys */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border bg-card p-5">
                  <KeyDisplay label="Alice's sifted key" bits={result.aliceKey} color={ALICE_COLOR} />
                </div>
                <div className="rounded-xl border border-border bg-card p-5">
                  <KeyDisplay label="Bob's sifted key" bits={result.bobKey} color={BOB_COLOR} />
                </div>
              </div>

              {/* Protocol explanation */}
              <div className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-semibold text-sm mb-4">How BB84 Works</h2>
                <div className="grid sm:grid-cols-4 gap-4">
                  {[
                    {
                      step: "1",
                      title: "Alice encodes",
                      desc: "Alice picks random bits and random bases (+/×), encodes each bit as a photon polarization.",
                    },
                    {
                      step: "2",
                      title: "Bob measures",
                      desc: "Bob picks random measurement bases. If his basis matches Alice's, he gets the correct bit. Otherwise, 50/50 random.",
                    },
                    {
                      step: "3",
                      title: "Sifting",
                      desc: "Alice and Bob publicly announce their bases (not their bits). They discard all positions where bases differ.",
                    },
                    {
                      step: "4",
                      title: "Error check",
                      desc: "They compare a sample of their remaining bits. Error rate > 11% reveals eavesdropping — abort and restart.",
                    },
                  ].map((s) => (
                    <div key={s.step} className="space-y-1.5">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: `${ALICE_COLOR}30`, color: ALICE_COLOR }}
                      >
                        {s.step}
                      </div>
                      <p className="font-medium text-sm">{s.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!result && !running && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-4xl mb-4">⟨ψ|</p>
            <p className="text-sm">Configure and run the simulation above.</p>
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedStep && <StepDetail step={selectedStep} onClose={() => setSelectedStep(null)} />}
      </AnimatePresence>
    </div>
  );
}
