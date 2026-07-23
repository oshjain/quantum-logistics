import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import NavBar from "@/components/NavBar.tsx";
import { useAuthContext, msalInstance } from "@/lib/auth/index.ts";
import { HeartButton } from "@/components/likes/index.ts";
import { StarRating } from "@/components/ratings/index.ts";
import { RatingModal } from "@/components/ratings/index.ts";
import { FadeInView, AnimatedCounter } from "@/components/animations/index.ts";
import { CATEGORIES } from "@/lib/site-data.ts";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function getGameTitle(path: string): string {
  for (const cat of CATEGORIES) {
    for (const sim of cat.sims) {
      if (sim.path === path) return sim.title;
    }
  }
  return path.replace("/", "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getGameEmoji(path: string): string {
  for (const cat of CATEGORIES) {
    for (const sim of cat.sims) {
      if (sim.path === path) return sim.emoji;
    }
  }
  return "🎮";
}

export default function MyStats() {
  const { email, name, signOut } = useAuthContext();

  const userLikes = useQuery(api.likes.getUserLikes, { email: email ?? "" });
  const userRating = useQuery(api.ratings.getUserRating, { email: email ?? "" });
  const pageStats = useQuery(api.pageVisits.getUserPageStats, { email: email ?? "" });
  const recentVisits = useQuery(api.pageVisits.getRecentVisits, { email: email ?? "", limit: 30 });

  if (!email) {
    return (
      <div className="min-h-screen flex flex-col">
        <NavBar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Sign in to view your stats...</p>
          <button
            onClick={() => msalInstance.loginRedirect({ scopes: ["openid", "profile", "email"] })}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Sign in with Microsoft
          </button>
        </div>
      </div>
    );
  }

  const gameLikes = userLikes?.filter((l) => l.targetType === "game" && l.action === "like") ?? [];
  const gameDislikes = userLikes?.filter((l) => l.targetType === "game" && l.action === "dislike") ?? [];
  const topicLikes = userLikes?.filter((l) => l.targetType === "topic" && l.action === "like") ?? [];
  const removedGameLikes = userLikes?.filter((l) => l.targetType === "game" && l.action === "removed") ?? [];
  const removedTopicLikes = userLikes?.filter((l) => l.targetType === "topic" && l.action === "removed") ?? [];
  const allTimeGameLikes = gameLikes.length + removedGameLikes.length;
  const allTimeTopicLikes = topicLikes.length + removedTopicLikes.length;

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />

      {/* ═══════ HERO ═══════ */}
      <section className="relative px-4 pt-20 pb-10 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[120px] opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, oklch(0.72 0.22 200), transparent 70%)" }} />
        <div className="relative z-10 max-w-6xl mx-auto">
          <FadeInView>
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 border border-primary/25 bg-primary/8 text-primary px-3 py-1 rounded-full text-[10px] font-medium mb-4 font-mono">
                  👤 My Stats
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  Hey, <span className="text-gradient">{name ?? email}</span>
                </h1>
                <p className="text-sm text-muted-foreground mt-1">{email}</p>
              </div>
              <button
                onClick={signOut}
                className="px-3 py-1.5 rounded-lg border border-border/50 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign Out
              </button>
            </div>
          </FadeInView>

          {/* Summary stats */}
          <FadeInView delay={0.2} direction="up">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
              {[
                { label: "Pages Visited", value: pageStats?.uniquePages ?? 0, icon: "👀" },
                { label: "Total Visits", value: pageStats?.totalVisits ?? 0, icon: "🔄" },
                { label: "Games Liked", value: gameLikes.length, icon: "♥️", sub: `${allTimeGameLikes} all-time` },
                { label: "Topics Liked", value: topicLikes.length, icon: "🏷️", sub: `${allTimeTopicLikes} all-time` },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border/40 p-4 text-center bg-card/50">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <p className="text-2xl font-bold font-mono text-gradient">
                    <AnimatedCounter to={stat.value} duration={1.5} />
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-1">{stat.label}</p>
                  {stat.sub && (
                    <p className="text-[9px] text-muted-foreground/60 font-mono -mt-0.5">{stat.sub}</p>
                  )}
                </div>
              ))}
            </div>
          </FadeInView>
        </div>
      </section>

      <div className="max-w-6xl mx-auto w-full px-4 pb-20 space-y-10">
        {/* ═══════ PAGE VISITS CHART ═══════ */}
        <FadeInView direction="up">
          <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
            <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
              <span>📊</span> Page Visit History
            </h2>
            {pageStats && pageStats.visitsByDay.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pageStats.visitsByDay}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      tickFormatter={(d) => d.slice(5)}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.1 0.025 260)",
                        border: "1px solid oklch(0.22 0.03 260)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      labelFormatter={(d) => new Date(d).toLocaleDateString()}
                    />
                    <Bar dataKey="count" fill="oklch(0.72 0.22 200)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No visits recorded yet. Start exploring!</p>
            )}

            {/* Top pages */}
            {pageStats && pageStats.pages.length > 0 && (
              <div className="mt-4 space-y-1.5">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Most Visited Pages</p>
                {pageStats.pages.slice(0, 8).map((p) => (
                  <Link
                    key={p.page}
                    to={p.page}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-muted/30 transition-colors text-sm group"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{getGameEmoji(p.page)}</span>
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors">{p.title}</span>
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {p.count} visit{p.count !== 1 ? "s" : ""}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </FadeInView>

        {/* ═══════ RECENT ACTIVITY ═══════ */}
        <FadeInView direction="up" delay={0.08}>
          <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
            <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
              <span>🕐</span> Recent Activity
            </h2>
            {recentVisits && recentVisits.length > 0 ? (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {recentVisits.slice(0, 20).map((visit) => (
                  <Link
                    key={visit._id}
                    to={visit.page}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg hover:bg-muted/30 transition-colors group text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-sm">{getGameEmoji(visit.page)}</span>
                      <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                        {visit.pageTitle ?? visit.page}
                      </span>
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                      {new Date(visit.visitedAt).toLocaleDateString(undefined, {
                        month: "short", day: "numeric",
                      })}{" "}
                      <span className="text-muted-foreground/50">
                        {new Date(visit.visitedAt).toLocaleTimeString(undefined, {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No activity yet.</p>
            )}
          </div>
        </FadeInView>

        {/* ═══════ LIKED GAMES ═══════ */}
        <FadeInView direction="up" delay={0.1}>
          <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
            <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
              <span>♥️</span> Liked Games
            </h2>
            {gameLikes.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No games liked yet. <Link to="/simulations" className="text-primary underline">Explore simulations</Link>
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {gameLikes.map((like) => (
                  <Link
                    key={like._id}
                    to={like.targetId}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted/30 transition-colors group"
                  >
                    <span className="text-xl">{getGameEmoji(like.targetId)}</span>
                    <span className="flex-1 text-sm font-medium group-hover:text-primary transition-colors">
                      {getGameTitle(like.targetId)}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap" title={new Date(like.createdAt).toLocaleString()}>
                      {new Date(like.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      <span className="text-muted-foreground/50 ml-1">
                        {new Date(like.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </FadeInView>

        {/* ═══════ LIKED TOPICS ═══════ */}
        {topicLikes.length > 0 && (
          <FadeInView direction="up" delay={0.15}>
            <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                <span>🏷️</span> Liked Topics
              </h2>
              <div className="flex flex-wrap gap-2">
                {topicLikes.map((like) => (
                  <span key={like._id} className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
                    {like.targetId}
                  </span>
                ))}
              </div>
            </div>
          </FadeInView>
        )}

        {/* ═══════ DISLIKES WITH FEEDBACK ═══════ */}
        {gameDislikes.length > 0 && (
          <FadeInView direction="up" delay={0.2}>
            <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                <span>👎</span> Disliked Games
              </h2>
              <div className="space-y-2">
                {gameDislikes.map((d) => (
                  <div key={d._id} className="px-3 py-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
                    <Link to={d.targetId} className="text-sm font-medium text-amber-400 hover:underline">
                      {getGameTitle(d.targetId)}
                    </Link>
                    {d.feedback && (
                      <p className="text-xs text-muted-foreground mt-1 italic">"{d.feedback}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </FadeInView>
        )}

        {/* ═══════ PREVIOUSLY LIKED GAMES ═══════ */}
        {removedGameLikes.length > 0 && (
          <FadeInView direction="up" delay={0.22}>
            <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                <span>💔</span> Previously Liked Games
                <span className="text-[10px] font-mono text-muted-foreground ml-auto">{removedGameLikes.length} unliked</span>
              </h2>
              <div className="grid sm:grid-cols-2 gap-2">
                {removedGameLikes.map((like) => (
                  <Link
                    key={like._id}
                    to={like.targetId}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-muted/30 transition-colors group opacity-60 hover:opacity-100"
                  >
                    <span className="text-xl">{getGameEmoji(like.targetId)}</span>
                    <span className="flex-1 text-sm font-medium group-hover:text-primary transition-colors">
                      {getGameTitle(like.targetId)}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap" title={new Date(like.createdAt).toLocaleString()}>
                      {new Date(like.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      <span className="text-muted-foreground/50 ml-1">
                        {new Date(like.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </FadeInView>
        )}

        {/* ═══════ PREVIOUSLY LIKED TOPICS ═══════ */}
        {removedTopicLikes.length > 0 && (
          <FadeInView direction="up" delay={0.24}>
            <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
              <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
                <span>💔</span> Previously Liked Topics
                <span className="text-[10px] font-mono text-muted-foreground ml-auto">{removedTopicLikes.length} unliked</span>
              </h2>
              <div className="flex flex-wrap gap-2">
                {removedTopicLikes.map((like) => (
                  <span key={like._id} className="px-3 py-1.5 rounded-full bg-muted/30 border border-border/20 text-muted-foreground text-xs font-medium line-through decoration-muted-foreground/40">
                    {like.targetId}
                  </span>
                ))}
              </div>
            </div>
          </FadeInView>
        )}

        {/* ═══════ RATING ═══════ */}
        <FadeInView direction="up" delay={0.25}>
          <div className="rounded-2xl border border-border/40 p-6 bg-card/50">
            <h2 className="text-sm font-bold mb-4 flex items-center gap-2">
              <span>⭐</span> Your Platform Rating
            </h2>
            <div className="flex flex-col items-center gap-3 py-4">
              {userRating ? (
                <>
                  <StarRating value={userRating.rating} readonly size={32} />
                  <p className="text-xs text-muted-foreground">
                    You rated <strong className="text-amber-400">{userRating.rating}/5</strong>
                    {userRating.comment && <> — "{userRating.comment}"</>}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {new Date(userRating.createdAt).toLocaleDateString()}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">You haven't rated the platform yet.</p>
              )}
              <RatingModal />
            </div>
          </div>
        </FadeInView>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/30 px-4 py-8 mt-auto">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>WNS Quantum Lab</span>
          <span className="font-mono">© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
