import { Link } from "react-router-dom";
import { motion } from "motion/react";
import NavBar from "@/components/NavBar.tsx";
import { FadeInView, RevealText, AnimatedCounter } from "@/components/animations/index.ts";
import { MARKET_STATS } from "@/lib/site-data.ts";

function SectionPill({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-amber-500/30" />
      <span className="text-[10px] font-mono text-amber-400/70 uppercase tracking-[0.2em] px-2 shrink-0">{children}</span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-500/30 to-amber-500/30" />
    </div>
  );
}

const KEY_STATS = MARKET_STATS.slice(0, 3);

export default function Strategy() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      {/* ═══════ HERO ═══════ */}
      <section className="relative px-4 pt-12 pb-16 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-25" />
        <div
          className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full blur-[140px] opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, #f59e0b, transparent 70%)" }}
        />
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <FadeInView>
            <div className="inline-flex items-center gap-2 border border-amber-500/25 bg-amber-500/8 text-amber-400 px-4 py-1.5 rounded-full text-xs font-medium mb-6 font-mono tracking-wider">
              📊 Business Strategy
            </div>
          </FadeInView>
          <RevealText
            as="h1"
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-4"
            delay={0.15}
            stagger={0.035}
          >
            Quantum is a Business Imperative
          </RevealText>
          <FadeInView delay={0.5} direction="none">
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Not a science experiment. The next major platform shift in enterprise technology — and logistics will be one of the first industries transformed.
            </p>
          </FadeInView>

          {/* Hero stats */}
          <FadeInView delay={0.7} direction="up">
            <div className="flex flex-wrap justify-center gap-6 mt-10">
              {KEY_STATS.map((stat, i) => (
                <div key={stat.value} className="text-center">
                  <p className="text-3xl sm:text-4xl font-bold font-mono text-gradient">
                    <AnimatedCounter
                      to={parseInt(stat.value.replace(/[^0-9.]/g, ""))}
                      suffix={stat.value.includes("T") ? "T" : stat.value.includes("B") ? "B" : stat.value.includes("%") ? "%" : ""}
                      prefix={stat.value.startsWith("$") ? "$" : ""}
                      duration={2.5 + i * 0.3}
                    />
                  </p>
                  <p className="text-xs text-muted-foreground max-w-40 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </FadeInView>
        </div>
      </section>

      {/* ═══════ THE BIG PICTURE ═══════ */}
      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <FadeInView>
            <SectionPill>The Big Picture</SectionPill>
          </FadeInView>

          <FadeInView direction="up">
            <div
              className="rounded-2xl border border-amber-500/25 p-8 sm:p-10 mb-10 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, oklch(0.11 0.05 200), oklch(0.09 0.03 250))" }}
            >
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at 70% 30%, oklch(0.72 0.22 200 / 0.3), transparent 60%)" }}
              />
              <div className="relative z-10">
                <p className="text-[10px] font-mono text-primary/60 uppercase tracking-widest mb-3">The Big Picture</p>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white leading-tight">
                  Quantum computing is not a distant science experiment. It is the next major platform shift in enterprise technology — and logistics will be one of the first industries transformed.
                </h2>
                <p className="text-white/70 leading-relaxed max-w-3xl text-sm">
                  Every simulation on this site runs on a classical computer today. But each algorithm — vehicle routing, container stacking, intermodal scheduling — is exactly the kind of problem where quantum computers will deliver orders-of-magnitude improvements. The question is not <em>if</em> this shift happens, but <em>who is ready when it does</em>.
                </p>
              </div>
            </div>
          </FadeInView>

          {/* Three pillars */}
          <FadeInView direction="up" delay={0.2}>
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {/* Pillar 1 */}
              <div className="rounded-2xl border border-purple-500/25 p-6" style={{ background: "oklch(0.1 0.03 280 / 0.6)" }}>
                <div className="text-3xl mb-3">🏢</div>
                <h3 className="font-bold text-lg mb-3 text-purple-300">Where We Stand</h3>
                <p className="text-white/65 text-sm leading-relaxed mb-4">
                  We are now part of Capgemini, which operates a dedicated Quantum Lab with over 40 specialists across five countries. The Q-Lab holds partnerships with IBM Quantum, Pasqal (neutral-atom quantum computing), and participates in the EU EQUALITY consortium alongside Airbus and Fraunhofer.
                </p>
                <p className="text-white/65 text-sm leading-relaxed">
                  Combined with WNS's deep logistics domain expertise — built over decades of running real-world supply chain operations — we sit at a unique intersection: frontline operational knowledge meets cutting-edge quantum research.
                </p>
              </div>

              {/* Pillar 2 */}
              <div className="rounded-2xl border border-amber-500/25 p-6" style={{ background: "oklch(0.1 0.03 80 / 0.4)" }}>
                <div className="text-3xl mb-3">📦</div>
                <h3 className="font-bold text-lg mb-3 text-amber-300">The Product Opportunity</h3>
                <p className="text-white/65 text-sm leading-relaxed mb-4">
                  Think of quantum as the next GPS. Before GPS existed, nobody asked for it. After GPS, entire industries were built on it — Uber, real-time logistics tracking, precision agriculture. Quantum computing will have the same effect on optimisation-heavy industries.
                </p>
                <p className="text-white/65 text-sm leading-relaxed">
                  The logistics problems quantum solves — container repositioning, vessel stowage, intermodal routing, berth scheduling — are not theoretical. They are the exact problems our clients pay us to solve every day.
                </p>
              </div>

              {/* Pillar 3 */}
              <div className="rounded-2xl border border-green-500/25 p-6" style={{ background: "oklch(0.1 0.03 150 / 0.4)" }}>
                <div className="text-3xl mb-3">🏁</div>
                <h3 className="font-bold text-lg mb-3 text-green-300">Competitive Context</h3>
                <p className="text-white/65 text-sm leading-relaxed mb-4">
                  The competitive field is forming now. Accenture runs a quantum practice with WEF backing. Deloitte focuses on advisory. IBM Consulting builds on its own hardware. BCG and McKinsey publish intelligence but do not deliver.
                </p>
                <p className="text-white/65 text-sm leading-relaxed">
                  Our advantage: we are the only player combining Capgemini's quantum infrastructure with WNS's operational depth in shipping, trucking, freight forwarding, and air cargo. Theory plus practice.
                </p>
              </div>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* ═══════ COMPETITIVE LANDSCAPE ═══════ */}
      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <FadeInView>
            <SectionPill>Competitive Landscape</SectionPill>
          </FadeInView>

          <FadeInView direction="up">
            <div className="rounded-2xl border border-border/40 p-6 sm:p-8 mb-8" style={{ background: "oklch(0.1 0.02 260 / 0.5)" }}>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-5">Who Is Doing What in Quantum Logistics</p>
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-sm text-left min-w-[600px]">
                  <thead>
                    <tr className="border-b border-white/10 text-muted-foreground">
                      <th className="py-3 pr-4 font-semibold text-white/80">Organisation</th>
                      <th className="py-3 pr-4 font-semibold text-white/80">Quantum Capability</th>
                      <th className="py-3 pr-4 font-semibold text-white/80">Key Partnerships</th>
                      <th className="py-3 font-semibold text-white/80">Positioning</th>
                    </tr>
                  </thead>
                  <tbody className="text-white/60">
                    {[
                      { org: "Capgemini + WNS", cap: "Q-Lab (40+ experts, 5 countries), platform-agnostic", partners: "IBM Quantum Hub, Pasqal, DARPA, Airbus", pos: "Application-driven + deep logistics ops", highlight: true },
                      { org: "Accenture", cap: "Established quantum practice, WEF collaboration", partners: "IBM, IonQ, D-Wave, MIT", pos: "Strategy advisory + broad ecosystem" },
                      { org: "Deloitte", cap: "Quantum computing services, scenario planning", partners: "Multi-vendor, no dedicated lab", pos: "Advisory-first, risk quantification" },
                      { org: "IBM Consulting", cap: "Built on IBM's own quantum hardware & Qiskit", partners: "Native (own stack)", pos: "Deepest technical depth, less vendor-neutral" },
                      { org: "BCG / McKinsey", cap: "Market intelligence, annual Quantum Tech Monitor", partners: "Advisory partnerships only", pos: "Strategy only, no delivery capability" },
                    ].map((row, i) => (
                      <tr key={row.org} className={`border-b border-white/5 transition-colors ${row.highlight ? "bg-primary/5" : ""} hover:bg-white/[0.02]`}>
                        <td className={`py-3 pr-4 font-semibold ${row.highlight ? "text-green-300" : "text-white/80"}`}>{row.org}</td>
                        <td className="py-3 pr-4">{row.cap}</td>
                        <td className="py-3 pr-4">{row.partners}</td>
                        <td className="py-3">{row.pos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-muted-foreground mt-4">Sources: Capgemini Q-Lab (est. Jan 2022) · Accenture Quantum Practice · Deloitte Quantum Services · IBM Quantum Network · BCG Quantum Tech Monitor 2024</p>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* ═══════ FOR EVERY TEAM ═══════ */}
      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <FadeInView>
            <SectionPill>For Every Team</SectionPill>
          </FadeInView>

          <FadeInView direction="up">
            <div
              className="rounded-2xl border border-border/40 p-8 mb-8"
              style={{ background: "linear-gradient(135deg, oklch(0.1 0.03 200), oklch(0.12 0.04 260))" }}
            >
              <p className="text-[10px] font-mono text-primary/60 uppercase tracking-widest mb-3">What This Means For You</p>
              <h2 className="text-xl sm:text-2xl font-bold mb-6 text-white">No Matter Which Team You Are In</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { icon: "📊", title: "Operations & Delivery", body: "The algorithms in these simulations will power the next generation of transport management systems. Understanding them today means you'll recognise their real-world versions when they arrive in production." },
                  { icon: "🎓", title: "Training & Quality", body: "Use these simulations in team workshops, onboarding sessions, or lunch-and-learns. Each one explains what the algorithm does and why it matters for real logistics." },
                  { icon: "🔄", title: "Transformation & IT", body: "Hybrid classical-quantum workflows, API-based solver integration, cloud quantum access — these patterns will reshape enterprise IT. Familiarity positions our roadmap ahead." },
                  { icon: "🌐", title: "Networking & Infrastructure", body: "Quantum requires specialised data centres with cryogenic cooling, quantum-safe networks, and post-quantum encryption. Procurement decisions start now, not in 2030." },
                  { icon: "💼", title: "Leadership & Strategy", body: "The window to build quantum expertise is 3-7 years. Companies that start learning today will lead the market. Those that wait will pay a premium to catch up." },
                  { icon: "🤝", title: "Sales & Client Engagement", body: "Maersk, DB Schenker, DHL, and UPS all run active quantum pilots. An informed conversation backed by hands-on experience is a differentiator in every client meeting." },
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border border-white/10 p-4" style={{ background: "oklch(0.1 0.015 260 / 0.5)" }}>
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <h4 className="font-semibold text-sm text-white/90 mb-2">{item.title}</h4>
                    <p className="text-xs text-white/55 leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* ═══════ FORWARD LOOK ═══════ */}
      <section className="px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          <FadeInView>
            <SectionPill>Looking Ahead</SectionPill>
          </FadeInView>

          <FadeInView direction="up">
            <div className="rounded-2xl border border-primary/20 p-8 sm:p-10 text-center" style={{ background: "oklch(0.09 0.03 240)" }}>
              <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-white">Where We Go From Here</h2>
              <div className="grid sm:grid-cols-3 gap-8 text-left">
                {[
                  { num: "1", title: "Build Awareness", desc: "Share this tool across the business unit. Let every team — operations, training, quality, transformation, IT, networking — explore the simulations.", color: "oklch(0.72 0.22 200)", bg: "bg-primary/20 border-primary/30" },
                  { num: "2", title: "Identify Pilots", desc: "Work with the Capgemini Q-Lab to identify one or two high-value logistics use cases where quantum can deliver measurable impact.", color: "#f59e0b", bg: "bg-amber-500/20 border-amber-500/30" },
                  { num: "3", title: "Build Products", desc: "Package the algorithms, expertise, and Capgemini partnership into quantum-ready products. Own the category before anyone else does.", color: "#22c55e", bg: "bg-green-500/20 border-green-500/30" },
                ].map((step) => (
                  <div key={step.num} className="text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg mx-auto mb-3 ${step.bg}`} style={{ borderColor: `${step.color}40` }}>
                      <span style={{ color: step.color }}>{step.num}</span>
                    </div>
                    <h4 className="font-semibold text-white mb-2">{step.title}</h4>
                    <p className="text-sm text-white/55 leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeInView>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="px-4 pb-12">
        <div className="max-w-6xl mx-auto">
          <FadeInView direction="up">
            <div className="rounded-2xl border border-amber-500/25 p-8 sm:p-12 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, oklch(0.12 0.04 40), oklch(0.1 0.03 260))" }}>
              <div className="absolute inset-0 opacity-8 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 50%, #f59e0b, transparent 60%)" }} />
              <div className="relative z-10">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">Turn strategy into practice</h2>
                <p className="text-muted-foreground max-w-lg mx-auto mb-6 text-sm">
                  The algorithms, the expertise, and the partnerships are here. The only missing piece is your hands-on experience.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    to="/simulations"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_oklch(0.72_0.22_200/0.4)]"
                  >
                    Try the Simulations →
                  </Link>
                  <Link
                    to="/learn"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-background/60 font-medium text-sm transition-all duration-300 hover:border-primary/40"
                  >
                    Learn the Basics →
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
