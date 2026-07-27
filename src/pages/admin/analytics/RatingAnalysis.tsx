import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useAuthContext } from "@/lib/auth/index.ts";
import { FadeInView, AnimatedCounter } from "@/components/animations/index.ts";
import { motion } from "motion/react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, PieChart, Pie, Cell,
  LineChart, Line,
} from "recharts";
import {
  Star, ThumbsUp, ThumbsDown, TrendingUp, Users, MessageSquare,
  Percent, Activity, Award, Smile, Frown, Meh,
  Search, Calendar, ArrowUp, ArrowDown,
} from "lucide-react";

const COLORS = [
  "oklch(0.3 0.15 10)", "oklch(0.5 0.2 20)", "oklch(0.6 0.15 50)",
  "oklch(0.65 0.18 150)", "oklch(0.6 0.2 200)",
];
const STAR_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#22d3ee"];

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="text-xs">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? "text-yellow-400" : "text-muted-foreground/20"}>★</span>
      ))}
    </span>
  );
}

export default function RatingAnalysis() {
  const { email } = useAuthContext();
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("all");
  const [tab, setTab] = useState<"overview" | "trends" | "roles" | "comments">("overview");

  const now = useMemo(() => Date.now(), [dateRange]);
  const startDate = useMemo(() =>
    dateRange === "7d" ? now - 7 * 86400000 : dateRange === "30d" ? now - 30 * 86400000 : undefined,
  [dateRange, now]);

  const r = useQuery(api.analytics.getRatingAnalyticsDetailed, {
    adminEmail: email ?? "",
    startDate,
    endDate: now,
  });

  if (!email) return null;

  return (
    <div>
      {/* ═══════ HERO ═══════ */}
      <section className="relative px-4 pt-8 pb-6 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-[150px] opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, oklch(0.7 0.25 30), transparent 70%)" }} />
        <div className="relative z-10 max-w-7xl mx-auto">
          <FadeInView>
            <div className="flex items-center gap-2 border border-primary/25 bg-primary/8 text-primary px-3 py-1 rounded-full text-[10px] font-medium mb-4 font-mono w-fit">
              <Star className="size-3" />
              RATING ANALYTICS
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  ⭐ Rating <span className="text-gradient">Analytics</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Deep dive into user ratings, satisfaction trends & feedback
                </p>
              </div>
              <div className="flex gap-1 rounded-xl border border-border/40 bg-card/50 p-1">
                {(["7d", "30d", "all"] as const).map((d) => (
                  <button key={d} onClick={() => setDateRange(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      dateRange === d ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}>
                    {d === "7d" ? "7 Days" : d === "30d" ? "30 Days" : "All Time"}
                  </button>
                ))}
              </div>
            </div>
          </FadeInView>
        </div>
      </section>

      <div className="max-w-7xl mx-auto w-full px-4 pb-20 space-y-6">
        {/* ═══════ SUMMARY CARDS ═══════ */}
        <FadeInView direction="up">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            <div className="rounded-xl border border-border/40 bg-card/50 p-3 text-center">
              <Star className="size-3.5 mx-auto mb-1 text-yellow-400" />
              <p className="text-base font-bold font-mono text-yellow-400">{r?.avgRating ?? "—"}</p>
              <p className="text-[9px] font-mono text-muted-foreground">Avg Rating</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/50 p-3 text-center">
              <Users className="size-3.5 mx-auto mb-1 text-primary" />
              <p className="text-base font-bold font-mono"><AnimatedCounter to={r?.totalRatings ?? 0} duration={1} /></p>
              <p className="text-[9px] font-mono text-muted-foreground">Ratings</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/50 p-3 text-center">
              <Users className="size-3.5 mx-auto mb-1 text-purple-400" />
              <p className="text-base font-bold font-mono text-purple-400"><AnimatedCounter to={r?.uniqueRaters ?? 0} duration={1} /></p>
              <p className="text-[9px] font-mono text-muted-foreground">Unique Raters</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/50 p-3 text-center">
              <Percent className="size-3.5 mx-auto mb-1 text-cyan-400" />
              <p className="text-base font-bold font-mono text-cyan-400">{r?.participationRate ?? 0}%</p>
              <p className="text-[9px] font-mono text-muted-foreground">Participation</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/50 p-3 text-center">
              <Smile className="size-3.5 mx-auto mb-1 text-green-400" />
              <p className="text-base font-bold font-mono text-green-400">{r?.satisfactionRate ?? 0}%</p>
              <p className="text-[9px] font-mono text-muted-foreground">Satisfied (4-5)</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/50 p-3 text-center">
              <Frown className="size-3.5 mx-auto mb-1 text-red-400" />
              <p className="text-base font-bold font-mono text-red-400">{r?.dissatisfactionRate ?? 0}%</p>
              <p className="text-[9px] font-mono text-muted-foreground">Dissatisfied (1-2)</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/50 p-3 text-center">
              <Activity className="size-3.5 mx-auto mb-1 text-amber-400" />
              <p className="text-base font-bold font-mono text-amber-400">{r?.repeatRate ?? 0}%</p>
              <p className="text-[9px] font-mono text-muted-foreground">Repeat Raters</p>
            </div>
            <div className="rounded-xl border border-border/40 bg-card/50 p-3 text-center">
              <MessageSquare className="size-3.5 mx-auto mb-1 text-sky-400" />
              <p className="text-base font-bold font-mono text-sky-400">{r?.commentRate ?? 0}%</p>
              <p className="text-[9px] font-mono text-muted-foreground">With Comments</p>
            </div>
          </div>
        </FadeInView>

        {/* ═══════ TABS ═══════ */}
        <FadeInView direction="up">
          <div className="flex gap-1 rounded-lg border border-border/30 p-0.5 w-fit">
            {(["overview", "trends", "roles", "comments"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                  tab === t ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}>
                {t === "overview" ? "📊 Distribution" : t === "trends" ? "📈 Trends" : t === "roles" ? "👥 By Role" : "💬 Comments"}
              </button>
            ))}
          </div>
        </FadeInView>

        {tab === "overview" && (
          <>
            {/* Distribution */}
            <FadeInView direction="up">
              <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
                <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Star className="size-4" />
                  Rating Distribution
                  <span className="text-[10px] font-mono text-muted-foreground ml-auto">{r?.totalRatings ?? 0} ratings · {r?.avgRating ?? "—"} avg</span>
                </h2>
                {r?.distribution && r.distribution.some((d) => d.count > 0) ? (
                  <div>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={r.distribution} barCategoryGap="20%">
                          <XAxis dataKey="rating" tick={{ fontSize: 14, fill: "#64748b" }} axisLine={false} tickLine={false}
                            tickFormatter={(v) => `${v}★`} />
                          <YAxis hide />
                          <Tooltip
                            contentStyle={{ background: "oklch(0.1 0.025 260)", border: "1px solid oklch(0.22 0.03 260)", borderRadius: "8px", fontSize: "12px" }}
                            formatter={(value, _name, props: any) => [`${value} ratings (${props.payload.pct}%)`]}
                          />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                            {r.distribution.map((entry, i) => (
                              <Cell key={i} fill={STAR_COLORS[entry.rating - 1] ?? COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Percentage badges */}
                    <div className="mt-4 flex flex-wrap gap-2 justify-center">
                      {r.distribution.map((d) => (
                        <div key={d.rating} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/20 border border-border/30">
                          <RatingStars rating={d.rating} />
                          <span className="text-[10px] font-mono font-bold">{d.pct}%</span>
                          <span className="text-[10px] font-mono text-muted-foreground">({d.count})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-8 text-center">No ratings yet</p>
                )}
              </div>
            </FadeInView>

            {/* Satisfaction Meter + Correlation */}
            <div className="grid lg:grid-cols-2 gap-6">
              <FadeInView direction="up">
                <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
                  <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <Smile className="size-4 text-green-400" />
                    Satisfaction Breakdown
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
                        <span className="flex items-center gap-1"><Smile className="size-3 text-green-400" /> Satisfied (4-5)</span>
                        <span className="font-bold text-green-400">{r?.satisfactionRate ?? 0}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-muted/20 overflow-hidden">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-400"
                          initial={{ width: 0 }} animate={{ width: `${r?.satisfactionRate ?? 0}%` }} transition={{ duration: 1 }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
                        <span className="flex items-center gap-1"><Meh className="size-3 text-amber-400" /> Neutral (3)</span>
                        <span className="font-bold text-amber-400">{r?.neutralRate ?? 0}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-muted/20 overflow-hidden">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-yellow-400"
                          initial={{ width: 0 }} animate={{ width: `${r?.neutralRate ?? 0}%` }} transition={{ duration: 1 }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-mono text-muted-foreground mb-1">
                        <span className="flex items-center gap-1"><Frown className="size-3 text-red-400" /> Dissatisfied (1-2)</span>
                        <span className="font-bold text-red-400">{r?.dissatisfactionRate ?? 0}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-muted/20 overflow-hidden">
                        <motion.div className="h-full rounded-full bg-gradient-to-r from-red-400 to-orange-400"
                          initial={{ width: 0 }} animate={{ width: `${r?.dissatisfactionRate ?? 0}%` }} transition={{ duration: 1 }} />
                      </div>
                    </div>
                  </div>
                </div>
              </FadeInView>

              <FadeInView direction="up">
                <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
                  <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                    <Activity className="size-4" />
                    Rating vs Engagement Correlation
                  </h2>
                  {r && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                        <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">Raters</p>
                        <p className="text-xl font-bold font-mono text-green-400">{r.engagementOfRaters}</p>
                        <p className="text-[9px] font-mono text-muted-foreground">avg visits/user</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20">
                        <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">Non-Raters</p>
                        <p className="text-xl font-bold font-mono text-red-400">{r.engagementOfNonRaters}</p>
                        <p className="text-[9px] font-mono text-muted-foreground">avg visits/user</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 col-span-2">
                        <p className="text-[9px] font-mono text-muted-foreground uppercase mb-1">Like Rate of Raters</p>
                        <p className="text-xl font-bold font-mono text-cyan-400">{r.likeRateOfRaters}%</p>
                        <p className="text-[9px] font-mono text-muted-foreground">users who rate also like more</p>
                      </div>
                    </div>
                  )}
                </div>
              </FadeInView>
            </div>
          </>
        )}

        {tab === "trends" && (
          <FadeInView direction="up">
            <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="size-4" />
                Rating Trend Over Time
              </h2>
              {r?.ratingTrend && r.ratingTrend.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={r.ratingTrend}>
                      <defs>
                        <linearGradient id="ratingCountGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.7 0.25 30)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="oklch(0.7 0.25 30)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.2 0.02 260 / 0.3)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(d) => d.slice(5)} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} domain={[0, 5]} />
                      <Tooltip
                        contentStyle={{ background: "oklch(0.1 0.025 260)", border: "1px solid oklch(0.22 0.03 260)", borderRadius: "8px", fontSize: "12px" }}
                        labelFormatter={(d) => new Date(d).toLocaleDateString()}
                      />
                      <Area yAxisId="left" type="monotone" dataKey="count" stroke="oklch(0.7 0.25 30)" fill="url(#ratingCountGrad)" strokeWidth={2} name="Ratings" />
                      <Line yAxisId="right" type="monotone" dataKey="avg" stroke="oklch(0.6 0.2 200)" strokeWidth={2} dot={false} name="Avg Rating" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No rating trend data</p>
              )}
              {/* Date range info */}
              {r && r.oldestRating > 0 && (
                <div className="mt-4 flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                  <Calendar className="size-3" />
                  <span>First rating: {formatDate(r.oldestRating)}</span>
                  <span>·</span>
                  <span>Latest: {timeAgo(r.newestRating)}</span>
                  <span>·</span>
                  <span>{r.totalRatings} total ratings</span>
                </div>
              )}
            </div>
          </FadeInView>
        )}

        {tab === "roles" && (
          <FadeInView direction="up">
            <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                <Users className="size-4" />
                Rating by User Role
              </h2>
              {r?.byRole && r.byRole.length > 0 ? (
                <div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={r.byRole} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="role" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={100} />
                        <Tooltip
                          contentStyle={{ background: "oklch(0.1 0.025 260)", border: "1px solid oklch(0.22 0.03 260)", borderRadius: "8px", fontSize: "12px" }}
                          formatter={(value, _name, props: any) => [`${value} (${props.payload.pct}%)`]}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {r.byRole.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 grid sm:grid-cols-3 gap-3">
                    {r.byRole.map((role) => (
                      <div key={role.role} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/20 border border-border/30">
                        <div className="text-center">
                          <p className="text-xl font-bold font-mono text-yellow-400">{role.avg}</p>
                          <p className="text-[9px] font-mono text-muted-foreground">avg</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium">{role.role}</p>
                          <p className="text-[10px] font-mono text-muted-foreground">{role.count} ratings ({role.pct}%)</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No role data</p>
              )}
            </div>
          </FadeInView>
        )}

        {tab === "comments" && (
          <FadeInView direction="up">
            <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                <MessageSquare className="size-4" />
                Recent Comments
                <span className="text-[10px] font-mono text-muted-foreground ml-auto">{r?.totalComments ?? 0} total · {r?.commentRate ?? 0}% of ratings</span>
              </h2>
              {r?.recentComments && r.recentComments.length > 0 ? (
                <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                  {r.recentComments.map((c, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-xl bg-muted/15 border border-border/30">
                      <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white text-[10px] font-bold">
                        {(c.user?.name?.[0] ?? c.email[0]).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <RatingStars rating={c.rating} />
                          <span className="text-[10px] font-mono text-muted-foreground">{c.user?.name ?? c.email}</span>
                          <span className="text-[9px] font-mono text-muted-foreground/50 ml-auto">{timeAgo(c.createdAt)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{c.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No comments yet</p>
              )}
            </div>
          </FadeInView>
        )}
      </div>
    </div>
  );
}
