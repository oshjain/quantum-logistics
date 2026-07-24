import { v } from "convex/values";
import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";

/* ─── Helpers ──────────────────────────────────────────────────── */

async function assertAdmin(ctx: QueryCtx, email: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .unique();
  if (!user || (user.role !== "Admin" && user.role !== "Super Admin")) {
    throw new Error("Not authorized. Admin privileges required.");
  }
}

/* ─── Overview Stats ───────────────────────────────────────────── */

export const getPlatformOverview = query({
  args: {
    adminEmail: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminEmail);

    const [allUsers, allVisits, allIdeas, allRatings, allLikes] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("pageVisits").collect(),
      ctx.db.query("ideas").collect(),
      ctx.db.query("ratings").collect(),
      ctx.db.query("likes").collect(),
    ]);

    // Time-based stats (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newUsers7d = allUsers.filter((u) => u.createdAt > sevenDaysAgo).length;
    const visits7d = allVisits.filter((v) => v.visitedAt > sevenDaysAgo).length;
    const ideas7d = allIdeas.filter((i) => i.createdAt > sevenDaysAgo).length;

    // Avg rating
    const avgRating =
      allRatings.length > 0
        ? allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length
        : 0;

    // Total likes
    const totalLikes = allLikes.filter((l) => l.action === "like").length;

    return {
      totalUsers: allUsers.length,
      newUsers7d,
      totalVisits: allVisits.length,
      visits7d,
      totalIdeas: allIdeas.length,
      ideas7d,
      totalRatings: allRatings.length,
      avgRating: Math.round(avgRating * 10) / 10,
      totalLikes,
    };
  },
});

/* ─── Visit Analytics (by date range) ──────────────────────────── */

export const getVisitAnalytics = query({
  args: {
    adminEmail: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminEmail);

    let visits = await ctx.db.query("pageVisits").collect();

    // Filter by date range
    if (args.startDate) {
      visits = visits.filter((v) => v.visitedAt >= args.startDate!);
    }
    if (args.endDate) {
      visits = visits.filter((v) => v.visitedAt <= args.endDate!);
    }

    // Group by day
    const byDay: Record<string, number> = {};
    const byPage: Record<string, { count: number; title: string }> = {};
    const byUser: Record<string, number> = {};

    for (const v of visits) {
      const day = new Date(v.visitedAt).toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;

      const page = v.page;
      if (!byPage[page]) {
        byPage[page] = { count: 0, title: v.pageTitle || page };
      }
      byPage[page].count++;

      byUser[v.email] = (byUser[v.email] || 0) + 1;
    }

    // Convert to sorted arrays
    const visitsByDay = Object.entries(byDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topPages = Object.entries(byPage)
      .map(([page, data]) => ({ page, title: data.title, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const topUsers = Object.entries(byUser)
      .map(([email, count]) => ({ email, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      totalVisits: visits.length,
      uniquePages: Object.keys(byPage).length,
      uniqueUsers: Object.keys(byUser).length,
      visitsByDay,
      topPages,
      topUsers,
    };
  },
});

/* ─── Idea Analytics ───────────────────────────────────────────── */

export const getIdeaAnalytics = query({
  args: {
    adminEmail: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminEmail);

    const ideas = await ctx.db.query("ideas").collect();

    // By industry
    const byIndustry: Record<string, number> = {};
    // By domain
    const byDomain: Record<string, number> = {};
    // By user
    const byUser: Record<string, { name: string; count: number }> = {};

    for (const idea of ideas) {
      byIndustry[idea.industry] = (byIndustry[idea.industry] || 0) + 1;
      byDomain[idea.domain] = (byDomain[idea.domain] || 0) + 1;

      if (!byUser[idea.email]) {
        byUser[idea.email] = { name: idea.name || idea.email, count: 0 };
      }
      byUser[idea.email].count++;
    }

    return {
      totalIdeas: ideas.length,
      byIndustry: Object.entries(byIndustry)
        .map(([industry, count]) => ({ industry, count }))
        .sort((a, b) => b.count - a.count),
      byDomain: Object.entries(byDomain)
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count),
      topContributors: Object.entries(byUser)
        .map(([email, data]) => ({ email, name: data.name, count: data.count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  },
});

/* ─── User Growth Analytics ────────────────────────────────────── */

export const getUserGrowthAnalytics = query({
  args: {
    adminEmail: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminEmail);

    const users = await ctx.db.query("users").collect();

    const byDay: Record<string, number> = {};
    const byRole: Record<string, number> = {};

    for (const u of users) {
      const day = new Date(u.createdAt).toISOString().slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
      byRole[u.role] = (byRole[u.role] || 0) + 1;
    }

    return {
      totalUsers: users.length,
      usersByDay: Object.entries(byDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      byRole: Object.entries(byRole).map(([role, count]) => ({ role, count })),
    };
  },
});

/* ─── Rating Analytics ─────────────────────────────────────────── */

export const getRatingAnalytics = query({
  args: {
    adminEmail: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminEmail);

    const ratings = await ctx.db.query("ratings").collect();

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of ratings) {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    }

    const avgRating =
      ratings.length > 0
        ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
        : 0;

    return {
      totalRatings: ratings.length,
      avgRating: Math.round(avgRating * 10) / 10,
      distribution: Object.entries(distribution).map(([rating, count]) => ({
        rating: Number(rating),
        count,
      })),
    };
  },
});
