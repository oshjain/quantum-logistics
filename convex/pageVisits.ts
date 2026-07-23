import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ─── Record a page visit ───────────────────────────────────────── */
export const recordVisit = mutation({
  args: {
    email: v.string(),
    page: v.string(),
    pageTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("pageVisits", {
      email: args.email,
      page: args.page,
      pageTitle: args.pageTitle,
      visitedAt: Date.now(),
    });
  },
});

/* ─── Get visits for a user ─────────────────────────────────────── */
export const getUserVisits = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pageVisits")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .order("desc")
      .take(500);
  },
});

/* ─── Get page visit stats for a user ───────────────────────────── */
export const getUserPageStats = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const visits = await ctx.db
      .query("pageVisits")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();

    // Aggregate by page
    const pageMap = new Map<string, { count: number; lastVisit: number; title: string }>();
    for (const v of visits) {
      const existing = pageMap.get(v.page) ?? { count: 0, lastVisit: 0, title: v.pageTitle ?? v.page };
      existing.count++;
      existing.lastVisit = Math.max(existing.lastVisit, v.visitedAt);
      pageMap.set(v.page, existing);
    }

    return {
      totalVisits: visits.length,
      uniquePages: pageMap.size,
      pages: Array.from(pageMap.entries())
        .map(([page, data]) => ({ page, ...data }))
        .sort((a, b) => b.count - a.count),
      visitsByDay: aggregateByDay(visits),
    };
  },
});

function aggregateByDay(visits: { visitedAt: number }[]) {
  const dayMap = new Map<string, number>();
  for (const v of visits) {
    const day = new Date(v.visitedAt).toISOString().slice(0, 10);
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }
  return Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/* ─── Get recent visits with full timestamps ──────────────────── */
export const getRecentVisits = query({
  args: { email: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pageVisits")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

/* ─── Global analytics (admin-ish) ──────────────────────────────── */
export const getGlobalAnalytics = query({
  args: {},
  handler: async (ctx) => {
    const visits = await ctx.db.query("pageVisits").collect();
    const uniqueUsers = new Set(visits.map((v) => v.email));

    const pageMap = new Map<string, number>();
    for (const v of visits) {
      pageMap.set(v.page, (pageMap.get(v.page) ?? 0) + 1);
    }

    return {
      totalVisits: visits.length,
      uniqueUsers: uniqueUsers.size,
      topPages: Array.from(pageMap.entries())
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  },
});
