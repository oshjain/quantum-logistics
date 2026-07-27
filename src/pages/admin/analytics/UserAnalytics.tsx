import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useAuthContext } from "@/lib/auth/index.ts";
import { FadeInView, AnimatedCounter } from "@/components/animations/index.ts";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import {
  Users, Search, Filter, ChevronDown, ChevronUp, Eye, Heart,
  Lightbulb, Star, Calendar, Activity, TrendingUp, Clock,
  MapPin, MousePointerClick, Award, Download, UserCircle,
  ArrowLeft, ExternalLink, MessageSquare, ThumbsUp, ThumbsDown,
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

type SortKey = "visits" | "likes" | "ideas" | "name" | "lastActive" | "rating";
type UserFilter = "all" | "active" | "inactive" | "liked" | "ideas" | "rated";

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

export default function UserAnalytics() {
  const { email } = useAuthContext();
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("visits");
  const [filterType, setFilterType] = useState<UserFilter>("all");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const now = useMemo(() => Date.now(), [dateRange]);
  const startDate = useMemo(() =>
    dateRange === "7d" ? now - 7 * 86400000 : dateRange === "30d" ? now - 30 * 86400000 : undefined,
  [dateRange, now]);

  const userAnalytics = useQuery(api.analytics.getUserAnalytics, {
    adminEmail: email ?? "",
    userEmail: selectedUser ?? undefined,
    startDate,
    endDate: now,
  });

  const pageAnalytics = useQuery(api.analytics.getPageAnalytics, {
    adminEmail: email ?? "",
    startDate,
    endDate: now,
  });

  // Filter and sort users
  const processedUsers = useMemo(() => {
    if (!userAnalytics?.users) return [];

    let filtered = [...userAnalytics.users];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) => u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q),
      );
    }

    // Type filter
    switch (filterType) {
      case "active": filtered = filtered.filter((u) => u.totalVisits > 0); break;
      case "inactive": filtered = filtered.filter((u) => u.totalVisits === 0); break;
      case "liked": filtered = filtered.filter((u) => u.totalLikes > 0); break;
      case "ideas": filtered = filtered.filter((u) => u.totalIdeas > 0); break;
      case "rated": filtered = filtered.filter((u) => u.rating !== null); break;
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "visits": return b.totalVisits - a.totalVisits;
        case "likes": return b.totalLikes - a.totalLikes;
        case "ideas": return b.totalIdeas - a.totalIdeas;
        case "rating": return (b.rating ?? 0) - (a.rating ?? 0);
        case "lastActive": return b.lastActive - a.lastActive;
        case "name": return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

    return filtered;
  }, [userAnalytics, searchQuery, sortBy, filterType]);

  // Selected user detail
  const selectedUserData = useMemo(() => {
    if (!selectedUser || !userAnalytics?.users) return null;
    return userAnalytics.users.find((u) => u.email === selectedUser) ?? null;
  }, [selectedUser, userAnalytics]);

  // Aggregate page type stats for selected user
  const selectedUserPageStats = useMemo(() => {
    if (!selectedUserData?.rawVisits) return null;
    const visits = selectedUserData.rawVisits;
    const gameVisits = visits.filter((v) => GAME_PATHS.has(v.page));
    const contentVisits = visits.filter((v) => !GAME_PATHS.has(v.page) && v.page !== "/");
    const homeVisits = visits.filter((v) => v.page === "/");
    return { total: visits.length, gameVisits: gameVisits.length, contentVisits: contentVisits.length, homeVisits: homeVisits.length };
  }, [selectedUserData]);

  if (!email) return null;

  return (
    <div>
      {/* ═══════ HERO ═══════ */}
      <section className="relative px-4 pt-16 pb-8 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-[150px] opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, oklch(0.6 0.25 280), transparent 70%)" }} />
        <div className="relative z-10 max-w-7xl mx-auto">
          <FadeInView>
            {selectedUser ? (
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all border border-border/30"
                >
                  <ArrowLeft className="size-3.5" />
                  Back to all users
                </button>
              </div>
            ) : null}
            <div className="flex items-center gap-2 border border-primary/25 bg-primary/8 text-primary px-3 py-1 rounded-full text-[10px] font-medium mb-4 font-mono w-fit">
              <Users className="size-3" />
              USER ANALYTICS
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  👤 User <span className="text-gradient">Analytics</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedUser ? `Deep dive into ${selectedUserData?.name ?? selectedUser}` : "Comprehensive user behavior, trends & patterns"}
                </p>
              </div>
              {!selectedUser && (
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
        {selectedUser && selectedUserData ? (
          /* ═══════════════════════════════════════════ */
          /* ─── SINGLE USER DEEP DIVE ──────────────── */
          /* ═══════════════════════════════════════════ */
          <div className="space-y-6">
            {/* User Profile Header */}
            <FadeInView direction="up">
              <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
                    {selectedUserData.name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold">{selectedUserData.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedUserData.email}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {selectedUserData.role}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                        <Calendar className="size-3" />
                        Joined {formatDate(selectedUserData.createdAt)}
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" />
                        Last active {timeAgo(selectedUserData.lastActive)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center px-4 py-2 rounded-xl bg-muted/20">
                      <p className="text-lg font-bold font-mono text-cyan-400">{selectedUserData.totalVisits}</p>
                      <p className="text-[9px] font-mono text-muted-foreground">Visits</p>
                    </div>
                    <div className="text-center px-4 py-2 rounded-xl bg-muted/20">
                      <p className="text-lg font-bold font-mono text-rose-400">{selectedUserData.totalLikes}</p>
                      <p className="text-[9px] font-mono text-muted-foreground">Likes</p>
                    </div>
                    <div className="text-center px-4 py-2 rounded-xl bg-muted/20">
                      <p className="text-lg font-bold font-mono text-amber-400">{selectedUserData.totalIdeas}</p>
                      <p className="text-[9px] font-mono text-muted-foreground">Ideas</p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInView>

            {/* Visit Timeline */}
            <FadeInView direction="up">
              <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
                <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Activity className="size-4" />
                  Visit Timeline
                  <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                    {selectedUserData.visitsByDay.length} days of activity
                  </span>
                </h2>
                {selectedUserData.visitsByDay.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedUserData.visitsByDay}>
                        <defs>
                          <linearGradient id="userVisitGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(0.6 0.25 280)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="oklch(0.6 0.25 280)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.02 260 / 0.3)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(d) => d.slice(5)} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: "oklch(0.1 0.025 260)", border: "1px solid oklch(0.22 0.03 260)", borderRadius: "8px", fontSize: "12px" }}
                          labelFormatter={(d) => new Date(d).toLocaleDateString()}
                        />
                        <Area type="monotone" dataKey="count" stroke="oklch(0.6 0.25 280)" fill="url(#userVisitGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">No visit data for this period</p>
                )}
              </div>
            </FadeInView>

            {/* Page Breakdown + Touchpoints */}
            <div className="grid lg:grid-cols-2 gap-6">
              <FadeInView direction="up">
                <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
                  <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <MapPin className="size-4" />
                    Top Pages Visited
                  </h2>
                  {selectedUserData.topPages.length > 0 ? (
                    <div className="space-y-2">
                      {selectedUserData.topPages.map((p, i) => {
                        const maxCount = selectedUserData.topPages[0]?.count || 1;
                        const isGame = GAME_PATHS.has(p.page);
                        return (
                          <div key={p.page} className="flex items-center gap-2.5">
                            <span className="text-[10px] font-mono text-muted-foreground w-4 text-right">{i + 1}.</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-xs truncate">{isGame ? "🎮 " : "📄 "}{p.page || "/"}</span>
                                <span className="text-[10px] font-mono text-muted-foreground">{p.count}x</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted/20 overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full bg-gradient-to-r from-purple-500/60 to-blue-500/60"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(p.count / maxCount) * 100}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">No pages visited</p>
                  )}
                  {selectedUserPageStats && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="text-center p-2 rounded-lg bg-muted/15">
                        <p className="text-sm font-bold font-mono text-cyan-400">{selectedUserPageStats.gameVisits}</p>
                        <p className="text-[9px] font-mono text-muted-foreground">🎮 Games</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/15">
                        <p className="text-sm font-bold font-mono text-amber-400">{selectedUserPageStats.contentVisits}</p>
                        <p className="text-[9px] font-mono text-muted-foreground">📄 Content</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-muted/15">
                        <p className="text-sm font-bold font-mono text-emerald-400">{selectedUserPageStats.homeVisits}</p>
                        <p className="text-[9px] font-mono text-muted-foreground">🏠 Home</p>
                      </div>
                    </div>
                  )}
                </div>
              </FadeInView>

              <FadeInView direction="up">
                <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
                  <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <MousePointerClick className="size-4" />
                    Touchpoint History
                  </h2>
                  {selectedUserData.rawVisits.length > 0 ? (
                    <div className="space-y-1 max-h-[300px] overflow-y-auto">
                      {selectedUserData.rawVisits.map((v, i) => {
                        const isGame = GAME_PATHS.has(v.page);
                        return (
                          <div key={i} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/20 transition-colors">
                            <span className="text-[10px] font-mono text-muted-foreground/50 shrink-0">
                              {new Date(v.visitedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                            <span className="text-[10px]">{isGame ? "🎮" : "📄"}</span>
                            <span className="text-xs truncate">{v.pageTitle}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">No touchpoints recorded</p>
                  )}
                </div>
              </FadeInView>
            </div>

            {/* Activity Summary */}
            <FadeInView direction="up">
              <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
                <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Award className="size-4" />
                  Activity Summary
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                    <Eye className="size-5 mx-auto mb-1 text-cyan-400" />
                    <p className="text-xl font-bold font-mono text-cyan-400">{selectedUserData.totalVisits}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">Total Visits</p>
                    <p className="text-[9px] font-mono text-muted-foreground/50">{selectedUserData.uniquePages} unique pages</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-rose-500/10 to-pink-500/10 border border-rose-500/20">
                    <Heart className="size-5 mx-auto mb-1 text-rose-400" />
                    <p className="text-xl font-bold font-mono text-rose-400">{selectedUserData.totalLikes}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">Likes Given</p>
                    <p className="text-[9px] font-mono text-muted-foreground/50">{selectedUserData.totalDislikes} dislikes</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                    <Lightbulb className="size-5 mx-auto mb-1 text-amber-400" />
                    <p className="text-xl font-bold font-mono text-amber-400">{selectedUserData.totalIdeas}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">Ideas Submitted</p>
                    <p className="text-[9px] font-mono text-muted-foreground/50">contributions</p>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/20">
                    <Star className="size-5 mx-auto mb-1 text-yellow-400" />
                    <p className="text-xl font-bold font-mono text-yellow-400">{selectedUserData.rating ?? "—"}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">Rating</p>
                    <p className="text-[9px] font-mono text-muted-foreground/50">platform rating</p>
                  </div>
                </div>
              </div>
            </FadeInView>
          </div>
        ) : (
          /* ═══════════════════════════════════════════ */
          /* ─── ALL USERS OVERVIEW ─────────────────── */
          /* ═══════════════════════════════════════════ */
          <>
            {/* Summary Cards */}
            <FadeInView direction="up">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <div className="rounded-xl border border-border/40 bg-card/50 p-4 text-center">
                  <Users className="size-4 mx-auto mb-1 text-primary" />
                  <p className="text-xl font-bold font-mono"><AnimatedCounter to={userAnalytics?.totalUsers ?? 0} duration={1} /></p>
                  <p className="text-[10px] font-mono text-muted-foreground">Total Users</p>
                </div>
                <div className="rounded-xl border border-border/40 bg-card/50 p-4 text-center">
                  <Activity className="size-4 mx-auto mb-1 text-cyan-400" />
                  <p className="text-xl font-bold font-mono text-cyan-400"><AnimatedCounter to={userAnalytics?.activeUsers ?? 0} duration={1} /></p>
                  <p className="text-[10px] font-mono text-muted-foreground">Active Users</p>
                </div>
                <div className="rounded-xl border border-border/40 bg-card/50 p-4 text-center">
                  <Eye className="size-4 mx-auto mb-1 text-emerald-400" />
                  <p className="text-xl font-bold font-mono text-emerald-400"><AnimatedCounter to={userAnalytics?.totalVisits ?? 0} duration={1} /></p>
                  <p className="text-[10px] font-mono text-muted-foreground">Total Visits</p>
                </div>
                <div className="rounded-xl border border-border/40 bg-card/50 p-4 text-center">
                  <Heart className="size-4 mx-auto mb-1 text-rose-400" />
                  <p className="text-xl font-bold font-mono text-rose-400"><AnimatedCounter to={userAnalytics?.totalLikes ?? 0} duration={1} /></p>
                  <p className="text-[10px] font-mono text-muted-foreground">Total Likes</p>
                </div>
                <div className="rounded-xl border border-border/40 bg-card/50 p-4 text-center">
                  <Lightbulb className="size-4 mx-auto mb-1 text-amber-400" />
                  <p className="text-xl font-bold font-mono text-amber-400"><AnimatedCounter to={userAnalytics?.totalIdeas ?? 0} duration={1} /></p>
                  <p className="text-[10px] font-mono text-muted-foreground">Total Ideas</p>
                </div>
                <div className="rounded-xl border border-border/40 bg-card/50 p-4 text-center">
                  <Star className="size-4 mx-auto mb-1 text-yellow-400" />
                  <p className="text-xl font-bold font-mono text-yellow-400">{userAnalytics?.avgRating ? userAnalytics.avgRating.toFixed(1) : "—"}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">Avg Rating</p>
                </div>
              </div>
            </FadeInView>

            {/* Trend Chart */}
            <FadeInView direction="up">
              <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
                <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="size-4" />
                  Visit Trend
                </h2>
                {userAnalytics?.visitsTrend && userAnalytics.visitsTrend.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={userAnalytics.visitsTrend}>
                        <defs>
                          <linearGradient id="userTrendGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(0.6 0.25 280)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="oklch(0.6 0.25 280)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.02 260 / 0.3)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(d) => d.slice(5)} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: "oklch(0.1 0.025 260)", border: "1px solid oklch(0.22 0.03 260)", borderRadius: "8px", fontSize: "12px" }}
                          labelFormatter={(d) => new Date(d).toLocaleDateString()}
                        />
                        <Area type="monotone" dataKey="count" stroke="oklch(0.6 0.25 280)" fill="url(#userTrendGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">No trend data</p>
                )}
              </div>
            </FadeInView>

            {/* Filters & Search */}
            <FadeInView direction="up">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground/60" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-border/40 bg-card/50 text-xs font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/40 transition-colors"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Filter pills */}
                  <div className="flex gap-1 rounded-lg border border-border/30 p-0.5">
                    {(["all", "active", "inactive", "liked", "ideas", "rated"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilterType(f)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap ${
                          filterType === f
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {f === "all" ? "All" : f === "active" ? "Active" : f === "inactive" ? "Inactive" : f === "liked" ? "Liked" : f === "ideas" ? "Ideas" : "Rated"}
                      </button>
                    ))}
                  </div>

                  {/* Sort */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortKey)}
                    className="px-2.5 py-1 rounded-lg border border-border/40 bg-card/50 text-[10px] font-mono focus:outline-none focus:border-primary/40"
                  >
                    <option value="visits">Sort: Visits</option>
                    <option value="likes">Sort: Likes</option>
                    <option value="ideas">Sort: Ideas</option>
                    <option value="rating">Sort: Rating</option>
                    <option value="lastActive">Sort: Last Active</option>
                    <option value="name">Sort: Name</option>
                  </select>

                  <span className="text-[10px] font-mono text-muted-foreground">
                    {processedUsers.length} users
                  </span>
                </div>
              </div>
            </FadeInView>

            {/* Users List */}
            <FadeInView direction="up">
              <div className="rounded-2xl border border-border/40 bg-card/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="text-left px-4 py-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">User</th>
                        <th className="text-center px-3 py-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Visits</th>
                        <th className="text-center px-3 py-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Pages</th>
                        <th className="text-center px-3 py-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Likes</th>
                        <th className="text-center px-3 py-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Ideas</th>
                        <th className="text-center px-3 py-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Rating</th>
                        <th className="text-center px-3 py-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Last Active</th>
                        <th className="text-right px-4 py-3 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedUsers.length > 0 ? (
                        processedUsers.map((u) => (
                          <tr
                            key={u.email}
                            className="border-b border-border/20 hover:bg-muted/20 transition-colors cursor-pointer"
                            onClick={() => setExpandedUser(expandedUser === u.email ? null : u.email)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                  {u.name[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium truncate max-w-[180px]">{u.name}</p>
                                  <p className="text-[10px] font-mono text-muted-foreground truncate max-w-[180px]">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="text-xs font-mono font-bold text-cyan-400">{u.totalVisits}</span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="text-xs font-mono text-muted-foreground">{u.uniquePages}</span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="text-xs font-mono font-bold text-rose-400">{u.totalLikes}</span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="text-xs font-mono font-bold text-amber-400">{u.totalIdeas}</span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`text-xs font-mono font-bold ${u.rating ? "text-yellow-400" : "text-muted-foreground/50"}`}>
                                {u.rating ?? "—"}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="text-[10px] font-mono text-muted-foreground" title={formatDate(u.lastActive)}>
                                {timeAgo(u.lastActive)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedUser(u.email); }}
                                className="px-2.5 py-1 rounded-md text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground">
                            {searchQuery ? "No users match your search" : "No user data available"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </FadeInView>

            {/* Expanded User Cards (inline detail) */}
            <AnimatePresence>
              {expandedUser && (() => {
                const u = processedUsers.find((x) => x.email === expandedUser);
                if (!u) return null;
                return (
                  <motion.div
                    key={expandedUser}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="rounded-2xl border border-border/40 p-6 bg-card/50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <UserCircle className="size-4" />
                        {u.name}
                        <span className="text-[10px] font-mono text-muted-foreground font-normal">({u.email})</span>
                      </h3>
                      <button
                        onClick={() => setSelectedUser(u.email)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
                      >
                        <ExternalLink className="size-3" />
                        Full Profile
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-3 rounded-xl bg-muted/20">
                        <p className="text-[9px] font-mono text-muted-foreground uppercase flex items-center gap-1 mb-1">
                          <Eye className="size-3" /> Top Pages
                        </p>
                        {u.topPages.slice(0, 4).map((p) => (
                          <div key={p.page} className="flex items-center justify-between py-0.5">
                            <span className="text-[10px] truncate">{p.page || "/"}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{p.count}</span>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 rounded-xl bg-muted/20">
                        <p className="text-[9px] font-mono text-muted-foreground uppercase flex items-center gap-1 mb-1">
                          <Calendar className="size-3" /> Activity
                        </p>
                        <p className="text-xs font-mono mt-2">Total Visits: <span className="text-cyan-400 font-bold">{u.totalVisits}</span></p>
                        <p className="text-xs font-mono">Unique Pages: <span className="text-muted-foreground">{u.uniquePages}</span></p>
                        <p className="text-xs font-mono">Last Active: <span className="text-muted-foreground">{timeAgo(u.lastActive)}</span></p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/20">
                        <p className="text-[9px] font-mono text-muted-foreground uppercase flex items-center gap-1 mb-1">
                          <ThumbsUp className="size-3" /> Engagement
                        </p>
                        <p className="text-xs font-mono mt-2">Likes: <span className="text-rose-400 font-bold">{u.totalLikes}</span></p>
                        <p className="text-xs font-mono">Dislikes: <span className="text-muted-foreground">{u.totalDislikes}</span></p>
                        <p className="text-xs font-mono">Ideas: <span className="text-amber-400 font-bold">{u.totalIdeas}</span></p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/20">
                        <p className="text-[9px] font-mono text-muted-foreground uppercase flex items-center gap-1 mb-1">
                          <MessageSquare className="size-3" /> Feedback
                        </p>
                        <p className="text-xs font-mono mt-2">Rating: <span className="text-yellow-400 font-bold">{u.rating ?? "N/A"}</span></p>
                        <p className="text-xs font-mono">Role: <span className="text-primary">{u.role}</span></p>
                        <p className="text-xs font-mono">Joined: <span className="text-muted-foreground">{formatDate(u.createdAt)}</span></p>
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
