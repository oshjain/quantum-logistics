import { Link } from "react-router-dom";
import { motion } from "motion/react";
import NavBar from "@/components/NavBar.tsx";
import { FadeInView, StaggerGrid, GlowBorder } from "@/components/animations/index.ts";
import { CATEGORIES } from "@/lib/site-data.ts";

const FILTERS = ["All", "Shipping Lines", "Trucking", "Freight Forwarders", "Air Cargo", "Logistics Basics", "Quantum Algorithms"];

export default function Simulations() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      {/* ═══════ HERO ═══════ */}
      <section className="relative px-4 pt-12 pb-12 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] opacity-15 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, oklch(0.72 0.22 200), transparent 70%)" }}
        />
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <FadeInView>
            <div className="inline-flex items-center gap-2 border border-primary/25 bg-primary/8 text-primary px-4 py-1.5 rounded-full text-xs font-medium mb-6 font-mono tracking-wider">
              🎮 16 Interactive Simulations
            </div>
          </FadeInView>

          <FadeInView delay={0.15}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-4">
              Try the <span className="text-gradient">algorithms</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8">
              Every puzzle below uses an actual optimisation algorithm — the same logic quantum computers will one day run at scale. Try solving manually, then use the <strong className="text-foreground">Smart Helper</strong> to see the optimal solution.
            </p>
          </FadeInView>

          {/* Filter pills */}
          <FadeInView delay={0.3} direction="none">
            <div className="flex flex-wrap justify-center gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  className="px-4 py-1.5 rounded-full text-xs font-medium border border-border/50 bg-card/60 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
                >
                  {f}
                </button>
              ))}
            </div>
          </FadeInView>
        </div>
      </section>

      {/* ═══════ FEATURED ═══════ */}
      <section className="px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <FadeInView direction="up">
            <Link to="/quantum-shipment" className="block group">
              <GlowBorder color="oklch(0.72 0.22 200)" speed={5}>
                <div
                  className="relative rounded-2xl overflow-hidden p-7 sm:p-9"
                  style={{ background: "linear-gradient(135deg, oklch(0.09 0.04 220), oklch(0.12 0.06 200))" }}
                >
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none transition-opacity duration-500 group-hover:opacity-25"
                    style={{ background: "radial-gradient(ellipse at 80% 50%, oklch(0.72 0.22 200), transparent 60%)" }}
                  />
                  <div className="absolute inset-0 grid-bg-subtle opacity-30" />

                  <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex-1">
                      <div className="inline-flex items-center gap-1.5 bg-primary/20 border border-primary/40 text-primary text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
                        ⭐ Featured — New
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                        Quantum Shipment Lifecycle
                      </h2>
                      <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
                        Follow one container from Delhi to Chicago through 10 real logistics touchpoints. Make manual decisions, then hit <strong className="text-foreground">Quantum Boost</strong> at each stage.
                      </p>
                    </div>
                    <div className="shrink-0 flex items-center gap-4">
                      <div className="flex -space-x-2">
                        {["🌍", "🚢", "🚛", "✈️"].map((e, i) => (
                          <div key={i} className="w-10 h-10 rounded-full bg-card border border-border/50 flex items-center justify-center text-lg">{e}</div>
                        ))}
                      </div>
                      <span className="text-primary font-semibold text-sm group-hover:translate-x-1 transition-transform">Play →</span>
                    </div>
                  </div>
                </div>
              </GlowBorder>
            </Link>
          </FadeInView>
        </div>
      </section>

      {/* ═══════ SIMULATIONS GRID ═══════ */}
      <section className="px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-14">
            {CATEGORIES.map((cat, ci) => (
              <FadeInView key={cat.title} delay={ci * 0.08} direction="up">
                <div>
                  {/* Category header */}
                  <div className="flex items-center gap-3 mb-6">
                    <span className="text-3xl">{cat.icon}</span>
                    <h2 className="text-2xl font-bold" style={{ color: cat.color }}>{cat.title}</h2>
                    <div className="h-px flex-1 bg-border/30 ml-2" />
                    <span className="text-xs font-mono text-muted-foreground">{cat.sims.length} simulations</span>
                  </div>

                  {/* Cards */}
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {cat.sims.map((sim, si) => (
                      <motion.div
                        key={sim.path}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.4, delay: si * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
                      >
                        <Link to={sim.path} className="block h-full group">
                          <motion.div
                            whileHover={{ y: -6, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className="relative rounded-xl border overflow-hidden p-5 h-full flex flex-col bg-card"
                            style={{
                              borderColor: `${cat.color}30`,
                              boxShadow: `0 0 30px ${cat.color}08`,
                            }}
                          >
                            {/* Glow overlay */}
                            <motion.div
                              className="absolute inset-0 pointer-events-none rounded-[inherit]"
                              style={{
                                background: `radial-gradient(ellipse at 80% 0%, ${cat.color}, transparent 60%)`,
                                opacity: 0.04,
                              }}
                              whileHover={{ opacity: 0.14 }}
                              transition={{ duration: 0.3 }}
                            />

                            <div className="relative z-10 flex flex-col h-full">
                              <div className="flex items-start justify-between mb-3">
                                <span className="text-3xl">{sim.emoji}</span>
                                <span className="text-[10px] text-muted-foreground font-mono px-2 py-0.5 rounded-full bg-muted/30 border border-border/30">{sim.diff}</span>
                              </div>

                              <h3 className="font-bold text-lg mb-2 group-hover:brightness-110 transition-all" style={{ color: cat.color }}>
                                {sim.title}
                              </h3>
                              <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-1">{sim.desc}</p>

                              {/* Algorithm badge */}
                              <div
                                className="rounded-lg px-3 py-2.5 border transition-colors duration-200"
                                style={{ background: `${cat.color}0a`, borderColor: `${cat.color}25` }}
                              >
                                <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: `${cat.color}80` }}>Algorithm</span>
                                <p className="text-xs font-bold leading-tight mt-0.5" style={{ color: cat.color }}>{sim.algo}</p>
                              </div>

                              <div className="mt-3 text-xs font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all" style={{ color: cat.color }}>
                                Play {sim.title} →
                              </div>
                            </div>
                          </motion.div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </FadeInView>
            ))}
          </div>
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
