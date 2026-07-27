import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useAuthContext } from "@/lib/auth/index.ts";
import { FadeInView, AnimatedCounter } from "@/components/animations/index.ts";
import { motion } from "motion/react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Gamepad2, Eye, Heart, ThumbsDown, TrendingUp, Users,
  Activity, Search, ArrowLeft, Star, Trophy, Award,
  ChevronUp, ChevronDown, Percent, BarChart3,
} from "lucide-react";

const GAME_CATEGORIES: Record<string, { name: string; emoji: string }> = {
  "Shipping Lines": { name: "Shipping Lines", emoji: "🚢" },
  "Trucking": { name: "Trucking", emoji: "🚛" },
  "Freight Forwarders": { name: "Freight Forwarders", emoji: "🗺️" },
  "Air Cargo": { name: "Air Cargo", emoji: "✈️" },
  "Logistics Basics": { name: "Logistics Basics", emoji: "🚚" },
  "Quantum Algorithms": { name: "Quantum Algorithms", emoji: "⚛" },
  "Featured": { name: "Featured", emoji: "⭐" },
};

const GAME_TOPIC_MAP: Record<string, string> = {
  "/container-stack": "Shipping Lines",
  "/vessel-stowage": "Shipping Lines",
  "/empty-container": "Shipping Lines",
  "/berth-race": "Shipping Lines",
  "/trip-chain": "Trucking",
  "/cross-dock": "Trucking",
  "/intermodal": "Freight Forwarders",
  "/spot-bid": "Freight Forwarders",
  "/uld-loading": "Air Cargo",
  "/flight-capacity": "Air Cargo",
  "/delivery": "Logistics Basics",
  "/dock": "Logistics Basics",
  "/bb84": "Quantum Algorithms",
  "/grovers": "Quantum Algorithms",
  "/quantum-shipment": "Featured",
};

const COLORS = [
  "oklch(0.72 0.22 200)", "oklch(0.6 0.25 280)", "oklch(0.8 0.2 150)",
  "oklch(0.7 0.25 30)", "oklch(0.55 0.2 330)", "oklch(0.65 0.2 180)",
  "oklch(0.75 0.15 250)", "oklch(0.6 0.15 50)", "oklch(0.5 0.2 20)",
  "oklch(0.62 0.18 160)", "oklch(0.7 0.15 300)", "oklch(0.58 0.12 80)",
  "oklch(0.68 0.2 220)", "oklch(0.52 0.2 350)", "oklch(0.75 0.18 180)",
];

