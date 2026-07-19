import { Link } from "react-router-dom";
import { motion } from "motion/react";
import NavBar from "@/components/NavBar.tsx";

type Sim = {
  path: string;
  title: string;
  emoji: string;
  desc: string;
  diff: string;
  algo: string;
  algoWhy: string;
};

type Category = {
  icon: string;
  title: string;
  color: string;
  sims: Sim[];
};

const CATEGORIES: Category[] = [
  {
    icon: "🚢",
    title: "Shipping Lines",
    color: "#3b82f6",
    sims: [
      {
        path: "/container-stack",
        title: "Container Stack Shuffle",
        emoji: "🏗️",
        desc: "Sort stacked containers into the right order using the fewest crane moves.",
        diff: "⭐ Easy",
        algo: "BFS (Breadth-First Search)",
        algoWhy: "Like ripples in a pond — it explores every possible move one step at a time, guaranteeing the shortest solution. Think of it as checking every nearby door before opening a farther one.",
      },
      {
        path: "/vessel-stowage",
        title: "Vessel Stowage Tetris",
        emoji: "⛴️",
        desc: "Load a ship's 3×3 grid so every port's cargo is accessible without re-stowing.",
        diff: "⭐⭐ Medium",
        algo: "Constraint Satisfaction",
        algoWhy: "Like solving a Sudoku — it places each cargo block and immediately checks 'does this break any rule?'. If yes, it backtracks and tries something else. Fast because it stops bad ideas early.",
      },
      {
        path: "/empty-container",
        title: "Empty Container Repositioning",
        emoji: "📦",
        desc: "Route empty containers from surplus ports to deficit ports across a global network at minimum cost.",
        diff: "⭐ Easy",
        algo: "Integer Linear Programming",
        algoWhy: "Like a budget planner — it treats each container move as a cost and tries every combination of moves to find the cheapest total bill. Shipping companies use this exact approach to save millions each year.",
      },
      {
        path: "/berth-race",
        title: "Berth Race",
        emoji: "⚓",
        desc: "Schedule 5 arriving ships across 2 berths to finish all cargo work as early as possible.",
        diff: "⭐⭐ Medium",
        algo: "Permutation Search",
        algoWhy: "Like trying every possible queue order at a supermarket checkout — it tests all the ways to arrange 5 ships across 2 berths and picks whichever order finishes earliest. Small problem, perfect answer.",
      },
    ],
  },
  {
    icon: "🚛",
    title: "Trucking",
    color: "#f59e0b",
    sims: [
      {
        path: "/trip-chain",
        title: "Trucker's Trip Chain",
        emoji: "🚛",
        desc: "Chain dynamic loads into the perfect daily route — respect every time window, minimise empty miles.",
        diff: "⭐⭐ Medium",
        algo: "Permutation + Time-Window Filtering",
        algoWhy: "Like arranging stops on a road trip — it tries all 24 possible orderings of 4 loads and immediately discards any that miss a delivery window. Only valid, on-time routes make the final ranking.",
      },
      {
        path: "/cross-dock",
        title: "Cross-Dock Sprint",
        emoji: "🏭",
        desc: "Assign inbound trucks to dock doors so every outbound truck leaves on time.",
        diff: "⭐⭐ Medium",
        algo: "Assignment Optimisation",
        algoWhy: "Like seating guests at a dinner party so no one waits too long — it assigns each inbound truck to a door and forklift, tests every combination, and picks the schedule that gets all outbound trucks away on time.",
      },
    ],
  },
  {
    icon: "🗺️",
    title: "Freight Forwarders",
    color: "#a855f7",
    sims: [
      {
        path: "/intermodal",
        title: "Intermodal Puzzle",
        emoji: "🗺️",
        desc: "Build the cheapest route from Omaha to Hamburg mixing trucks, trains, barges and ships.",
        diff: "⭐⭐ Medium",
        algo: "Graph Search (DFS)",
        algoWhy: "Like following every road on a map until you reach the destination — it explores all possible combinations of truck, rail, barge, and ship legs between cities, then picks the cheapest valid path within your time window.",
      },
      {
        path: "/spot-bid",
        title: "Spot Bid Battle",
        emoji: "💰",
        desc: "Match 4 urgent loads to 3 carriers to maximise your brokerage profit.",
        diff: "⭐ Easy",
        algo: "Exhaustive Combination Search",
        algoWhy: "Like checking every way to split a restaurant bill — it tests all 64 possible ways to assign 4 loads to 3 carriers and picks the one that leaves the most profit in the broker's pocket.",
      },
    ],
  },
  {
    icon: "✈️",
    title: "Air Cargo",
    color: "#22c55e",
    sims: [
      {
        path: "/uld-loading",
        title: "ULD Loading Challenge",
        emoji: "✈️",
        desc: "Fit 6 cargo units into a plane's 3 holds — respect shape limits and keep the plane balanced.",
        diff: "⭐⭐ Medium",
        algo: "Backtracking Search",
        algoWhy: "Like packing a suitcase by trying each item and undoing your choices if something doesn't fit — it places cargo unit by unit, checking shape, weight, and balance rules at every step. If it gets stuck, it backs up and tries a different arrangement.",
      },
      {
        path: "/flight-capacity",
        title: "Flight Capacity Auction",
        emoji: "💺",
        desc: "Accept the right booking mix across multiple flights — balance revenue against fuel costs and capacity limits.",
        diff: "⭐ Easy",
        algo: "0/1 Knapsack + Greedy Heuristic",
        algoWhy: "Like a cargo airline's revenue manager — it evaluates every combination of bookings (or uses profit-density heuristics for larger problems) to maximise profit while respecting each plane's weight limit. Real airlines solve this thousands of times daily.",
      },
    ],
  },
  {
    icon: "🎮",
    title: "Logistics Basics",
    color: "#06b6d4",
    sims: [
      {
        path: "/delivery",
        title: "Sam's Delivery Dash",
        emoji: "🎂",
        desc: "Plan the shortest cake delivery route across 5 cafés — or let the Smart Helper find all 120.",
        diff: "⭐ Easy",
        algo: "Brute-Force TSP",
        algoWhy: "The Travelling Salesman Problem is one of the most famous puzzles in computing. With 5 stops there are 120 possible routes — the computer checks every single one and picks the shortest. Scale this to 50 cities and even the world's fastest computers struggle.",
      },
      {
        path: "/dock",
        title: "Dock Door Dilemma",
        emoji: "🏭",
        desc: "Assign 4 trucks to 3 dock doors to finish unloading as fast as possible.",
        diff: "⭐ Easy",
        algo: "Makespan Minimisation",
        algoWhy: "Like splitting chores between housemates so everyone finishes at roughly the same time — it tries every way to distribute trucks across doors and picks the assignment where the last truck finishes as early as possible.",
      },
    ],
  },
  {
    icon: "⚛",
    title: "Quantum Algorithms",
    color: "oklch(0.72 0.22 200)",
    sims: [
      {
        path: "/bb84",
        title: "BB84 Cryptography",
        emoji: "🔐",
        desc: "Simulate quantum key exchange between Alice and Bob — add Eve and watch the errors appear.",
        diff: "⭐⭐ Medium",
        algo: "BB84 Quantum Key Distribution",
        algoWhy: "Instead of sending a password through the internet (where a spy could copy it invisibly), BB84 sends it as quantum light particles. The laws of physics make it impossible to intercept without leaving a fingerprint — the first time in history a secret has been protected by nature itself.",
      },
      {
        path: "/grovers",
        title: "Grover's Search",
        emoji: "🔍",
        desc: "Watch amplitude amplification find a hidden item in an unsorted list with far fewer checks.",
        diff: "⭐⭐⭐ Advanced",
        algo: "Grover's Quantum Search",
        algoWhy: "Finding one name in a phone book of 1 million people classically takes up to 1 million checks. Grover's algorithm needs only 1,000 — a 1,000× speedup. It works by making the right answer 'louder' and wrong answers 'quieter' each step, like tuning a radio to the right station.",
      },
    ],
  },
];

