export type Sim = {
  path: string;
  title: string;
  emoji: string;
  desc: string;
  diff: string;
  algo: string;
  algoWhy: string;
};

export type Category = {
  icon: string;
  title: string;
  color: string;
  sims: Sim[];
};

export const CATEGORIES: Category[] = [
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
        algoWhy: "Like ripples in a pond — it explores every possible move one step at a time, guaranteeing the shortest solution.",
      },
      {
        path: "/vessel-stowage",
        title: "Vessel Stowage Tetris",
        emoji: "⛴️",
        desc: "Load a ship's 3×3 grid so every port's cargo is accessible without re-stowing.",
        diff: "⭐⭐ Medium",
        algo: "Constraint Satisfaction",
        algoWhy: "Like solving a Sudoku — it places each cargo block and immediately checks 'does this break any rule?'.",
      },
      {
        path: "/empty-container",
        title: "Empty Container Repositioning",
        emoji: "📦",
        desc: "Route empty containers from surplus ports to deficit ports across a global network at minimum cost.",
        diff: "⭐ Easy",
        algo: "Integer Linear Programming",
        algoWhy: "Like a budget planner — it treats each container move as a cost and finds the cheapest total bill.",
      },
      {
        path: "/berth-race",
        title: "Berth Race",
        emoji: "⚓",
        desc: "Schedule 5 arriving ships across 2 berths to finish all cargo work as early as possible.",
        diff: "⭐⭐ Medium",
        algo: "Permutation Search",
        algoWhy: "Like trying every queue order at a checkout — it tests all arrangements and picks the fastest.",
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
        algoWhy: "Like arranging stops on a road trip — it tries all orderings and discards any that miss a delivery window.",
      },
      {
        path: "/cross-dock",
        title: "Cross-Dock Sprint",
        emoji: "🏭",
        desc: "Assign inbound trucks to dock doors so every outbound truck leaves on time.",
        diff: "⭐⭐ Medium",
        algo: "Assignment Optimisation",
        algoWhy: "Like seating guests so no one waits too long — it tests every combination and picks the fastest schedule.",
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
        algoWhy: "Like following every road on a map — it explores all combinations of transport legs and picks the cheapest valid path.",
      },
      {
        path: "/spot-bid",
        title: "Spot Bid Battle",
        emoji: "💰",
        desc: "Match 4 urgent loads to 3 carriers to maximise your brokerage profit.",
        diff: "⭐ Easy",
        algo: "Exhaustive Combination Search",
        algoWhy: "Like checking every way to split a bill — it tests all 64 assignments and picks the most profitable.",
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
        algoWhy: "Like packing a suitcase by trying each item and undoing if something doesn't fit — it places cargo unit by unit.",
      },
      {
        path: "/flight-capacity",
        title: "Flight Capacity Auction",
        emoji: "💺",
        desc: "Accept the right booking mix across multiple flights — balance revenue against fuel costs.",
        diff: "⭐ Easy",
        algo: "0/1 Knapsack + Greedy Heuristic",
        algoWhy: "Like a cargo airline's revenue manager — it evaluates booking combinations to maximise profit per flight.",
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
        algoWhy: "The Travelling Salesman Problem — with 5 stops there are 120 routes. The computer checks every single one.",
      },
      {
        path: "/dock",
        title: "Dock Door Dilemma",
        emoji: "🏭",
        desc: "Assign 4 trucks to 3 dock doors to finish unloading as fast as possible.",
        diff: "⭐ Easy",
        algo: "Makespan Minimisation",
        algoWhy: "Like splitting chores so everyone finishes at the same time — it finds the assignment that finishes fastest.",
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
        algoWhy: "Instead of sending a password through the internet, BB84 sends it as quantum light particles. Interception leaves a fingerprint.",
      },
      {
        path: "/grovers",
        title: "Grover's Search",
        emoji: "🔍",
        desc: "Watch amplitude amplification find a hidden item in an unsorted list with far fewer checks.",
        diff: "⭐⭐⭐ Advanced",
        algo: "Grover's Quantum Search",
        algoWhy: "Finding one name in 1M takes up to 1M checks classically. Grover needs only 1,000 — a 1,000× speedup.",
      },
    ],
  },
];

export const USE_CASES = [
  {
    icon: "✅",
    label: "Great fit",
    color: "#22c55e",
    bg: "oklch(0.22 0.05 150)",
    border: "#22c55e30",
    items: [
      { title: "Route optimisation", body: "Finding the single best delivery route among billions of options — today's computers give up and guess. A quantum computer checks them all at once." },
      { title: "Container stowage & yard planning", body: "A 24,000 TEU mega-ship making 6 port calls has more possible stacking configurations than atoms in the observable universe. Quantum constraint solvers find a restow-free plan in seconds.", source: "Drewry Maritime Research · Port of Rotterdam Digital Twin" },
      { title: "Intermodal freight routing", body: "Combining truck, rail, barge, and ocean across 1,000+ city pairs creates a search space exceeding 10¹⁰⁰⁰. DB Schenker and DHL are piloting quantum solvers today.", source: "DB Schenker · DHL Innovation Center, 2024" },
      { title: "Empty container repositioning", body: "The global fleet of 40 million TEU containers is constantly in the wrong place. Quantum annealers deliver order-of-magnitude speedups over classical solvers.", source: "Drewry Container Census 2024" },
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

export const TIMELINE = [
  { year: "2025", label: "Now", status: "current" as const, desc: "100–1,000 qubit machines exist in labs. Noisy but functional. Early pilots in pharma, finance, and logistics." },
  { year: "2027", label: "Near-term", status: "soon" as const, desc: "Error correction matures. 10,000-qubit systems. First commercial quantum optimisation services for route planning go live." },
  { year: "2030", label: "Mid-term", status: "future" as const, desc: "Quantum advantage proven for supply-chain optimisation. Major carriers begin integrating quantum solvers into TMS/WMS." },
  { year: "2035", label: "Long-term", status: "future" as const, desc: "Fault-tolerant quantum computers widely available via cloud. Classical encryption standards become obsolete." },
];

export const MARKET_STATS = [
  { value: "$1.3T", label: "Projected global quantum market by 2035", source: "McKinsey Global Institute, 2023" },
  { value: "$625B", label: "Value at stake in logistics & supply chain", source: "Boston Consulting Group, 2023" },
  { value: "72%", label: "Of Fortune 500 companies running quantum pilots by 2026", source: "IBM Quantum Network, 2024" },
  { value: "27×", label: "Speed-up quantum delivers on vehicle routing vs classical solvers", source: "Volkswagen / D-Wave study, 2020" },
  { value: "$141B", label: "Quantum computing market size by 2029 (CAGR 30%)", source: "MarketsandMarkets, 2024" },
  { value: "4,000+", label: "Quantum patents filed in logistics & optimisation since 2020", source: "WIPO Quantum Patent DB, 2024" },
];

export const ADOPTION_SECTORS = [
  { sector: "Pharma & biotech", readiness: 82, color: "#a855f7" },
  { sector: "Financial services", readiness: 74, color: "#3b82f6" },
  { sector: "Defence & aerospace", readiness: 68, color: "#f87171" },
  { sector: "Energy & utilities", readiness: 54, color: "#f59e0b" },
  { sector: "Logistics & freight", readiness: 47, color: "#22c55e" },
  { sector: "Retail & e-commerce", readiness: 29, color: "#06b6d4" },
];
