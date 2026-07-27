import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useAuthContext } from "@/lib/auth/index.ts";
import { FadeInView, AnimatedCounter } from "@/components/animations/index.ts";
import { motion } from "motion/react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, PieChart, Pie, Cell,
} from "recharts";
import {
  FileText, Eye, Users, Calendar, Clock, TrendingUp,
  Search, ArrowLeft, ExternalLink, Globe, Activity,
} from "lucide-react";

const GAME_PATHS = new Set([
  "/bb84", "/grovers", "/delivery", "/dock",
  "/container-stack", "/vessel-stowage", "/empty-container", "/berth-race",
  "/trip-chain", "/cross-dock", "/intermodal", "/spot-bid",
  "/uld-loading", "/flight-capacity", "/quantum-shipment",
]);

const COLORS = [
  "oklch(0.72 0.22 200)", "oklch(0.6 0.25 280)", "oklch(0.8 0.2 150)",
  "oklch(0.7 0.25 30)", "oklch(0.55 0.2 330)", "oklch(0.65 0.2 180)",
  "oklch(0.75 0.15 250)", "oklch(0.6 0.15 50)",
];

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
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

export default function PageAnalytics() {
  const { email } = useAuthContext();
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("30d");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [pageType, setPageType] = useState<"all" | "game" | "content">("all");

  const now = useMemo(() => Date.now(), [dateRange]);
  const startDate = useMemo(() =>
    dateRange === "7d" ? now - 7 * 86400000 : dateRange === "30d" ? now - 30 * 86400000 : undefined,
  [dateRange, now]);

  const pageAnalytics = useQuery(api.analytics.getPageAnalytics, {
    adminEmail: email ?? "",
    pagePath: selectedPage ?? undefined,
    startDate,
    endDate: now,
  });

  const gameAnalytics = useQuery(api.analytics.getGameAnalytics, {
    adminEmail: email ?? "",
    startDate,
    endDate: now,
  });

  // Process pages
  const processedPages = useMemo(() => {
    if (!pageAnalytics?.pages) return [];
    let pages = [...pageAnalytics.pages];

    // Filter by type
    if (pageType === "game") pages = pages.filter((p) => GAME_PATHS.has(p.page));
    else if (pageType === "content") pages = pages.filter((p) => !GAME_PATHS.has(p.page));

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      pages = pages.filter((p) => p.title.toLowerCase().includes(q) || p.page.toLowerCase().includes(q));
    }

    return pages;
  }, [pageAnalytics, pageType, searchQuery]);

  // Selected page detail
  const selectedPageData = useMemo(() => {
    if (!selectedPage || !pageAnalytics?.pages) return null;
    return pageAnalytics.pages.find((p) => p.page === selectedPage) ?? null;
  }, [selectedPage, pageAnalytics]);

  const isGameSelected = selectedPage ? GAME_PATHS.has(selectedPage) : false;

  // Game-specific data for selected page
  const selectedGameData = useMemo(() => {
    if (!selectedPage || !isGameSelected || !gameAnalytics?.games) return null;
    return gameAnalytics.games.find((g) => g.path === selectedPage) ?? null;
  }, [selectedPage, isGameSelected, gameAnalytics]);

  if (!email) return null;

  return (
    <div>
      {/* ═══════ HERO ═══════ */}
      <section className="relative px-4 pt-16 pb-8 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-[150px] opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, oklch(0.72 0.22 200), transparent 70%)" }} />
        <div className="relative z-10 max-w-7xl mx-auto">
          <FadeInView>
            {selectedPage ? (
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setSelectedPage(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all border border-border/30"
                >
                  <ArrowLeft className="size-3.5" />
                  Back to all pages
                </button>
              </div>
            ) : null}
            <div className="flex items-center gap-2 border border-primary/25 bg-primary/8 text-primary px-3 py-1 rounded-full text-[10px] font-medium mb-4 font-mono w-fit">
              <FileText className="size-3" />
              PAGE ANALYTICS
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  📄 Page <span className="text-gradient">Analytics</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedPage ? selectedPageData?.title ?? selectedPage : "Page-by-page performance metrics"}
                </p>
              </div>
              {!selectedPage && (
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
        {selectedPage ? (
          /* ═══════════════════════════════════════════ */
          /* ─── SINGLE PAGE DEEP DIVE ──────────────── */
          /* ═══════════════════════════════════════════ */
          <div className="space-y-6">
            {selectedPageData && (
              <>
                {/* Page Header */}
                <FadeInView direction="up">
                  <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-lg shrink-0">
                        {isGameSelected ? "🎮" : "📄"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold">{selectedPageData.title}</h2>
                        <p className="text-xs font-mono text-muted-foreground">{selectedPageData.page}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-medium">
                            {isGameSelected ? "🎮 Game" : "📄 Content"}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            First visit: {formatDate(selectedPageData.firstVisit)}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            Last visit: {timeAgo(selectedPageData.lastVisit)}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center px-4 py-2 rounded-xl bg-muted/20">
                          <p className="text-lg font-bold font-mono text-cyan-400">{selectedPageData.count}</p>
                          <p className="text-[9px] font-mono text-muted-foreground">Visits</p>
                        </div>
                        <div className="text-center px-4 py-2 rounded-xl bg-muted/20">
                          <p className="text-lg font-bold font-mono text-purple-400">{selectedPageData.uniqueUsers}</p>
                          <p className="text-[9px] font-mono text-muted-foreground">Users</p>
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
                    {selectedPageData.visitsByDay.length > 0 ? (
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={selectedPageData.visitsByDay}>
                            <defs>
                              <linearGradient id="pageTrendGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="oklch(0.72 0.22 200)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="oklch(0.72 0.22 200)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.02 260 / 0.3)" />
                            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(d) => d.slice(5)} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                            <Tooltip
                              contentStyle={{ background: "oklch(0.1 0.025 260)", border: "1px solid oklch(0.22 0.03 260)", borderRadius: "8px", fontSize: "12px" }}
                              labelFormatter={(d) => new Date(d).toLocaleDateString()}
                            />
                            <Area type="monotone" dataKey="count" stroke="oklch(0.72 0.22 200)" fill="url(#pageTrendGrad)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground py-8 text-center">No trend data</p>
                    )}
                  </div>
                </FadeInView>

                {/* Game-specific data */}
                {isGameSelected && selectedGameData && (
                  <FadeInView direction="up">
                    <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
                      <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                        <Activity className="size-4" />
                        Game Engagement Metrics
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="text-center p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                          <Eye className="size-5 mx-auto mb-1 text-cyan-400" />
                          <p className="text-lg font-bold font-mono text-cyan-400">{selectedGameData.visitCount}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">Total Visits</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                          <Users className="size-5 mx-auto mb-1 text-purple-400" />
                          <p className="text-lg font-bold font-mono text-purple-400">{selectedGameData.uniqueUsers}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">Unique Users</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-gradient-to-br from-rose-500/10 to-red-500/10 border border-rose-500/20">
                          <Activity className="size-5 mx-auto mb-1 text-rose-400" />
                          <p className="text-lg font-bold font-mono text-rose-400">{selectedGameData.engagement.toFixed(2)}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">Engagement</p>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                          <Eye className="size-5 mx-auto mb-1 text-amber-400" />
                          <p className="text-lg font-bold font-mono text-amber-400">{selectedGameData.likes}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">Likes</p>
                        </div>
                      </div>
                    </div>
                  </FadeInView>
                )}
              </>
            )}
          </div>
        ) : (
          /* ═══════════════════════════════════════════ */
          /* ─── ALL PAGES OVERVIEW ─────────────────── */
          /* ═══════════════════════════════════════════ */
          <>
            {/* Summary Cards */}
            <FadeInView direction="up">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-border/40 bg-card/50 p-4 text-center">
                  <Globe className="size-4 mx-auto mb-1 text-primary" />
                  <p className="text-xl font-bold font-mono"><AnimatedCounter to={pageAnalytics?.totalPages ?? 0} duration={1} /></p>
                  <p className="text-[10px] font-mono text-muted-foreground">Total Pages</p>
                </div>
                <div className="rounded-xl border border-border/40 bg-card/50 p-4 text-center">
                  <Eye className="size-4 mx-auto mb-1 text-cyan-400" />
                  <p className="text-xl font-bold font-mono text-cyan-400"><AnimatedCounter to={pageAnalytics?.totalVisits ?? 0} duration={1} /></p>
                  <p className="text-[10px] font-mono text-muted-foreground">Total Visits</p>
                </div>
                <div className="rounded-xl border border-border/40 bg-card/50 p-4 text-center">
                  <Users className="size-4 mx-auto mb-1 text-purple-400" />
                  <p className="text-xl font-bold font-mono text-purple-400"><AnimatedCounter to={pageAnalytics?.uniqueUsers ?? 0} duration={1} /></p>
                  <p className="text-[10px] font-mono text-muted-foreground">Unique Users</p>
                </div>
                <div className="rounded-xl border border-border/40 bg-card/50 p-4 text-center">
                  <Activity className="size-4 mx-auto mb-1 text-emerald-400" />
                  <p className="text-xl font-bold font-mono text-emerald-400">
                    {pageAnalytics?.totalPages && pageAnalytics.totalVisits
                      ? (pageAnalytics.totalVisits / pageAnalytics.totalPages).toFixed(1)
                      : "—"}
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground">Avg Visits/Page</p>
                </div>
              </div>
            </FadeInView>

            {/* Trend Chart */}
            <FadeInView direction="up">
              <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
                <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="size-4" />
                  Overall Visit Trend
                </h2>
                {pageAnalytics?.trend && pageAnalytics.trend.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={pageAnalytics.trend}>
                        <defs>
                          <linearGradient id="pageTrendOverall" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(0.72 0.22 200)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="oklch(0.72 0.22 200)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.02 260 / 0.3)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(d) => d.slice(5)} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: "oklch(0.1 0.025 260)", border: "1px solid oklch(0.22 0.03 260)", borderRadius: "8px", fontSize: "12px" }}
                          labelFormatter={(d) => new Date(d).toLocaleDateString()}
                        />
                        <Area type="monotone" dataKey="count" stroke="oklch(0.72 0.22 200)" fill="url(#pageTrendOverall)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">No trend data</p>
                )}
              </div>
            </FadeInView>

            {/* Filters */}
            <FadeInView direction="up">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
                  <input
                    type="text"
                    placeholder="Search pages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-border/40 bg-card/50 text-xs font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors"
                  />
                </div>
                <div className="flex gap-1 rounded-lg border border-border/30 p-0.5">
                  {(["all", "game", "content"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setPageType(t)}
                      className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all ${
                        pageType === t
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t === "all" ? "All Pages" : t === "game" ? "🎮 Games" : "📄 Content"}
                    </button>
                  ))}
                </div>
              </div>
            </FadeInView>

            {/* Pages List */}
            <FadeInView direction="up">
              <div className="rounded-2xl border border-border/40 bg-card/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="text-left px-4 py-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Page</th>
                        <th className="text-center px-3 py-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Visits</th>
                        <th className="text-center px-3 py-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Unique Users</th>
                        <th className="text-center px-3 py-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Visits/User</th>
                        <th className="text-center px-3 py-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Last Visit</th>
                        <th className="text-right px-4 py-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedPages.length > 0 ? (
                        processedPages.map((p) => {
                          const isGame = GAME_PATHS.has(p.page);
                          const visitsPerUser = p.uniqueUsers > 0 ? (p.count / p.uniqueUsers).toFixed(1) : "—";
                          return (
                            <tr
                              key={p.page}
                              className="border-b border-border/20 hover:bg-muted/20 transition-colors cursor-pointer"
                              onClick={() => setSelectedPage(p.page)}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <span className="text-sm">{isGame ? "🎮" : "📄"}</span>
                                  <div className="min-w-0">
                                    <p className="text-xs font-medium truncate max-w-[250px]">{p.title}</p>
                                    <p className="text-[10px] font-mono text-muted-foreground truncate max-w-[250px]">{p.page}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className="text-xs font-mono font-bold text-cyan-400">{p.count}</span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className="text-xs font-mono text-purple-400">{p.uniqueUsers}</span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className="text-xs font-mono text-muted-foreground">{visitsPerUser}</span>
                              </td>
                              <td className="px-3 py-3 text-center">
                                <span className="text-[10px] font-mono text-muted-foreground">{timeAgo(p.lastVisit)}</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedPage(p.page); }}
                                  className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                >
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                            {searchQuery ? "No pages match your search" : "No page data available"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </FadeInView>
          </>
        )}
      </div>
    </div>
  );
}
