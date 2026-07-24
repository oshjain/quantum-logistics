import { motion } from "motion/react";
import { Link } from "react-router-dom";
import NavBar from "@/components/NavBar.tsx";
import { FadeInView, RevealText, AnimatedCounter, GlowCard } from "@/components/animations/index.ts";
import { USE_CASES, MARKET_STATS, ADOPTION_SECTORS, TIMELINE } from "@/lib/site-data.ts";

function SectionPill({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border/40 to-border/40" />
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em] px-2 shrink-0">{children}</span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border/40 to-border/40" />
    </div>
  );
}

export default function Learn() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      {/* ═══════ HERO ═══════ */}
      <section className="relative px-4 pt-12 pb-16 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div
          className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full blur-[140px] opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, #a855f7, transparent 70%)" }}
        />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <FadeInView>
            <div className="inline-flex items-center gap-2 border border-purple-500/25 bg-purple-500/8 text-purple-400 px-4 py-1.5 rounded-full text-xs font-medium mb-6 font-mono tracking-wider">
              📚 Learning Path
            </div>
          </FadeInView>
          <RevealText
            as="h1"
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-4"
            delay={0.15}
            stagger={0.035}
          >
            Understanding Quantum Computing
          </RevealText>
          <FadeInView delay={0.5} direction="none">
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              From the coin that's heads and tails at the same time, to the multi-trillion-dollar market taking shape — here's everything you need to know.
            </p>
          </FadeInView>
        </div>
      </section>

      {/* ═══════ SECTION 1: WHAT IS QUANTUM ═══════ */}
      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <FadeInView>
            <SectionPill>Chapter 1</SectionPill>
          </FadeInView>

          {/* Big analogy card */}
          <FadeInView direction="up">
            <div
              className="rounded-2xl border border-border/50 p-8 mb-8 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, oklch(0.1 0.03 260), oklch(0.12 0.04 280))" }}
            >
              <div
                className="absolute right-0 top-0 w-72 h-72 rounded-full blur-[100px] opacity-10 pointer-events-none"
                style={{ background: "oklch(0.72 0.22 200)" }}
              />
              <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">The simple version</p>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-4 leading-tight">
                    Imagine a coin that can be{" "}
                    <span style={{ color: "oklch(0.72 0.22 200)" }}>heads and tails at the same time</span>
                  </h2>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    A normal computer uses <strong className="text-foreground">bits</strong> — tiny switches that are either OFF (0) or ON (1). It solves problems by trying one answer at a time, like flipping a coin once per guess.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mt-3 text-sm">
                    A quantum computer uses <strong className="text-foreground">qubits</strong> — which can be 0, 1, or <em>both at the same time</em> (called <strong className="text-foreground">superposition</strong>). It tries every possible answer simultaneously. For huge problems — like routing 10,000 trucks — that difference is the gap between hours and milliseconds.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Classical bit", visual: "0 or 1", sub: "One answer at a time", icon: "🪙", color: "#64748b" },
                    { label: "Qubit", visual: "0 + 1 + …", sub: "All answers simultaneously", icon: "✨", color: "oklch(0.72 0.22 200)" },
                    { label: "Classical search", visual: "10,000 steps", sub: "Check each door one by one", icon: "🔦", color: "#64748b" },
                    { label: "Grover's algorithm", visual: "100 steps", sub: "Quantum shortcut (√10,000)", icon: "⚡", color: "#a855f7" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-border/40 p-4 text-center"
                      style={{ background: "oklch(0.1 0.02 260 / 0.6)" }}
                    >
                      <div className="text-2xl mb-2">{item.icon}</div>
                      <p className="text-[10px] font-mono text-muted-foreground mb-1">{item.label}</p>
                      <p className="font-bold text-sm" style={{ color: item.color }}>{item.visual}</p>
                      <p className="text-[9px] text-muted-foreground mt-1">{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeInView>

          {/* Three real-world analogy cards */}
          <FadeInView direction="up" delay={0.2}>
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              {[
                { icon: "🗺️", title: "The sat-nav problem", body: "Your sat-nav finds the best route through a city in seconds. But a logistics company with 500 trucks and 10,000 stops? Classical computers would take longer than the age of the universe to check every combination.", source: "Vehicle Routing Problem: NP-hard; n! possible routes for n stops", color: "#f59e0b" },
                { icon: "💊", title: "The medicine problem", body: "Designing a new cancer drug means testing how billions of molecules interact. Classical computers simulate one interaction per step. A quantum computer simulates all of them at once — cutting drug development from 12 years to potentially 12 months.", source: "Tufts Center for Drug Development · Nature Reviews Drug Discovery, 2023", color: "#a855f7" },
                { icon: "🔐", title: "The password problem", body: "Your bank password is safe because cracking it would take a classical computer millions of years. A quantum computer could do it in minutes. That's why governments are racing to build quantum-proof encryption.", source: "NIST Post-Quantum Cryptography · Shor's Algorithm, 1994", color: "#f87171" },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border border-border/40 p-5" style={{ background: "oklch(0.1 0.02 260 / 0.5)" }}>
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-semibold text-base mb-2" style={{ color: item.color }}>{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                  <p className="text-[8px] text-muted-foreground/50 font-mono mt-2 italic">{item.source}</p>
                </div>
              ))}
            </div>
          </FadeInView>
        </div>
      </section>

      {/* ═══════ SECTION 2: USE CASES ═══════ */}
      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <FadeInView>
            <SectionPill>Chapter 2 — When to use it</SectionPill>
          </FadeInView>

          <FadeInView direction="up">
            <div className="grid md:grid-cols-2 gap-5 mb-6">
              {USE_CASES.map((uc) => (
                <div
                  key={uc.label}
                  className="rounded-2xl border p-6"
                  style={{ background: uc.bg, borderColor: uc.border }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">{uc.icon}</span>
                    <span className="font-bold text-base" style={{ color: uc.color }}>{uc.label}</span>
                  </div>
                  <div className="space-y-3">
                    {uc.items.map((item) => (
                      <div key={item.title} className="flex gap-3">
                        <div className="w-1 rounded-full shrink-0 mt-1" style={{ background: uc.color, minHeight: "100%" }} />
                        <div>
                          <p className="text-sm font-semibold">{item.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.body}</p>
                          {item.source && <p className="text-[8px] text-muted-foreground/50 font-mono mt-1 italic">{item.source}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </FadeInView>
        </div>
      </section>

      {/* ═══════ SECTION 3: WHY IT MATTERS ═══════ */}
      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <FadeInView>
            <SectionPill>Chapter 3 — Why it matters now</SectionPill>
          </FadeInView>

          <FadeInView direction="up">
            <div
              className="rounded-2xl border border-border/50 p-8 mb-6"
              style={{ background: "linear-gradient(135deg, oklch(0.11 0.04 280), oklch(0.1 0.02 240))" }}
            >
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { icon: "🌍", title: "Global supply chains are broken", body: "March 2021: The Ever Given blocks the Suez Canal for 6 days — $9.6 billion in trade halted daily. Rerouting thousands of ships means recalculating fuel, ETAs, port slots simultaneously — a problem with more solutions than atoms in the universe.", source: "Lloyd's List · Freightos Baltic Index", color: "#f59e0b" },
                  { icon: "🏁", title: "The race has already started", body: "IBM, Google, China, and the EU have each committed $1B+ to quantum programs. UPS, FedEx, Volkswagen, and Airbus are all running active quantum pilots today.", source: "EU Quantum Flagship · Volkswagen / D-Wave", color: "oklch(0.72 0.22 200)" },
                  { icon: "⏳", title: "The window to prepare is 5 years", body: "Quantum computers that outperform classical ones on real logistics problems are 3–7 years away. But migrating a global carrier's systems takes 4–6 years. Start now.", source: "IBM Quantum Roadmap 2025", color: "#22c55e" },
                ].map((item) => (
                  <div key={item.title}>
                    <div className="text-3xl mb-3">{item.icon}</div>
                    <h3 className="font-semibold mb-2 text-base" style={{ color: item.color }}>{item.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                    <p className="text-[8px] text-muted-foreground/50 font-mono mt-2 italic">{item.source}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* ═══════ SECTION 4: MARKET INTELLIGENCE ═══════ */}
      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <FadeInView>
            <SectionPill>Chapter 4 — Market Intelligence</SectionPill>
          </FadeInView>

          {/* Stats grid */}
          <FadeInView direction="up">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
              {MARKET_STATS.map((stat, i) => (
                <motion.div
                  key={stat.value}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="rounded-xl border border-border/40 p-5"
                  style={{ background: "oklch(0.1 0.025 260 / 0.7)" }}
                >
                  <p className="text-2xl sm:text-3xl font-bold font-mono mb-1 text-gradient">
                    {stat.value.startsWith("$") ? "$" : ""}
                    <AnimatedCounter
                      to={parseInt(stat.value.replace(/[^0-9.]/g, ""))}
                      suffix={stat.value.includes("T") ? "T" : stat.value.includes("B") ? "B" : stat.value.includes("%") ? "%" : stat.value.includes("×") ? "×" : "+"}
                      duration={2 + i * 0.2}
                    />
                  </p>
                  <p className="text-sm font-medium mb-2">{stat.label}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{stat.source}</p>
                </motion.div>
              ))}
            </div>
          </FadeInView>

          {/* Adoption + Timeline */}
          <FadeInView direction="up" delay={0.2}>
            <div className="grid md:grid-cols-2 gap-5 mb-8">
              {/* Adoption by sector */}
              <div className="rounded-2xl border border-border/40 p-6" style={{ background: "oklch(0.1 0.02 260 / 0.5)" }}>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-5">Quantum Readiness by Sector (2025)</p>
                <div className="space-y-3">
                  {ADOPTION_SECTORS.map((s) => (
                    <div key={s.sector}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{s.sector}</span>
                        <span className="font-mono text-xs" style={{ color: s.color }}>{s.readiness}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-border/30 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${s.readiness}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: s.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-4">Source: Deloitte Quantum Readiness Survey, 2024</p>
              </div>

              {/* Timeline */}
              <div className="rounded-2xl border border-border/40 p-6" style={{ background: "oklch(0.1 0.02 260 / 0.5)" }}>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-5">GTM Timeline for Quantum Logistics</p>
                <div className="space-y-4">
                  {TIMELINE.map((t, i) => (
                    <div key={t.year} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[10px] font-mono font-bold shrink-0"
                          style={{
                            borderColor: t.status === "current" ? "#22c55e" : t.status === "soon" ? "#f59e0b" : "oklch(0.72 0.22 200)",
                            color: t.status === "current" ? "#22c55e" : t.status === "soon" ? "#f59e0b" : "oklch(0.72 0.22 200)",
                            background: t.status === "current" ? "oklch(0.2 0.06 150 / 0.3)" : "transparent",
                          }}
                        >
                          {t.year.slice(2)}
                        </div>
                        {i < TIMELINE.length - 1 && <div className="w-px flex-1 bg-border/30 my-1" style={{ minHeight: "16px" }} />}
                      </div>
                      <div className="pb-4">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold">{t.year}</span>
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                            style={{
                              color: t.status === "current" ? "#22c55e" : t.status === "soon" ? "#f59e0b" : "oklch(0.72 0.22 200)",
                              background: t.status === "current" ? "oklch(0.2 0.06 150 / 0.2)" : t.status === "soon" ? "oklch(0.22 0.06 80 / 0.2)" : "oklch(0.15 0.04 260 / 0.3)",
                            }}
                          >
                            {t.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          <FadeInView direction="up">
            <div className="rounded-2xl border border-primary/30 p-8 sm:p-12 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, oklch(0.1 0.04 240), oklch(0.12 0.05 260))" }}>
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 50%, oklch(0.72 0.22 200), transparent 60%)" }} />
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to see it in action?</h2>
                <p className="text-muted-foreground max-w-lg mx-auto mb-6">
                  Stop reading — start playing. Each simulation teaches you an algorithm by letting you run it.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    to="/simulations"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_oklch(0.72_0.22_200/0.4)]"
                  >
                    Explore Simulations →
                  </Link>
                  <Link
                    to="/strategy"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-background/60 font-medium text-sm transition-all duration-300 hover:border-primary/40"
                  >
                    Business Strategy →
                  </Link>
                </div>
              </div>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-border/30 px-4 py-8 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-[9px] font-bold font-mono">Q</span>
            </div>
            <span className="font-semibold text-foreground">WNS Quantum Lab</span>
          </div>
          <span className="font-mono">© {new Date().getFullYear()} · WNS · Part of Capgemini</span>
        </div>
      </footer>
    </div>
  );
}
