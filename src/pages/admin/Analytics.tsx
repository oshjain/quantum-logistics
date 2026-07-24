import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useAuthContext } from "@/lib/auth/index.ts";
import NavBar from "@/components/NavBar.tsx";
import { FadeInView, AnimatedCounter } from "@/components/animations/index.ts";
import { motion } from "motion/react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  CartesianGrid, Legend,
} from "recharts";
import {
  Shield, TrendingUp, Users, Eye, Lightbulb, Star,
  Calendar, Download, Activity, MousePointerClick,
} from "lucide-react";

const COLORS = [
  "oklch(0.72 0.22 200)",
  "oklch(0.6 0.25 280)",
  "oklch(0.8 0.2 150)",
  "oklch(0.7 0.25 30)",
  "oklch(0.55 0.2 330)",
  "oklch(0.65 0.2 180)",
  "oklch(0.75 0.15 250)",
  "oklch(0.6 0.15 50)",
];

export default function MasterAnalytics() {
  const { email } = useAuthContext();
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("30d");
  const [visitTab, setVisitTab] = useState<"overview" | "pages" | "users">("overview");

  const currentUser = useQuery(api.users.getUserByEmail, { email: email ?? "" });
  const overview = useQuery(api.analytics.getPlatformOverview, { adminEmail: email ?? "" });
  const userGrowth = useQuery(api.analytics.getUserGrowthAnalytics, { adminEmail: email ?? "" });
  const ideaAnalytics = useQuery(api.analytics.getIdeaAnalytics, { adminEmail: email ?? "" });
  const ratingAnalytics = useQuery(api.analytics.getRatingAnalytics, { adminEmail: email ?? "" });

  const now = Date.now();
  const startDate = dateRange === "7d" ? now - 7 * 86400000 : dateRange === "30d" ? now - 30 * 86400000 : undefined;
  const visitAnalytics = useQuery(api.analytics.getVisitAnalytics, {
    adminEmail: email ?? "",
    startDate,
    endDate: now,
  });

  const role = currentUser?.role;
  const isAdmin = role === "Admin" || role === "Super Admin";

  if (!email || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Shield className="size-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Access restricted to Admins and Super Admins.</p>
          </div>
        </div>
      </div>
    );
  }

  const overviewCards = [
    { label: "Total Users", value: overview?.totalUsers ?? 0, icon: <Users className="size-4" />, color: "from-blue-400 to-blue-600", sub: `+${overview?.newUsers7d ?? 0} this week` },
    { label: "Page Visits", value: overview?.totalVisits ?? 0, icon: <Eye className="size-4" />, color: "from-cyan-400 to-cyan-600", sub: `${overview?.visits7d ?? 0} in last 7 days` },
    { label: "Ideas Submitted", value: overview?.totalIdeas ?? 0, icon: <Lightbulb className="size-4" />, color: "from-amber-400 to-orange-500", sub: `+${overview?.ideas7d ?? 0} this week` },
    { label: "Avg Rating", value: overview?.avgRating ?? 0, icon: <Star className="size-4" />, color: "from-yellow-400 to-yellow-600", sub: `${overview?.totalRatings ?? 0} ratings` },
    { label: "Total Likes", value: overview?.totalLikes ?? 0, icon: <Activity className="size-4" />, color: "from-rose-400 to-rose-600", sub: "Across all games" },
    { label: "Users Today", value: overview?.newUsers7d ?? 0, icon: <TrendingUp className="size-4" />, color: "from-emerald-400 to-emerald-600", sub: "New users (7d)" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      {/* ═══════ HERO ═══════ */}
      <section className="relative px-4 pt-16 pb-10 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-[150px] opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, oklch(0.72 0.22 200), transparent 70%)" }} />
        <div className="relative z-10 max-w-7xl mx-auto">
          <FadeInView>
            <div className="flex items-center gap-2 border border-primary/25 bg-primary/8 text-primary px-3 py-1 rounded-full text-[10px] font-medium mb-4 font-mono w-fit">
              <Activity className="size-3" />
              MASTER ANALYTICS
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  📊 Platform <span className="text-gradient">Analytics</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Your command center for platform insights
                </p>
              </div>

              {/* Date range selector */}
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
            </div>
          </FadeInView>
        </div>
      </section>

      <div className="max-w-7xl mx-auto w-full px-4 pb-20 space-y-8">
        {/* ═══════ OVERVIEW CARDS ═══════ */}
        <FadeInView direction="up">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {overviewCards.map((card) => (
              <motion.div
                key={card.label}
                whileHover={{ y: -2 }}
                className="rounded-xl border border-border/40 bg-card/50 p-4 text-center hover:border-border/60 transition-all"
              >
                <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${card.color} text-white mb-2`}>
                  {card.icon}
                </div>
                <p className="text-xl font-bold font-mono">
                  {typeof card.value === "number" ? (
                    <AnimatedCounter to={card.value} duration={1.5} />
                  ) : (
                    card.value
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono mt-1">{card.label}</p>
                <p className="text-[8px] text-muted-foreground/50 font-mono mt-0.5">{card.sub}</p>
              </motion.div>
            ))}
          </div>
        </FadeInView>

        {/* ═══════ VISIT ANALYTICS ═══════ */}
        <FadeInView direction="up">
          <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <MousePointerClick className="size-4" />
                Page Visit Analytics
              </h2>
              <div className="flex gap-1 rounded-lg border border-border/30 p-0.5">
                {(["overview", "pages", "users"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setVisitTab(t)}
                    className={`px-3 py-1 rounded-md text-[10px] font-medium transition-all ${
                      visitTab === t
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t === "overview" ? "📈 Overview" : t === "pages" ? "📄 Pages" : "👤 Users"}
                  </button>
                ))}
              </div>
            </div>

            {visitTab === "overview" && (
              <div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 rounded-xl bg-muted/20">
                    <p className="text-lg font-bold font-mono text-primary">{visitAnalytics?.totalVisits ?? 0}</p>
                    <p className="text-[9px] font-mono text-muted-foreground">Total Visits</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/20">
                    <p className="text-lg font-bold font-mono text-cyan-400">{visitAnalytics?.uniquePages ?? 0}</p>
                    <p className="text-[9px] font-mono text-muted-foreground">Unique Pages</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-muted/20">
                    <p className="text-lg font-bold font-mono text-amber-400">{visitAnalytics?.uniqueUsers ?? 0}</p>
                    <p className="text-[9px] font-mono text-muted-foreground">Active Users</p>
                  </div>
                </div>
                {visitAnalytics?.visitsByDay && visitAnalytics.visitsByDay.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={visitAnalytics.visitsByDay}>
                        <defs>
                          <linearGradient id="visitGradient" x1="0" y1="0" x2="0" y2="1">
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
                        <Area type="monotone" dataKey="count" stroke="oklch(0.72 0.22 200)" fill="url(#visitGradient)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">No visit data for this period</p>
                )}
              </div>
            )}

            {visitTab === "pages" && (
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {visitAnalytics?.topPages?.map((p, i) => (
                  <div key={p.page} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/20 transition-colors">
                    <span className="text-[10px] font-mono text-muted-foreground w-5 text-right">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{p.title}</p>
                      <p className="text-[10px] font-mono text-muted-foreground/60">{p.page}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 rounded-full bg-primary/30" style={{ width: `${Math.min(100, (p.count / Math.max(...visitAnalytics.topPages.map(x => x.count))) * 80)}px` }} />
                      <span className="text-xs font-mono text-muted-foreground w-8 text-right">{p.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {visitTab === "users" && (
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {visitAnalytics?.topUsers?.map((u, i) => (
                  <div key={u.email} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/20 transition-colors">
                    <span className="text-[10px] font-mono text-muted-foreground w-5 text-right">{i + 1}.</span>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-[9px] font-bold">
                      {u.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{u.email.split("@")[0]}</p>
                      <p className="text-[10px] font-mono text-muted-foreground/60 truncate">{u.email}</p>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">{u.count} visits</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeInView>

        {/* ═══════ TWO COLUMN: USER GROWTH + RATINGS ═══════ */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* User Growth */}
          <FadeInView direction="up">
            <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="size-4" />
                User Growth
                <span className="text-[10px] font-mono text-muted-foreground ml-auto">{userGrowth?.totalUsers ?? 0} total</span>
              </h2>
              {userGrowth?.usersByDay && userGrowth.usersByDay.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userGrowth.usersByDay}>
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(d) => d.slice(5)} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ background: "oklch(0.1 0.025 260)", border: "1px solid oklch(0.22 0.03 260)", borderRadius: "8px", fontSize: "12px" }}
                        labelFormatter={(d) => new Date(d).toLocaleDateString()}
                      />
                      <Bar dataKey="count" fill="oklch(0.6 0.25 280)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No user growth data yet</p>
              )}

              {/* Role distribution */}
              {userGrowth?.byRole && userGrowth.byRole.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {userGrowth.byRole.map((r) => (
                    <div key={r.role} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/30 border border-border/30">
                      <span className="text-[10px] font-mono text-muted-foreground">{r.role}</span>
                      <span className="text-xs font-bold">{r.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FadeInView>

          {/* Rating Distribution */}
          <FadeInView direction="up">
            <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Star className="size-4" />
                Rating Distribution
                <span className="text-[10px] font-mono text-muted-foreground ml-auto">{ratingAnalytics?.avgRating ?? "—"} avg</span>
              </h2>
              {ratingAnalytics?.distribution && ratingAnalytics.distribution.some((d) => d.count > 0) ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ratingAnalytics.distribution}>
                      <XAxis dataKey="rating" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ background: "oklch(0.1 0.025 260)", border: "1px solid oklch(0.22 0.03 260)", borderRadius: "8px", fontSize: "12px" }}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {ratingAnalytics.distribution.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No ratings yet</p>
              )}
            </div>
          </FadeInView>
        </div>

        {/* ═══════ IDEA ANALYTICS ═══════ */}
        <FadeInView direction="up">
          <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
            <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
              <Lightbulb className="size-4" />
              Idea Analytics
              <span className="text-[10px] font-mono text-muted-foreground ml-auto">{ideaAnalytics?.totalIdeas ?? 0} total ideas</span>
            </h2>
            {ideaAnalytics && ideaAnalytics.totalIdeas > 0 ? (
              <div className="grid sm:grid-cols-2 gap-6">
                {/* By Industry */}
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3">By Industry</p>
                  <div className="space-y-2">
                    {ideaAnalytics.byIndustry.slice(0, 8).map((item) => {
                      const maxCount = ideaAnalytics.byIndustry[0]?.count || 1;
                      return (
                        <div key={item.industry} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-4 text-right font-mono">{item.count}</span>
                          <div className="flex-1 h-5 rounded-md bg-muted/20 overflow-hidden">
                            <motion.div
                              className="h-full rounded-md bg-gradient-to-r from-amber-500/60 to-orange-500/60"
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.count / maxCount) * 100}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-24 text-right truncate">{item.industry}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* By Domain */}
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3">By Domain</p>
                  <div className="space-y-2">
                    {ideaAnalytics.byDomain.slice(0, 8).map((item) => {
                      const maxCount = ideaAnalytics.byDomain[0]?.count || 1;
                      return (
                        <div key={item.domain} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-4 text-right font-mono">{item.count}</span>
                          <div className="flex-1 h-5 rounded-md bg-muted/20 overflow-hidden">
                            <motion.div
                              className="h-full rounded-md bg-gradient-to-r from-purple-500/60 to-blue-500/60"
                              initial={{ width: 0 }}
                              animate={{ width: `${(item.count / maxCount) * 100}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-24 text-right truncate">{item.domain}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Top Contributors */}
                <div className="sm:col-span-2 mt-2">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3">Top Contributors</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
                    {ideaAnalytics.topContributors.map((c, i) => (
                      <div key={c.email} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/20 border border-border/30">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[9px] font-bold">
                          {c.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate font-medium">{c.name}</p>
                          <p className="text-[9px] font-mono text-muted-foreground truncate">{c.count} idea{c.count > 1 ? "s" : ""}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No ideas submitted yet</p>
            )}
          </div>
        </FadeInView>
      </div>

      <footer className="border-t border-border/30 px-4 py-8 mt-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>WNS Quantum Lab</span>
          <span className="font-mono">© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