const USE_CASES = [
  {
    icon: "✅",
    label: "Great fit",
    color: "#22c55e",
    bg: "oklch(0.22 0.05 150)",
    border: "#22c55e30",
    items: [
      { title: "Route optimisation", body: "Finding the single best delivery route among billions of options — today's computers give up and guess. A quantum computer checks them all at once." },
      { title: "Container stowage & yard planning", body: "A 24,000 TEU mega-ship making 6 port calls has more possible stacking configurations than atoms in the observable universe. One bad stack costs $600 in extra crane moves; 50 bad stacks per voyage wastes $30K. Quantum constraint solvers find a restow-free plan in seconds.", source: "Drewry Maritime Research · Port of Rotterdam Digital Twin" },
      { title: "Intermodal freight routing", body: "Combining truck, rail, barge, and ocean across 1,000+ city pairs — while respecting delivery windows, schedules, and customs — creates a search space exceeding 10¹⁰⁰⁰. DB Schenker and DHL are piloting quantum solvers today for this exact problem.", source: "DB Schenker · DHL Innovation Center, 2024" },
      { title: "Empty container repositioning", body: "The global fleet of 40 million TEU containers is constantly in the wrong place. Repositioning them optimally is an integer-linear-programming problem with millions of variables — exactly the kind of optimisation where quantum annealers deliver order-of-magnitude speedups over classical solvers.", source: "Drewry Container Census 2024" },
    ],
  },
  {
    icon: "❌",
    label: "Wrong tool",
    color: "#f87171",
    bg: "oklch(0.18 0.04 20)",
    border: "#f8717130",
    items: [
      { title: "Sending an email", body: "Ordinary tasks — reading, writing, browsing — run perfectly on today's laptops. Quantum adds zero benefit here." },
      { title: "Streaming a video", body: "Video playback is sequential, bit by bit. Quantum parallelism can't help; your phone already does this optimally." },
      { title: "Running a spreadsheet", body: "Most business maths is fast enough on classical hardware. Don't reach for quantum to add up a column." },
      { title: "Anything needing warm hardware", body: "Quantum chips must stay near absolute zero (−273 °C). You can't put one in a delivery truck — yet." },
    ],
  },
];