function getGameTopic(path: string): string {
  return GAME_TOPIC_MAP[path] ?? "Other";
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function GameAnalysis() {
  const { email } = useAuthContext();
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("30d");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"visits" | "likes" | "engagement" | "users">("visits");
  const [gameView, setGameView] = useState<"games" | "topics">("games");

  const now = useMemo(() => Date.now(), [dateRange]);
  const startDate = useMemo(() =>
    dateRange === "7d" ? now - 7 * 86400000 : dateRange === "30d" ? now - 30 * 86400000 : undefined,
  [dateRange, now]);

  const gameAnalytics = useQuery(api.analytics.getGameAnalytics, {
    adminEmail: email ?? "",
    gamePath: selectedGame ?? undefined,
    startDate,
    endDate: now,
  });

  const topicAnalytics = useQuery(api.analytics.getTopicAnalytics, {
    adminEmail: email ?? "",
    startDate,
    endDate: now,
  });

  // Process games
  const processedGames = useMemo(() => {
    if (!gameAnalytics?.games) return [];

    let games = [...gameAnalytics.games];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      games = games.filter((g) => g.title.toLowerCase().includes(q) || g.path.toLowerCase().includes(q));
    }

    games.sort((a, b) => {
      switch (sortBy) {
        case "visits": return b.visitCount - a.visitCount;
        case "likes": return b.likes - a.likes;
        case "engagement": return b.engagement - a.engagement;
        case "users": return b.uniqueUsers - a.uniqueUsers;
        default: return 0;
      }
    });

    return games;
  }, [gameAnalytics, searchQuery, sortBy]);

  // Group by topic
  const gamesByTopic = useMemo(() => {
    const map = new Map<string, typeof processedGames>();
    for (const game of processedGames) {
      const topic = getGameTopic(game.path);
      const existing = map.get(topic) ?? [];
      existing.push(game);
      map.set(topic, existing);
    }
    return map;
  }, [processedGames]);

  // Selected game detail
  const selectedGameData = useMemo(() => {
    if (!selectedGame || !gameAnalytics?.games) return null;
    return gameAnalytics.games.find((g) => g.path === selectedGame) ?? null;
  }, [selectedGame, gameAnalytics]);

  // Topic stats
  const topicStats = useMemo(() => {
    const map = new Map<string, { visits: number; likes: number; users: number; count: number }>();
    for (const game of processedGames) {
      const topic = getGameTopic(game.path);
      const existing = map.get(topic) ?? { visits: 0, likes: 0, users: 0, count: 0 };
      existing.visits += game.visitCount;
      existing.likes += game.likes;
      existing.users += game.uniqueUsers;
      existing.count++;
      map.set(topic, existing);
    }
    return Array.from(map.entries()).map(([topic, data]) => ({
      topic,
      ...data,
      emoji: GAME_CATEGORIES[topic]?.emoji ?? "🎮",
    })).sort((a, b) => b.visits - a.visits);
  }, [processedGames]);

  if (!email) return null;

  return (
    <div>
      {/* ═══════ HERO ═══════ */}
      <section className="relative px-4 pt-8 pb-6 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-[150px] opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, oklch(0.8 0.2 150), transparent 70%)" }} />
        <div className="relative z-10 max-w-7xl mx-auto">
          <FadeInView>
            {selectedGame ? (
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setSelectedGame(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all border border-border/30"
                >
                  <ArrowLeft className="size-3.5" />
                  Back to all games
                </button>
              </div>
            ) : null}
            <div className="flex items-center gap-2 border border-primary/25 bg-primary/8 text-primary px-3 py-1 rounded-full text-[10px] font-medium mb-4 font-mono w-fit">
              <Gamepad2 className="size-3" />
              GAME ANALYSIS
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  🎮 Game <span className="text-gradient">Analysis</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedGame ? selectedGameData?.title ?? selectedGame : "Game performance, engagement & popularity"}
                </p>
              </div>
              {!selectedGame && (
                <div className="flex gap-1 rounded-xl border border-border/40 bg-card/50 p-1">
                  {(["7d", "30d", "all"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDateRange(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        dateRange === d
                          ? "bg-primary/10 text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {d === "7d" ? "7 Days" : d === "30d" ? "30 Days" : "All Time"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FadeInView>
        </div>
      </section>

      <div className="max-w-7xl mx-auto w-full px-4 pb-20 space-y-6">
        {selectedGame && selectedGameData ? (
          /* ═══════════════════════════════════════════ */
          /* ─── SINGLE GAME DEEP DIVE ──────────────── */
          /* ═══════════════════════════════════════════ */
          <div className="space-y-6">
            {/* Game Header */}
            <FadeInView direction="up">
              <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl shrink-0">
                    🎮
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold">{selectedGameData.title}</h2>
                    <p className="text-xs font-mono text-muted-foreground">{selectedGameData.path}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                        {getGameTopic(selectedGameData.path)}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        First visit: {selectedGameData.firstVisit ? new Date(selectedGameData.firstVisit).toLocaleDateString() : "N/A"}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        Last: {timeAgo(selectedGameData.lastVisit)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center px-3 py-2 rounded-xl bg-muted/20">
                      <p className="text-lg font-bold font-mono text-cyan-400">{selectedGameData.visitCount}</p>
                      <p className="text-[8px] font-mono text-muted-foreground">Visits</p>
                    </div>
                    <div className="text-center px-3 py-2 rounded-xl bg-muted/20">
                      <p className="text-lg font-bold font-mono text-purple-400">{selectedGameData.uniqueUsers}</p>
                      <p className="text-[8px] font-mono text-muted-foreground">Users</p>
                    </div>
                    <div className="text-center px-3 py-2 rounded-xl bg-muted/20">
                      <p className="text-lg font-bold font-mono text-rose-400">{selectedGameData.likes}</p>
                      <p className="text-[8px] font-mono text-muted-foreground">Likes</p>
                    </div>
                    <div className="text-center px-3 py-2 rounded-xl bg-muted/20">
                      <p className="text-lg font-bold font-mono text-amber-400">{selectedGameData.engagement.toFixed(1)}</p>
                      <p className="text-[8px] font-mono text-muted-foreground">Eng.</p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInView>

            {/* Visit Trend */}
            <FadeInView direction="up">
              <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
                <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="size-4" />
                  Visit Trend
                </h2>
                {selectedGameData.visitsByDay.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedGameData.visitsByDay}>
                        <defs>
                          <linearGradient id="gameTrendGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(0.8 0.2 150)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="oklch(0.8 0.2 150)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.02 260 / 0.3)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(d) => d.slice(5)} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: "oklch(0.1 0.025 260)", border: "1px solid oklch(0.22 0.03 260)", borderRadius: "8px", fontSize: "12px" }}
                          labelFormatter={(d) => new Date(d).toLocaleDateString()}
                        />
                        <Area type="monotone" dataKey="count" stroke="oklch(0.8 0.2 150)" fill="url(#gameTrendGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">No trend data</p>
                )}
              </div>
            </FadeInView>

            {/* Engagement Metrics */}
            <FadeInView direction="up">
              <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
                <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Activity className="size-4" />
                  Engagement Breakdown
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                    <Eye className="size-5 mx-auto mb-1 text-cyan-400" />
                    <p className="text-xl font-bold font-mono text-cyan-400">{selectedGameData.visitCount}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">Total Visits</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                    <Users className="size-5 mx-auto mb-1 text-purple-400" />
                    <p className="text-xl font-bold font-mono text-purple-400">{selectedGameData.uniqueUsers}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">Unique Users</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-rose-500/10 to-red-500/10 border border-rose-500/20">
                    <Heart className="size-5 mx-auto mb-1 text-rose-400" />
                    <p className="text-xl font-bold font-mono text-rose-400">{selectedGameData.likes}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">Likes</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                    <Activity className="size-5 mx-auto mb-1 text-amber-400" />
                    <p className="text-xl font-bold font-mono text-amber-400">{selectedGameData.engagement.toFixed(2)}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">Engagement Rate</p>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground mt-4 text-center">
                  Engagement = visits ÷ unique users — higher means users return more often
                </p>
              </div>
            </FadeInView>
          </div>
        ) : (
          /* ═══════════════════════════════════════════ */
          /* ─── ALL GAMES OVERVIEW ─────────────────── */
          /* ═══════════════════════════════════════════ */
          <>
            {/* Summary Cards */}
            <FadeInView direction="up">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                <div className="rounded-xl border border-border/40 bg-card/50 p-3 text-center">
                  <Gamepad2 className="size-3.5 mx-auto mb-1 text-primary" />
                  <p className="text-base font-bold font-mono"><AnimatedCounter to={gameAnalytics?.totalGames ?? 0} duration={1} /></p>
                  <p className="text-[9px] font-mono text-muted-foreground">Games</p>
                </div>
                <div className="rounded-xl border border-border/40 bg-card/50 p-3 text-center">
                  <Eye className="size-3.5 mx-auto mb-1 text-cyan-400" />
                  <p className="text-base font-bold font-mono text-cyan-400"><AnimatedCounter to={gameAnalytics?.totalVisits ?? 0} duration={1} /></p>
                  <p className="text-[9px] font-mono text-muted-foreground">Visits</p>
                </div>
                <div className="rounded-xl border border-border/40 bg-card/50 p-3 text-center">
                  <Users className="size-3.5 mx-auto mb-1 text-purple-400" />
                  <p className="text-base font-bold font-mono text-purple-400"><AnimatedCounter to={gameAnalytics?.uniqueUsers ?? 0} duration={1} /></p>
                  <p className="text-[9px] font-mono text-muted-foreground">Users</p>
                </div>
                <div className="rounded-xl border border-border/40 bg-card/50 p-3 text-center">
                  <Activity className="size-3.5 mx-auto mb-1 text-emerald-400" />
                  <p className="text-base font-bold font-mono text-emerald-400">{gameAnalytics?.overallEngagement ?? "—"}</p>
                  <p className="text-[9px] font-mono text-muted-foreground">Engagement</p>
                </div>
                <div className="rounded-xl border border-border/40 bg-card/50 p-3 text-center">
                  <Heart className="size-3.5 mx-auto mb-1 text-rose-400" />
                  <p className="text-base font-bold font-mono text-rose-400"><AnimatedCounter to={gameAnalytics?.totalLikes ?? 0} duration={1} /></p>
                  <p className="text-[9px] font-mono text-muted-foreground">Likes</p>
                </div>
                <div className="rounded-xl border border-border/40 bg-card/50 p-3 text-center">
                  <Percent className="size-3.5 mx-auto mb-1 text-rose-400" />
                  <p className="text-base font-bold font-mono text-rose-400">{gameAnalytics?.overallLikeRatio ?? 0}%</p>
                  <p className="text-[9px] font-mono text-muted-foreground">Like Ratio</p>
                </div>
                <div className="rounded-xl border border-border/40 bg-card/50 p-3 text-center">
                  <BarChart3 className="size-3.5 mx-auto mb-1 text-sky-400" />
                  <p className="text-base font-bold font-mono text-sky-400">{gameAnalytics?.avgVisitsPerGame ?? "—"}</p>
                  <p className="text-[9px] font-mono text-muted-foreground">Avg/Game</p>
                </div>
                <div className="rounded-xl border border-border/40 bg-card/50 p-3 text-center">
                  <ThumbsDown className="size-3.5 mx-auto mb-1 text-orange-400" />
                  <p className="text-base font-bold font-mono text-orange-400"><AnimatedCounter to={gameAnalytics?.totalDislikes ?? 0} duration={1} /></p>
                  <p className="text-[9px] font-mono text-muted-foreground">Dislikes</p>
                </div>
              </div>
            </FadeInView>

            {/* Topic Distribution */}
            <FadeInView direction="up">
              <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
                <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Trophy className="size-4" />
                  Category Performance
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {(gameAnalytics?.categoryShare ?? topicStats).map((topic: any) => (
                    <motion.div
                      key={topic.name ?? topic.topic}
                      whileHover={{ y: -2 }}
                      className="rounded-xl border border-border/40 p-4 bg-card/50 text-center hover:border-border/60 transition-all"
                    >
                      <p className="text-2xl mb-1">{topic.emoji ?? GAME_CATEGORIES[topic.name ?? topic.topic]?.emoji ?? "🎮"}</p>
                      <p className="text-xs font-bold truncate">{topic.name ?? topic.topic}</p>
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <p className="text-lg font-bold font-mono text-cyan-400">{topic.visits}</p>
                        <span className="text-xs font-mono text-amber-400">{topic.share ?? 0}%</span>
                      </div>
                      <p className="text-[9px] font-mono text-muted-foreground">
                        {topic.games ?? topic.count} games
                      </p>
                      {/* Share bar */}
                      <div className="mt-2 h-1.5 rounded-full bg-muted/20 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-400"
                          style={{ width: `${topic.share ?? 0}%` }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </FadeInView>

            {/* Trend Chart */}
            <FadeInView direction="up">
              <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
                <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="size-4" />
                  Game Visit Trend
                </h2>
                {gameAnalytics?.trend && gameAnalytics.trend.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={gameAnalytics.trend}>
                        <defs>
                          <linearGradient id="gameTrendAll" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(0.8 0.2 150)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="oklch(0.8 0.2 150)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.02 260 / 0.3)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(d) => d.slice(5)} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: "oklch(0.1 0.025 260)", border: "1px solid oklch(0.22 0.03 260)", borderRadius: "8px", fontSize: "12px" }}
                          labelFormatter={(d) => new Date(d).toLocaleDateString()}
                        />
                        <Area type="monotone" dataKey="count" stroke="oklch(0.8 0.2 150)" fill="url(#gameTrendAll)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">No trend data</p>
                )}
              </div>
            </FadeInView>

            {/* View Toggle: Games vs Topics */}
            <FadeInView direction="up">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-1 rounded-lg border border-border/30 p-0.5">
                  {(["games", "topics"] as const).map((v) => (
                    <button key={v} onClick={() => { setGameView(v); setSelectedGame(null); }}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                        gameView === v ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}>
                      {v === "games" ? "🎮 By Game" : "📊 By Topic"}
                    </button>
                  ))}
                </div>
              </div>
            </FadeInView>

            {gameView === "games" ? (
            <>
            {/* Filters & Sort */}
            <FadeInView direction="up">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
                  <input
                    type="text"
                    placeholder="Search games..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-border/40 bg-card/50 text-xs font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors"
                  />
                </div>
                <div className="flex gap-1 rounded-lg border border-border/30 p-0.5">
                  {(["visits", "likes", "engagement", "users"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSortBy(s)}
                      className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all ${
                        sortBy === s
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {s === "visits" ? "Visits" : s === "likes" ? "Likes" : s === "engagement" ? "Engagement" : "Users"}
                    </button>
                  ))}
                </div>
              </div>
            </FadeInView>

            {/* Games List - grouped by topic */}
            <FadeInView direction="up">
              <div className="space-y-4">
                {Array.from(gamesByTopic.entries()).map(([topic, games]) => (
                  <div key={topic} className="rounded-2xl border border-border/40 bg-card/50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border/30 bg-muted/10">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{GAME_CATEGORIES[topic]?.emoji ?? "🎮"}</span>
                        <span className="text-sm font-bold">{topic}</span>
                        <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                          {games.length} games · {games.reduce((s, g) => s + g.visitCount, 0)} visits
                        </span>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/20">
                            <th className="text-left px-4 py-2.5 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Game</th>
                            <th className="text-center px-3 py-2.5 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Visits</th>
                            <th className="text-center px-3 py-2.5 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Users</th>
                            <th className="text-center px-3 py-2.5 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Likes</th>
                            <th className="text-center px-3 py-2.5 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Engagement</th>
                            <th className="text-right px-4 py-2.5 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {games.map((game, i) => {
                            const maxVisits = Math.max(...games.map((g) => g.visitCount));
                            return (
                              <tr
                                key={game.path}
                                className="border-b border-border/10 hover:bg-muted/20 transition-colors cursor-pointer"
                                onClick={() => setSelectedGame(game.path)}
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-[10px] font-mono text-muted-foreground w-4 text-right">{i + 1}.</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate max-w-[200px]">{game.title}</p>
                                    </div>
                                    <div className="h-1.5 w-16 rounded-full bg-muted/20 overflow-hidden hidden sm:block">
                                      <div
                                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
                                        style={{ width: `${(game.visitCount / maxVisits) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className="text-xs font-mono font-bold text-cyan-400">{game.visitCount}</span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className="text-xs font-mono text-purple-400">{game.uniqueUsers}</span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className="text-xs font-mono text-rose-400">{game.likes}</span>
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className="text-xs font-mono text-emerald-400">{game.engagement.toFixed(1)}</span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedGame(game.path); }}
                                    className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
                {gamesByTopic.size === 0 && (
                  <div className="text-center py-12 text-sm text-muted-foreground">
                    {searchQuery ? "No games match your search" : "No game data available yet"}
                  </div>
                )}
              </div>
            </FadeInView>
            </>
          ) : (
            /* ═══════════════════════════════════════════ */
            /* ─── TOPIC ANALYTICS ─────────────────────── */
            /* ═══════════════════════════════════════════ */
            <>
              {/* Topic Summary Cards */}
              <FadeInView direction="up">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-border/40 bg-card/50 p-4 text-center">
                    <Trophy className="size-4 mx-auto mb-1 text-primary" />
                    <p className="text-xl font-bold font-mono"><AnimatedCounter to={topicAnalytics?.totalTopics ?? 0} duration={1} /></p>
                    <p className="text-[10px] font-mono text-muted-foreground">Topics</p>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-card/50 p-4 text-center">
                    <Eye className="size-4 mx-auto mb-1 text-cyan-400" />
                    <p className="text-xl font-bold font-mono text-cyan-400"><AnimatedCounter to={topicAnalytics?.totalVisits ?? 0} duration={1} /></p>
                    <p className="text-[10px] font-mono text-muted-foreground">Game Visits</p>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-card/50 p-4 text-center">
                    <Users className="size-4 mx-auto mb-1 text-purple-400" />
                    <p className="text-xl font-bold font-mono text-purple-400"><AnimatedCounter to={topicAnalytics?.totalUsers ?? 0} duration={1} /></p>
                    <p className="text-[10px] font-mono text-muted-foreground">Players</p>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-card/50 p-4 text-center">
                    <Percent className="size-4 mx-auto mb-1 text-amber-400" />
                    <p className="text-xl font-bold font-mono text-amber-400">{topicAnalytics?.concentration ?? 0}%</p>
                    <p className="text-[10px] font-mono text-muted-foreground">Top Topic Share</p>
                  </div>
                </div>
              </FadeInView>

              {/* Topic Cards */}
              <FadeInView direction="up">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topicAnalytics?.topics.map((topic, i) => (
                    <motion.div
                      key={topic.name}
                      whileHover={{ y: -2 }}
                      className="rounded-2xl border border-border/40 p-5 bg-card/50 hover:border-border/60 transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{GAME_CATEGORIES[topic.name]?.emoji ?? "📊"}</span>
                          <h3 className="text-sm font-bold">{topic.name}</h3>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-medium">
                          {topic.trafficShare}%
                        </span>
                      </div>

                      {/* Metric row */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="text-center">
                          <p className="text-sm font-bold font-mono text-cyan-400">{topic.visits}</p>
                          <p className="text-[8px] font-mono text-muted-foreground">Visits</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold font-mono text-purple-400">{topic.uniqueUsers}</p>
                          <p className="text-[8px] font-mono text-muted-foreground">Users</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold font-mono text-emerald-400">{topic.engagementRate}</p>
                          <p className="text-[8px] font-mono text-muted-foreground">Engage</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold font-mono text-rose-400">{topic.likeRatio}%</p>
                          <p className="text-[8px] font-mono text-muted-foreground">Like</p>
                        </div>
                      </div>

                      {/* Progress bars */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-mono text-muted-foreground w-12">Traffic</span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted/20 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-400" style={{ width: `${topic.trafficShare}%` }} />
                          </div>
                          <span className="text-[8px] font-mono text-muted-foreground w-8 text-right">{topic.trafficShare}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-mono text-muted-foreground w-12">Users</span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted/20 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400" style={{ width: `${topic.userCapture}%` }} />
                          </div>
                          <span className="text-[8px] font-mono text-muted-foreground w-8 text-right">{topic.userCapture}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-mono text-muted-foreground w-12">Likes</span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted/20 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-pink-400" style={{ width: `${topic.likeShare}%` }} />
                          </div>
                          <span className="text-[8px] font-mono text-muted-foreground w-8 text-right">{topic.likeShare}%</span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[9px] font-mono text-muted-foreground/60">
                        <span>{topic.gameCount} games</span>
                        <span>{topic.likes} likes</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </FadeInView>
            </>
          )}
          </>
        )}
      </div>
    </div>
  );
}
