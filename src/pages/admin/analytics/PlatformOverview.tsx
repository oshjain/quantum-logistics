import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useAuthContext } from "@/lib/auth/index.ts";
import { FadeInView, AnimatedCounter } from "@/components/animations/index.ts";
import { motion } from "motion/react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, AreaChart, Area, CartesianGrid, PieChart, Pie,
} from "recharts";
import {
  TrendingUp, Users, Eye, Lightbulb, Star,
  Activity, MousePointerClick, Percent, Heart,
  BarChart3, Award, ThumbsUp,
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

function RatioCard({ label, value, suffix, icon, color, sub }: {
  label: string; value: number; suffix?: string; icon: React.ReactNode; color: string; sub?: string;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} className="rounded-xl border border-border/40 bg-card/50 p-4 text-center hover:border-border/60 transition-all">
      <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${color} text-white mb-2`}>
        {icon}
      </div>
      <p className="text-xl font-bold font-mono">
        <AnimatedCounter to={value} duration={1.2} decimals={value < 10 && suffix === "%" ? 0 : 0} />
        {suffix && <span className="text-sm text-muted-foreground/60 ml-0.5">{suffix}</span>}
      </p>
      <p className="text-[10px] text-muted-foreground font-mono mt-1">{label}</p>
      {sub && <p className="text-[8px] text-muted-foreground/50 font-mono mt-0.5">{sub}</p>}
    </motion.div>
  );
}

export default function PlatformOverview() {
  const { email } = useAuthContext();
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("30d");
  const [visitTab, setVisitTab] = useState<"overview" | "pages" | "users">("overview");

  const overview = useQuery(api.analytics.getPlatformOverview, { adminEmail: email ?? "" });
  const userGrowth = useQuery(api.analytics.getUserGrowthAnalytics, { adminEmail: email ?? "" });
  const ideaAnalytics = useQuery(api.analytics.getIdeaAnalytics, { adminEmail: email ?? "" });
  const ratingAnalytics = useQuery(api.analytics.getRatingAnalytics, { adminEmail: email ?? "" });

  const now = useMemo(() => Date.now(), [dateRange]);
  const startDate = useMemo(() =>
    dateRange === "7d" ? now - 7 * 86400000 : dateRange === "30d" ? now - 30 * 86400000 : undefined,
  [dateRange, now]);
  const visitAnalytics = useQuery(api.analytics.getVisitAnalytics, {
    adminEmail: email ?? "",
    startDate,
    endDate: now,
  });

  // Shorthand for cleaner template access
  const o = overview;
  const v = visitAnalytics;
  const u = userGrowth;
  const r = ratingAnalytics;

  return (
    <div>
      {/* ═══════ HERO ═══════ */}
      <section className="relative px-4 pt-8 pb-6 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-[150px] opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, oklch(0.72 0.22 200), transparent 70%)" }} />
        <div className="relative z-10 max-w-7xl mx-auto">
          <FadeInView>
            <div className="flex items-center gap-2 border border-primary/25 bg-primary/8 text-primary px-3 py-1 rounded-full text-[10px] font-medium mb-4 font-mono w-fit">
              <Activity className="size-3" />
              PLATFORM OVERVIEW
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
        {/* ═══════ ROW 1: COUNT METRICS ═══════ */}
        <FadeInView direction="up">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <RatioCard label="Total Users" value={o?.totalUsers ?? 0} icon={<Users className="size-4" />} color="from-blue-400 to-blue-600" sub={`+${o?.newUsers7d ?? 0} this week`} />
            <RatioCard label="Page Visits" value={o?.totalVisits ?? 0} icon={<Eye className="size-4" />} color="from-cyan-400 to-cyan-600" sub={`${o?.visits7d ?? 0} in 7d`} />
            <RatioCard label="Ideas Submitted" value={o?.totalIdeas ?? 0} icon={<Lightbulb className="size-4" />} color="from-amber-400 to-orange-500" sub={`+${o?.ideas7d ?? 0} this week`} />
            <RatioCard label="Avg Rating" value={o?.avgRating ?? 0} icon={<Star className="size-4" />} color="from-yellow-400 to-yellow-600" sub={`${o?.totalRatings ?? 0} ratings`} />
            <RatioCard label="Total Likes" value={o?.totalLikes ?? 0} icon={<Heart className="size-4" />} color="from-rose-400 to-rose-600" sub="Across all games" />
            <RatioCard label="New Users (7d)" value={o?.newUsers7d ?? 0} icon={<TrendingUp className="size-4" />} color="from-emerald-400 to-emerald-600" sub={`${o?.userGrowthRate ?? 0}% growth rate`} />
          </div>
        </FadeInView>

        {/* ═══════ ROW 2: RATIO INSIGHTS ═══════ */}
        <FadeInView direction="up">
          <div className="rounded-2xl border border-border/40 p-5 bg-card/50">
            <div className="flex items-center gap-2 mb-4">
              <Percent className="size-4 text-primary" />
              <h2 className="text-sm font-bold">Ratio &amp; Efficiency Metrics</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <div className="text-center p-3 rounded-xl bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border border-cyan-500/10">
                <p className="text-[9px] font-mono text-muted-foreground uppercase">Engagement</p>
                <p className="text-lg font-bold font-mono text-cyan-400">{o?.engagementRate ?? 0}<span className="text-sm">%</span></p>
                <p className="text-[8px] text-muted-foreground/50">active / total</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/10">
                <p className="text-[9px] font-mono text-muted-foreground uppercase">Visits/User</p>
                <p className="text-lg font-bold font-mono text-purple-400">{o?.visitsPerUser ?? 0}</p>
                <p className="text-[8px] text-muted-foreground/50">avg visits</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-gradient-to-br from-rose-500/5 to-red-500/5 border border-rose-500/10">
                <p className="text-[9px] font-mono text-muted-foreground uppercase">Like Ratio</p>
                <p className="text-lg font-bold font-mono text-rose-400">{o?.likeRatio ?? 0}<span className="text-sm">%</span></p>
                <p className="text-[8px] text-muted-foreground/50">likes vs dislikes</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/10">
                <p className="text-[9px] font-mono text-muted-foreground uppercase">Ideas/User</p>
                <p className="text-lg font-bold font-mono text-amber-400">{o?.ideasPerUser ?? 0}</p>
                <p className="text-[8px] text-muted-foreground/50">avg per person</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/10">
                <p className="text-[9px] font-mono text-muted-foreground uppercase">Growth Rate</p>
                <p className="text-lg font-bold font-mono text-green-400">{o?.userGrowthRate ?? 0}<span className="text-sm">%</span></p>
                <p className="text-[8px] text-muted-foreground/50">weekly users</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-gradient-to-br from-teal-500/5 to-cyan-500/5 border border-teal-500/10">
                <p className="text-[9px] font-mono text-muted-foreground uppercase">Visit Growth</p>
                <p className="text-lg font-bold font-mono text-teal-400">{o?.visitGrowthRate ?? 0}<span className="text-sm">%</span></p>
                <p className="text-[8px] text-muted-foreground/50">weekly visits</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-gradient-to-br from-yellow-500/5 to-amber-500/5 border border-yellow-500/10">
                <p className="text-[9px] font-mono text-muted-foreground uppercase">Satisfaction</p>
                <p className="text-lg font-bold font-mono text-yellow-400">{r?.satisfactionRate ?? 0}<span className="text-sm">%</span></p>
                <p className="text-[8px] text-muted-foreground/50">rated 4-5</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-gradient-to-br from-sky-500/5 to-blue-500/5 border border-sky-500/10">
                <p className="text-[9px] font-mono text-muted-foreground uppercase">Rating %</p>
                <p className="text-lg font-bold font-mono text-sky-400">{o?.ratingParticipation ?? 0}<span className="text-sm">%</span></p>
                <p className="text-[8px] text-muted-foreground/50">users rated</p>
              </div>
            </div>
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
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                  <div className="text-center p-2.5 rounded-xl bg-muted/20">
                    <p className="text-lg font-bold font-mono text-primary">{v?.totalVisits ?? 0}</p>
                    <p className="text-[9px] font-mono text-muted-foreground">Total Visits</p>
                  </div>
                  <div className="text-center p-2.5 rounded-xl bg-muted/20">
                    <p className="text-lg font-bold font-mono text-cyan-400">{v?.uniquePages ?? 0}</p>
                    <p className="text-[9px] font-mono text-muted-foreground">Unique Pages</p>
                  </div>
                  <div className="text-center p-2.5 rounded-xl bg-muted/20">
                    <p className="text-lg font-bold font-mono text-amber-400">{v?.uniqueUsers ?? 0}</p>
                    <p className="text-[9px] font-mono text-muted-foreground">Active Users</p>
                  </div>
                  <div className="text-center p-2.5 rounded-xl bg-muted/20">
                    <p className="text-lg font-bold font-mono text-purple-400">{v?.visitsPerPage ?? 0}</p>
                    <p className="text-[9px] font-mono text-muted-foreground">Visits/Page</p>
                  </div>
                  <div className="text-center p-2.5 rounded-xl bg-muted/20">
                    <p className="text-lg font-bold font-mono text-emerald-400">{v?.visitsPerUser ?? 0}</p>
                    <p className="text-[9px] font-mono text-muted-foreground">Visits/User</p>
                  </div>
                  <div className="text-center p-2.5 rounded-xl bg-muted/20">
                    <p className="text-lg font-bold font-mono text-rose-400">{v?.avgDailyVisits ?? 0}</p>
                    <p className="text-[9px] font-mono text-muted-foreground">Daily Avg</p>
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
              <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                {v?.topPages && v.topPages.length > 0 ? (
                  v.topPages.map((p, i) => {
                    const maxCount = Math.max(...v.topPages.map(x => x.count));
                    return (
                      <div key={p.page} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/20 transition-colors">
                        <span className="text-[10px] font-mono text-muted-foreground w-5 text-right">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{p.title}</p>
                          <p className="text-[10px] font-mono text-muted-foreground/60 truncate">{p.page}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] font-mono text-cyan-400 font-bold w-8 text-right">{p.share ?? 0}%</span>
                          <div className="h-2 w-12 rounded-full bg-muted/20 overflow-hidden">
                            <div className="h-full rounded-full bg-primary/40" style={{ width: `${(p.count / maxCount) * 100}%` }} />
                          </div>
                          <span className="text-xs font-mono text-muted-foreground w-8 text-right">{p.count}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">No page data for this period</p>
                )}
              </div>
            )}

            {visitTab === "users" && (
              <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                {v?.topUsers && v.topUsers.length > 0 ? (
                  v.topUsers.map((u, i) => (
                  <div key={u.email} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/20 transition-colors">
                    <span className="text-[10px] font-mono text-muted-foreground w-5 text-right">{i + 1}.</span>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                      {u.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{u.email.split("@")[0]}</p>
                      <p className="text-[10px] font-mono text-muted-foreground/60 truncate">{u.email}</p>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground shrink-0">{u.count} visits</span>
                  </div>
                ))) : (
                  <p className="text-sm text-muted-foreground py-4 text-center">No user data for this period</p>
                )}
              </div>
            )}
          </div>
        </FadeInView>

        {/* ═══════ TWO COLUMN: USER GROWTH + RATINGS ═══════ */}
        <div className="grid lg:grid-cols-2 gap-6">
          <FadeInView direction="up">
            <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="size-4" />
                User Growth
                <span className="text-[10px] font-mono text-muted-foreground ml-auto">{u?.totalUsers ?? 0} total</span>
              </h2>
              {/* Growth rate badges */}
              <div className="flex gap-2 mb-4">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <TrendingUp className="size-3 text-emerald-400" />
                  <span className="text-[10px] font-mono font-bold text-emerald-400">Weekly: {u?.weeklyGrowthRate ?? 0}%</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                  <TrendingUp className="size-3 text-blue-400" />
                  <span className="text-[10px] font-mono font-bold text-blue-400">Monthly: {u?.monthlyGrowthRate ?? 0}%</span>
                </div>
              </div>
              {u?.usersByDay && u.usersByDay.length > 0 ? (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={u.usersByDay}>
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
              {/* Role distribution with percentages */}
              {u?.byRole && u.byRole.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Role Distribution</p>
                  {u.byRole.map((r) => (
                    <div key={r.role} className="flex items-center gap-2.5">
                      <span className="text-[10px] font-mono text-muted-foreground w-20 truncate">{r.role}</span>
                      <div className="flex-1 h-2.5 rounded-full bg-muted/20 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500/60 to-blue-500/60"
                          initial={{ width: 0 }}
                          animate={{ width: `${r.pct}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground w-12 text-right">{r.count} ({r.pct}%)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FadeInView>

          <FadeInView direction="up">
            <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Star className="size-4" />
                Rating Distribution
                <span className="text-[10px] font-mono text-muted-foreground ml-auto">{r?.avgRating ?? "—"} avg · {r?.satisfactionRate ?? 0}% satisfied</span>
              </h2>
              {r?.distribution && r.distribution.some((d) => d.count > 0) ? (
                <div>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={r.distribution}>
                        <XAxis dataKey="rating" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{ background: "oklch(0.1 0.025 260)", border: "1px solid oklch(0.22 0.03 260)", borderRadius: "8px", fontSize: "12px" }}
                          formatter={(value, _name, props: any) => [`${value} (${props.payload.pct}%)`, `Rating ${props.payload.rating}`]}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {r.distribution.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Percentage badges */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {r.distribution.map((d) => (
                      <span key={d.rating} className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-muted/20 text-muted-foreground">
                        {d.rating}★: {d.pct}%
                      </span>
                    ))}
                  </div>
                  {/* Satisfaction meter */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mb-1">
                      <span>Satisfaction (rated 4-5)</span>
                      <span className="font-bold text-yellow-400">{r.satisfactionRate}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted/20 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-green-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${r.satisfactionRate}%` }}
                        transition={{ duration: 1 }}
                      />
                    </div>
                  </div>
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
              <span className="text-[10px] font-mono text-muted-foreground ml-auto">{ideaAnalytics?.totalIdeas ?? 0} total ideas · {o?.ideasPerUser ?? 0} avg/user</span>
            </h2>
            {ideaAnalytics && ideaAnalytics.totalIdeas > 0 ? (
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3">By Industry</p>
                  <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
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
                          <span className="text-[10px] text-muted-foreground w-16 text-right truncate">{item.share ?? 0}%</span>
                          <span className="text-[10px] text-muted-foreground w-20 text-right truncate hidden sm:block">{item.industry}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3">By Domain</p>
                  <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
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
                          <span className="text-[10px] text-muted-foreground w-16 text-right truncate">{item.share ?? 0}%</span>
                          <span className="text-[10px] text-muted-foreground w-20 text-right truncate hidden sm:block">{item.domain}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="sm:col-span-2 mt-2">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-3">Top Contributors</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
                    {ideaAnalytics.topContributors.map((c, i) => (
                      <div key={c.email} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/20 border border-border/30">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
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
    </div>
  );
}