const TIMELINE = [
  { year: "2025", label: "Now", status: "current", desc: "100–1,000 qubit machines exist in labs. Noisy but functional. Early pilots in pharma, finance, and logistics." },
  { year: "2027", label: "Near-term", status: "soon", desc: "Error correction matures. 10,000-qubit systems. First commercial quantum optimisation services for route planning go live." },
  { year: "2030", label: "Mid-term", status: "future", desc: "Quantum advantage proven for supply-chain optimisation. Major carriers begin integrating quantum solvers into TMS/WMS." },
  { year: "2035", label: "Long-term", status: "future", desc: "Fault-tolerant quantum computers widely available via cloud. Classical encryption standards become obsolete. Quantum logistics is the norm." },
];

const MARKET_STATS = [
  { value: "$1.3T", label: "Projected global quantum market by 2035", source: "McKinsey Global Institute, 2023" },
  { value: "$625B", label: "Value at stake in logistics & supply chain", source: "Boston Consulting Group, 2023" },
  { value: "72%", label: "Of Fortune 500 companies running quantum pilots by 2026", source: "IBM Quantum Network, 2024" },
  { value: "27×", label: "Speed-up quantum delivers on vehicle routing vs classical solvers", source: "Volkswagen / D-Wave study, 2020" },
  { value: "$141B", label: "Quantum computing market size by 2029 (CAGR 30%)", source: "MarketsandMarkets, 2024" },
  { value: "4,000+", label: "Quantum patents filed in logistics & optimisation since 2020", source: "WIPO Quantum Patent DB, 2024" },
];

