import { Link } from "react-router-dom";
import NavBar from "@/components/NavBar.tsx";
import { ParticleField, RevealText, FadeInView, AnimatedCounter, GlowCard, GlowBorder } from "@/components/animations/index.ts";
import { CATEGORIES, MARKET_STATS } from "@/lib/site-data.ts";

const FEATURED_STATS = MARKET_STATS.slice(0, 4);

const GATEWAYS = [
  {
    to: "/simulations",
    icon: "🎮",
    title: "Simulations",
    desc: "Play with 16 interactive logistics puzzles powered by real optimisation algorithms — see quantum thinking in action.",
    color: "oklch(0.72 0.22 200)",
    gradient: "linear-gradient(135deg, oklch(0.72 0.22 200 / 0.15), oklch(0.72 0.22 200 / 0.05))",
    count: "16 puzzles",
  },
  {
    to: "/learn",
    icon: "📚",
    title: "Learn",
    desc: "Understand quantum computing from the ground up — analogies, market intelligence, and the real-world problems it solves.",
    color: "#a855f7",
    gradient: "linear-gradient(135deg, #a855f7 / 0.15, #a855f7 / 0.05)",
    count: "6 sections",
  },
  {
    to: "/strategy",
    icon: "📊",
    title: "Strategy",
    desc: "Business context, competitive landscape, and a roadmap for turning quantum theory into enterprise advantage.",
    color: "#f59e0b",
    gradient: "linear-gradient(135deg, #f59e0b / 0.15, #f59e0b / 0.05)",
    count: "For leaders",
  },
];

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      {/* ═══════ HERO ═══════ */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 grid-bg opacity-50" />
        <ParticleField className="absolute inset-0" />

        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[150px] opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, oklch(0.72 0.22 200), transparent 70%)" }}
        />
        <div
          className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full blur-[120px] opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, #a855f7, transparent 70%)" }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center pt-12 pb-16">
          <FadeInView delay={0.1}>
            <div className="inline-flex items-center gap-2 border border-primary/25 bg-primary/8 text-primary px-4 py-1.5 rounded-full text-xs font-medium mb-8 font-mono tracking-wider">
              ⚛ WNS Quantum Lab &nbsp;·&nbsp; Part of Capgemini
            </div>
          </FadeInView>

          <RevealText
            as="h1"
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-6"
            delay={0.2}
            stagger={0.04}
          >
            The Future of Logistics is Quantum
          </RevealText>

          <FadeInView delay={0.6} direction="none">
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-balance mb-10">
              Explore how quantum computing will reshape global supply chains — then play with the algorithms yourself through <strong className="text-foreground">16 interactive simulations</strong>.
            </p>
          </FadeInView>

          <FadeInView delay={0.8} direction="up">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <Link
                to="/simulations"
                className="group relative inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_oklch(0.72_0.22_200/0.4)]"
              >
                <span>Explore Simulations</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                to="/learn"
                className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-border bg-background/60 backdrop-blur-sm font-medium text-base transition-all duration-300 hover:border-primary/40 hover:bg-primary/5 hover:scale-105"
              >
                <span>Learn the Basics</span>
                <span className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all">→</span>
              </Link>
            </div>
          </FadeInView>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </section>

      {/* ═══════ STATS STRIP ═══════ */}
      <section className="relative -mt-16 z-20 px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <FadeInView direction="up">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-border/50 bg-border/30">
              {FEATURED_STATS.map((stat, i) => (
                <div
                  key={stat.value}
                  className="relative bg-card/80 backdrop-blur-sm p-6 text-center overflow-hidden"
                >
                  <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ background: `radial-gradient(ellipse at 50% 0%, oklch(0.72 0.22 200), transparent 60%)` }}
                  />
                  <div className="relative z-10">
                    <p className="text-4xl sm:text-5xl font-bold font-mono mb-1 text-gradient">
                      <AnimatedCounter
                        to={parseInt(stat.value.replace(/[^0-9.]/g, ""))}
                        suffix={stat.value.includes("T") ? "T" : stat.value.includes("B") ? "B" : stat.value.includes("%") ? "%" : stat.value.includes("×") ? "×" : "+"}
                        prefix={stat.value.startsWith("$") ? "$" : stat.value.startsWith("27") ? "" : ""}
                        duration={2 + i * 0.3}
                      />
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-snug">{stat.label}</p>
                    <p className="text-[9px] text-muted-foreground/40 font-mono mt-1.5">{stat.source}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeInView>
        </div>
      </section>

      {/* ═══════ GATEWAY CARDS ═══════ */}
      <section className="px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          <FadeInView>
            <div className="text-center mb-12">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Explore the platform</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Three ways to <span className="text-gradient">engage</span>
              </h2>
            </div>
          </FadeInView>

          <div className="grid md:grid-cols-3 gap-6">
            {GATEWAYS.map((gate, i) => (
              <FadeInView key={gate.to} delay={0.15 * i} direction="up">
                <Link to={gate.to} className="block group h-full">
                  <GlowCard color={gate.color} glowIntensity={0.08}>
                    <div className="p-6 sm:p-8 flex flex-col h-full">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5 transition-transform duration-300 group-hover:scale-110"
                        style={{ background: gate.gradient, border: `1px solid ${gate.color}30` }}
                      >
                        {gate.icon}
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-xl font-bold" style={{ color: gate.color }}>{gate.title}</h3>
                        <span
                          className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                          style={{ background: `${gate.color}15`, color: gate.color, border: `1px solid ${gate.color}25` }}
                        >
                          {gate.count}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed flex-1">{gate.desc}</p>
                      <div
                        className="mt-6 text-sm font-semibold flex items-center gap-1 transition-all duration-300 group-hover:translate-x-1.5"
                        style={{ color: gate.color }}
                      >
                        Explore {gate.title} →
                      </div>
                    </div>
                  </GlowCard>
                </Link>
              </FadeInView>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FEATURED SIMULATION ═══════ */}
      <section className="px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          <FadeInView>
            <div className="text-center mb-10">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Featured Simulation</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Try it <span className="text-gradient">now</span>
              </h2>
            </div>
          </FadeInView>

          <FadeInView direction="up" delay={0.2}>
            <Link to="/quantum-shipment" className="block group">
              <GlowBorder color="oklch(0.72 0.22 200)" speed={5}>
                <div
                  className="relative rounded-2xl overflow-hidden p-8 sm:p-10"
                  style={{ background: "linear-gradient(135deg, oklch(0.09 0.04 220), oklch(0.12 0.06 200))" }}
                >
                  <div
                    className="absolute inset-0 opacity-15 pointer-events-none transition-opacity duration-500 group-hover:opacity-25"
                    style={{ background: "radial-gradient(ellipse at 80% 50%, oklch(0.72 0.22 200), transparent 60%)" }}
                  />
                  <div className="absolute inset-0 grid-bg-subtle opacity-30" />

                  <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
                    <div className="flex-1">
                      <div className="inline-flex items-center gap-1.5 bg-primary/20 border border-primary/40 text-primary text-[10px] font-mono uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                        ⭐ Featured — New
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                        Quantum Shipment Lifecycle
                      </h3>
                      <p className="text-muted-foreground leading-relaxed max-w-xl text-base">
                        Follow one container from Delhi to Chicago through <strong className="text-foreground">10 real logistics touchpoints</strong>. Make manual decisions, then hit <strong className="text-foreground">Quantum Boost</strong> at each stage to see the optimal choice.
                      </p>
                      <div className="flex flex-wrap gap-2 mt-5">
                        {["Empty Container Pickup", "Vessel Stowage", "Customs", "Rail Scheduling", "Last-Mile TSP"].map((tag) => (
                          <span key={tag} className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary/80 text-xs">{tag}</span>
                        ))}
                        <span className="px-3 py-1 rounded-full bg-muted/40 border border-border text-muted-foreground text-xs">+5 more</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-center gap-3">
                      <div className="w-24 h-24 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-5xl group-hover:scale-110 transition-transform duration-300">
                        🌍
                      </div>
                      <span className="text-primary font-semibold text-base group-hover:translate-x-1 transition-transform">Play now →</span>
                    </div>
                  </div>
                </div>
              </GlowBorder>
            </Link>
          </FadeInView>
        </div>
      </section>

      {/* ═══════ CATEGORIES PREVIEW ═══════ */}
      <section className="px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          <FadeInView>
            <div className="text-center mb-12">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">All Simulations</p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Explore by <span className="text-gradient">domain</span>
              </h2>
            </div>
          </FadeInView>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CATEGORIES.map((cat, i) => (
              <FadeInView key={cat.title} delay={0.08 * i} direction="up">
                <Link to="/simulations" className="block group h-full">
                  <div
                    className="relative rounded-xl border border-border/50 p-5 h-full flex flex-col bg-card transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1"
                    style={{ borderColor: `${cat.color}30` }}
                  >
                    <div
                      className="absolute inset-0 opacity-[0.04] rounded-[inherit] pointer-events-none transition-opacity duration-300 group-hover:opacity-[0.12]"
                      style={{ background: `radial-gradient(ellipse at 80% 0%, ${cat.color}, transparent 60%)` }}
                    />
                    <div className="relative z-10 flex items-center gap-3 mb-3">
                      <span className="text-3xl">{cat.icon}</span>
                      <h3 className="font-bold text-base" style={{ color: cat.color }}>{cat.title}</h3>
                    </div>
                    <div className="relative z-10 flex flex-wrap gap-1.5 mt-auto">
                      {cat.sims.map((sim) => (
                        <span key={sim.path} className="text-xs px-2 py-0.5 rounded-md bg-muted/30 text-muted-foreground border border-border/30">
                          {sim.emoji} {sim.title}
                        </span>
                      ))}
                    </div>
                    <div className="relative z-10 mt-3 text-xs font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300" style={{ color: cat.color }}>
                      View all {cat.sims.length} simulations →
                    </div>
                  </div>
                </Link>
              </FadeInView>
            ))}
          </div>

          <FadeInView delay={0.6}>
            <div className="text-center mt-10">
              <Link
                to="/simulations"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-primary/30 bg-primary/5 text-primary font-semibold text-sm transition-all duration-300 hover:bg-primary/10 hover:border-primary/50 hover:scale-105"
              >
                View All 16 Simulations →
              </Link>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="border-t border-border/30 px-4 py-10 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-[10px] font-bold font-mono">Q</span>
            </div>
            <span className="font-semibold text-foreground text-sm">WNS Quantum Lab</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">WNS · Part of Capgemini</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/simulations" className="hover:text-foreground transition-colors">Simulations</Link>
            <Link to="/learn" className="hover:text-foreground transition-colors">Learn</Link>
            <Link to="/strategy" className="hover:text-foreground transition-colors">Strategy</Link>
          </div>
          <span className="font-mono text-[10px]">© {new Date().getFullYear()} · Built to help teams understand the technologies shaping the next decade of logistics</span>
        </div>
      </footer>
    </div>
  );
}