const ADOPTION_SECTORS = [
  { sector: "Pharma & biotech", readiness: 82, color: "#a855f7" },
  { sector: "Financial services", readiness: 74, color: "#3b82f6" },
  { sector: "Defence & aerospace", readiness: 68, color: "#f87171" },
  { sector: "Energy & utilities", readiness: 54, color: "#f59e0b" },
  { sector: "Logistics & freight", readiness: 47, color: "#22c55e" },
  { sector: "Retail & e-commerce", readiness: 29, color: "#06b6d4" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="h-px flex-1 bg-border/40" />
      <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest px-2">{children}</span>
      <div className="h-px flex-1 bg-border/40" />
    </div>
  );
}

export default function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      {/* ─── HERO ─────────────────────────────────────────────────── */}
      <section className="px-4 pt-20 pb-16 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.72 0.22 200 / 0.5) 1px, transparent 1px), linear-gradient(90deg, oklch(0.72 0.22 200 / 0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow orb */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] opacity-20 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, oklch(0.72 0.22 200), transparent 70%)" }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium mb-6 font-mono">
              16 interactive simulations · Real algorithms · No maths jargon
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-balance mb-5 leading-[1.05]">
              The Future of{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, oklch(0.72 0.22 200), #a855f7, #f59e0b)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Logistics
              </span>{" "}
              is Quantum
            </h1>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto text-balance leading-relaxed">
              Explore how quantum computing will reshape global supply chains — then play with the algorithms yourself.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── WHAT IS QUANTUM COMPUTING? ───────────────────────────── */}
      <section className="px-4 pb-20">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <SectionLabel>What is Quantum Computing?</SectionLabel>

            {/* Big analogy card */}
            <div
              className="rounded-2xl border border-border/50 p-8 mb-6 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, oklch(0.1 0.03 260), oklch(0.12 0.04 280))" }}
            >
              <div
                className="absolute right-0 top-0 w-72 h-72 rounded-full blur-[100px] opacity-10 pointer-events-none"
                style={{ background: "oklch(0.72 0.22 200)" }}
              />
              <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">The simple version</p>
                  <h2 className="text-3xl font-bold mb-4 leading-tight">
                    Imagine a coin that can be{" "}
                    <span style={{ color: "oklch(0.72 0.22 200)" }}>heads and tails at the same time</span>
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    A normal computer uses <strong className="text-foreground">bits</strong> — tiny switches that are either OFF (0) or ON (1). 
                    It solves problems by trying one answer at a time, like flipping a coin once per guess.
                  </p>
                  <p className="text-muted-foreground leading-relaxed mt-3">
                    A quantum computer uses <strong className="text-foreground">qubits</strong> — which can be 0, 1, or <em>both at the same time</em> (called <strong className="text-foreground">superposition</strong>). 
                    It tries every possible answer simultaneously. For huge problems — like routing 10,000 trucks — that difference is the gap between hours and milliseconds.
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
                      <p className="text-[11px] font-mono text-muted-foreground mb-1">{item.label}</p>
                      <p className="font-bold text-sm" style={{ color: item.color }}>{item.visual}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Real world analogies */}
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              {[
                {
                  icon: "🗺️",
                  title: "The sat-nav problem",
                  body: "Your sat-nav finds the best route through a city in seconds. But a logistics company with 500 trucks and 10,000 stops? Classical computers would take longer than the age of the universe to check every combination. Quantum computers solve this in real time.",
                  source: "Vehicle Routing Problem: NP-hard; n! possible routes for n stops",
                  color: "#f59e0b",
                },
                {
                  icon: "💊",
                  title: "The medicine problem",
                  body: "Designing a new cancer drug means testing how billions of molecules interact. Classical computers simulate one interaction per step. A quantum computer simulates all of them at once — cutting drug development from 12 years to potentially 12 months.",
                  source: "Tufts Center for Drug Development · Nature Reviews Drug Discovery, 2023",
                  color: "#a855f7",
                },
                {
                  icon: "🔐",
                  title: "The password problem",
                  body: "Your bank password is safe because cracking it would take a classical computer millions of years. A quantum computer could do it in minutes. That's why governments are racing to build quantum-proof encryption right now — before adversaries get there first.",
                  source: "NIST Post-Quantum Cryptography · Shor's Algorithm, 1994",
                  color: "#f87171",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-border/40 p-5"
                  style={{ background: "oklch(0.1 0.02 260 / 0.5)" }}
                >
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h3 className="font-semibold mb-2" style={{ color: item.color }}>{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
                  {item.source && (
                    <p className="text-[9px] text-muted-foreground/50 font-mono mt-2 italic">Sources: {item.source}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* ─── WHEN TO USE / NOT USE ─────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <SectionLabel>When to use it — and when not to</SectionLabel>

            <div className="grid md:grid-cols-2 gap-5 mb-6">
              {USE_CASES.map((uc) => (
                <div
                  key={uc.label}
                  className="rounded-2xl border p-6"
                  style={{ background: uc.bg, borderColor: uc.border }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">{uc.icon}</span>
                    <span className="font-bold text-sm" style={{ color: uc.color }}>{uc.label}</span>
                  </div>
                  <div className="space-y-3">
                    {uc.items.map((item) => (
                      <div key={item.title} className="flex gap-3">
                        <div className="w-1 rounded-full shrink-0 mt-1" style={{ background: uc.color, minHeight: "100%" }} />
                        <div>
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{item.body}</p>
                          {item.source && (
                            <p className="text-[9px] text-muted-foreground/50 font-mono mt-1 italic">Sources: {item.source}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ─── WHY IT MATTERS ───────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}>
            <SectionLabel>Why it matters right now</SectionLabel>

            <div
              className="rounded-2xl border border-border/50 p-8 mb-6"
              style={{ background: "linear-gradient(135deg, oklch(0.11 0.04 280), oklch(0.1 0.02 240))" }}
            >
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    icon: "🌍",
                    title: "Global supply chains are broken",
                    body: "March 2021: The Ever Given blocks the Suez Canal for 6 days — $9.6 billion in trade halted daily, 369 vessels trapped. Rerouting thousands of ships around Africa means recalculating fuel, ETAs, port slots, and cargo connections simultaneously — a problem with more possible solutions than atoms in the universe. Classical computers take days to produce mediocre answers. Quantum solves it in real time.\n\n2020–2022: COVID empties Asian ports of containers while they pile up in North America and Europe. Shanghai–LA spot rates surge from $1,500 to over $20,000 per box. The industry loses an estimated $150 billion in disruption costs — all rooted in the inability to rebalance 40 million containers globally. This is integer linear programming at planetary scale. A quantum solver running daily could reposition the fleet continuously, preventing the next crisis before it starts.",
                    source: "Lloyd's List · Freightos Baltic Index · Sea-Intelligence",
                    color: "#f59e0b",
                  },
                  {
                    icon: "🏁",
                    title: "The race has already started",
                    body: "IBM, Google, China, and the EU have each committed $1B+ to quantum programs. UPS, FedEx, Volkswagen, and Airbus are all running active quantum pilots today. The companies that learn this technology now will hold a structural advantage in the 2030s.",
                    source: "EU Quantum Flagship · Volkswagen / D-Wave · UPS / IBM Quantum Network",
                    color: "oklch(0.72 0.22 200)",
                  },
                  {
                    icon: "⏳",
                    title: "The window to prepare is 5 years",
                    body: "Quantum computers that outperform classical ones on real logistics problems are 3–7 years away. That sounds like a long time — but migrating a global carrier's systems takes 4–6 years. Companies that start learning in 2025 will be ready. Those that wait until 2030 will be scrambling.",
                    source: "IBM Quantum Roadmap 2025 · Gartner Supply Chain Survey 2024",
                    color: "#22c55e",
                  },
                ].map((item) => (
                  <div key={item.title}>
                    <div className="text-3xl mb-3">{item.icon}</div>
                    <h3 className="font-semibold mb-2 text-sm" style={{ color: item.color }}>{item.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{item.body}</p>
                    {item.source && (
                      <p className="text-[9px] text-muted-foreground/50 font-mono mt-2.5 italic">Sources: {item.source}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ─── MARKET INTELLIGENCE ──────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <SectionLabel>Market Intelligence</SectionLabel>

            {/* Big stats grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {MARKET_STATS.map((stat, i) => (
                <motion.div
                  key={stat.value}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
                  className="rounded-xl border border-border/40 p-5"
                  style={{ background: "oklch(0.1 0.025 260 / 0.7)" }}
                >
                  <p
                    className="text-3xl font-bold font-mono mb-1"
                    style={{ background: "linear-gradient(135deg, oklch(0.72 0.22 200), #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-sm font-medium mb-2">{stat.label}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{stat.source}</p>
                </motion.div>
              ))}
            </div>

            {/* Adoption by sector */}
            <div className="grid md:grid-cols-2 gap-5 mb-8">
              <div className="rounded-2xl border border-border/40 p-6" style={{ background: "oklch(0.1 0.02 260 / 0.5)" }}>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-5">Quantum Readiness by Sector (2025)</p>
                <div className="space-y-3">
                  {ADOPTION_SECTORS.map((s) => (
                    <div key={s.sector}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{s.sector}</span>
                        <span className="font-mono" style={{ color: s.color }}>{s.readiness}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-border/30 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${s.readiness}%` }}
                          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: s.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-4">Source: Deloitte Quantum Readiness Survey, 2024. Based on C-suite pilot commitments and budget allocation.</p>
              </div>

              <div className="rounded-2xl border border-border/40 p-6" style={{ background: "oklch(0.1 0.02 260 / 0.5)" }}>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-5">GTM Timeline for Quantum Logistics Solutions</p>
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
                        {i < TIMELINE.length - 1 && (
                          <div className="w-px flex-1 bg-border/30 my-1" style={{ minHeight: "16px" }} />
                        )}
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
          </motion.div>

          {/* ─── SIMULATIONS GRID ─────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}>
            <SectionLabel>Try the Simulations</SectionLabel>

            <p className="text-center text-muted-foreground text-sm mb-8 max-w-xl mx-auto">
              Every puzzle below uses a <strong className="text-foreground">real algorithm</strong> — the same logic quantum computers will one day run at superhuman scale. Play manually, then hit the <strong className="text-foreground">Smart Helper</strong> to see the optimal solution explained in plain language.
            </p>

            {/* Featured: Quantum Shipment Lifecycle */}
            <Link to="/quantum-shipment" className="block mb-10 group cursor-pointer">
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="relative rounded-2xl border border-primary/40 overflow-hidden p-7"
                style={{ background: "linear-gradient(135deg, oklch(0.09 0.04 220), oklch(0.12 0.06 200))" }}
              >
                {/* Glow */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: "radial-gradient(ellipse at 80% 50%, oklch(0.72 0.22 200), transparent 60%)" }} />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-1.5 bg-primary/20 border border-primary/40 text-primary text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full mb-3">
                      ⭐ Featured — New
                    </div>
                    <h2 className="text-2xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
                      Quantum Shipment Lifecycle
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed max-w-lg">
                      Follow one container from Delhi to Chicago through 10 real logistics touchpoints. Make manual decisions, then hit <strong className="text-foreground">Quantum Boost</strong> at each stage to see the optimal choice — and watch your savings stack up.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4 text-xs">
                      {["Empty Container Pickup", "Vessel Stowage", "Customs", "Rail Scheduling", "Last-Mile TSP"].map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary/80">{tag}</span>
                      ))}
                      <span className="px-2 py-0.5 rounded-full bg-muted/40 border border-border text-muted-foreground">+5 more stages</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-center gap-2">
                    <div className="w-20 h-20 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-4xl">
                      🌍
                    </div>
                    <span className="text-primary font-semibold text-sm group-hover:translate-x-1 transition-transform">
                      Play now →
                    </span>
                  </div>
                </div>
              </motion.div>
            </Link>

            <div className="space-y-10">
              {CATEGORIES.map((cat, ci) => (
                <motion.div
                  key={cat.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.35 + ci * 0.06 }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">{cat.icon}</span>
                    <h2 className="text-xl font-bold">{cat.title}</h2>
                    <div className="h-px flex-1 bg-border/50 ml-2" />
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {cat.sims.map((sim, si) => (
                      <motion.div
                        key={sim.path}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: ci * 0.05 + si * 0.03 }}
                      >
                        <Link
                          to={sim.path}
                          className="block h-full cursor-pointer group"
                        >
                          <motion.div
                            whileHover={{ scale: 1.03, y: -3 }}
                            whileTap={{ scale: 0.98 }}
                            className="relative rounded-xl border border-border/50 overflow-hidden p-5 h-full flex flex-col bg-card transition-shadow duration-300"
                            style={{
                              borderColor: `${cat.color}40`,
                              boxShadow: `0 0 40px ${cat.color}10`,
                            }}
                          >
                            {/* Subtle glow overlay */}
                            <div
                              className="absolute inset-0 opacity-[0.05] pointer-events-none transition-opacity duration-300 group-hover:opacity-[0.14]"
                              style={{
                                background: `radial-gradient(ellipse at 80% 0%, ${cat.color}, transparent 60%)`,
                              }}
                            />

                            <div className="relative z-10 flex flex-col h-full">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-3">
                                <span className="text-3xl">{sim.emoji}</span>
                                <span className="text-xs text-muted-foreground font-mono">{sim.diff}</span>
                              </div>

                              {/* Title + puzzle description */}
                              <h3
                                className="font-bold text-lg mb-2 group-hover:brightness-110 transition-all duration-200"
                                style={{ color: cat.color }}
                              >
                                {sim.title}
                              </h3>
                              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                                {sim.desc}
                              </p>

                              {/* Algorithm box */}
                              <div
                                className="rounded-lg px-3 py-3 border flex-1 flex flex-col gap-1.5 transition-colors duration-200"
                                style={{
                                  background: `${cat.color}0d`,
                                  borderColor: `${cat.color}30`,
                                }}
                              >
                                <span
                                  className="text-[10px] font-mono uppercase tracking-wider"
                                  style={{ color: `${cat.color}99` }}
                                >
                                  Algorithm used
                                </span>
                                <p
                                  className="text-sm font-bold leading-tight"
                                  style={{ color: cat.color }}
                                >
                                  {sim.algo}
                                </p>
                                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                                  {sim.algoWhy}
                                </p>
                              </div>

                              <div
                                className="mt-4 text-sm font-semibold group-hover:translate-x-1.5 transition-transform shrink-0"
                                style={{ color: cat.color }}
                              >
                                Play →
                              </div>
                            </div>
                          </motion.div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 px-4 py-8 mt-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-[9px] font-bold font-mono">Q</span>
            </div>
            <span className="font-semibold text-foreground">QuantumSim</span>
            <span>·</span>
            <span>Interactive logistics &amp; quantum algorithm explorer</span>
          </div>
          <span className="font-mono">© {new Date().getFullYear()} · All algorithms are exact, not simulated approximations</span>
        </div>
      </footer>
    </div>
  );
}
