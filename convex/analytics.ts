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

/* ─── User Analytics ──────────────────────────────────────────── */

export const getUserAnalytics = query({
  args: {
    adminEmail: v.string(),
    userEmail: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminEmail);

    // Get all users
    let users = await ctx.db.query("users").collect();
    if (args.userEmail) {
      users = users.filter((u) => u.email === args.userEmail);
    }

    // Gather per-user data
    const userData = await Promise.all(
      users.map(async (u) => {
        const [visits, likes, ideas, ratings] = await Promise.all([
          ctx.db
            .query("pageVisits")
            .withIndex("by_email", (q) => q.eq("email", u.email))
            .collect(),
          ctx.db
            .query("likes")
            .withIndex("by_user", (q) => q.eq("email", u.email))
            .collect(),
          ctx.db
            .query("ideas")
            .withIndex("by_email", (q) => q.eq("email", u.email))
            .collect(),
          ctx.db
            .query("ratings")
            .withIndex("by_email", (q) => q.eq("email", u.email))
            .collect(),
        ]);

        // Filter by date range
        let filtVisits = visits;
        let filtLikes = likes;
        let filtIdeas = ideas;
        let filtRatings = ratings;
        if (args.startDate) {
          filtVisits = visits.filter((v) => v.visitedAt >= args.startDate!);
          filtLikes = likes.filter((l) => l.createdAt >= args.startDate!);
          filtIdeas = ideas.filter((i) => i.createdAt >= args.startDate!);
          filtRatings = ratings.filter((r) => r.createdAt >= args.startDate!);
        }
        if (args.endDate) {
          filtVisits = filtVisits.filter((v) => v.visitedAt <= args.endDate!);
          filtLikes = filtLikes.filter((l) => l.createdAt <= args.endDate!);
          filtIdeas = filtIdeas.filter((i) => i.createdAt <= args.endDate!);
          filtRatings = filtRatings.filter((r) => r.createdAt <= args.endDate!);
        }

        // Visits by day
        const visitsByDay: Record<string, number> = {};
        for (const v of filtVisits) {
          const day = new Date(v.visitedAt).toISOString().slice(0, 10);
          visitsByDay[day] = (visitsByDay[day] || 0) + 1;
        }

        // Pages visited
        const pageSet = new Set(filtVisits.map((v) => v.page));
        const pagesWithCount: Record<string, number> = {};
        for (const v of filtVisits) {
          pagesWithCount[v.page] = (pagesWithCount[v.page] || 0) + 1;
        }

        return {
          userId: u._id,
          email: u.email,
          name: u.name ?? u.email,
          role: u.role,
          createdAt: u.createdAt,
          totalVisits: filtVisits.length,
          uniquePages: pageSet.size,
          totalLikes: filtLikes.filter((l) => l.action === "like").length,
          totalDislikes: filtLikes.filter((l) => l.action === "dislike").length,
          totalIdeas: filtIdeas.length,
          rating: filtRatings.length > 0 ? filtRatings[0].rating : null,
          lastActive: filtVisits.length > 0
            ? Math.max(...filtVisits.map((v) => v.visitedAt))
            : u.createdAt,
          visitsByDay: Object.entries(visitsByDay)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date)),
          topPages: Object.entries(pagesWithCount)
            .map(([page, count]) => ({ page, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
          rawVisits: filtVisits.slice(0, 100).map((v) => ({
            page: v.page,
            pageTitle: v.pageTitle ?? v.page,
            visitedAt: v.visitedAt,
          })),
        };
      }),
    );

    // Aggregate trends
    const allVisits = (await ctx.db.query("pageVisits").collect()).filter(
      (v) => !args.startDate || v.visitedAt >= args.startDate!,
    );
    const visitsByDay: Record<string, number> = {};
    for (const v of allVisits) {
      const day = new Date(v.visitedAt).toISOString().slice(0, 10);
      visitsByDay[day] = (visitsByDay[day] || 0) + 1;
    }

    return {
      users: userData.sort((a, b) => b.totalVisits - a.totalVisits),
      totalUsers: users.length,
      activeUsers: userData.filter((u) => u.totalVisits > 0).length,
      totalVisits: userData.reduce((s, u) => s + u.totalVisits, 0),
      totalLikes: userData.reduce((s, u) => s + u.totalLikes, 0),
      totalIdeas: userData.reduce((s, u) => s + u.totalIdeas, 0),
      avgRating: userData.filter((u) => u.rating !== null).reduce((s, u, _, arr) => s + (u.rating ?? 0) / arr.length, 0),
      visitsTrend: Object.entries(visitsByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  },
});

/* ─── Page Analytics ──────────────────────────────────────────── */

export const getPageAnalytics = query({
  args: {
    adminEmail: v.string(),
    pagePath: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminEmail);

    let allVisits = await ctx.db.query("pageVisits").collect();
    if (args.startDate) allVisits = allVisits.filter((v) => v.visitedAt >= args.startDate!);
    if (args.endDate) allVisits = allVisits.filter((v) => v.visitedAt <= args.endDate!);
    if (args.pagePath) allVisits = allVisits.filter((v) => v.page === args.pagePath);

    // Aggregate by page
    const pageMap = new Map<string, {
      count: number;
      title: string;
      uniqueUsers: Set<string>;
      visitsByDay: Record<string, number>;
      lastVisit: number;
      firstVisit: number;
    }>();

    for (const v of allVisits) {
      const existing = pageMap.get(v.page) ?? {
        count: 0,
        title: v.pageTitle ?? v.page,
        uniqueUsers: new Set<string>(),
        visitsByDay: {},
        lastVisit: 0,
        firstVisit: Infinity,
      };
      existing.count++;
      existing.uniqueUsers.add(v.email);
      const day = new Date(v.visitedAt).toISOString().slice(0, 10);
      existing.visitsByDay[day] = (existing.visitsByDay[day] || 0) + 1;
      existing.lastVisit = Math.max(existing.lastVisit, v.visitedAt);
      existing.firstVisit = Math.min(existing.firstVisit, v.visitedAt);
      pageMap.set(v.page, existing);
    }

    const pages = Array.from(pageMap.entries()).map(([page, data]) => ({
      page,
      title: data.title,
      count: data.count,
      uniqueUsers: data.uniqueUsers.size,
      visitsByDay: Object.entries(data.visitsByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      lastVisit: data.lastVisit,
      firstVisit: data.firstVisit === Infinity ? 0 : data.firstVisit,
    })).sort((a, b) => b.count - a.count);

    // Overall trend
    const trendMap: Record<string, number> = {};
    for (const v of allVisits) {
      const day = new Date(v.visitedAt).toISOString().slice(0, 10);
      trendMap[day] = (trendMap[day] || 0) + 1;
    }

    return {
      pages,
      totalPages: pages.length,
      totalVisits: allVisits.length,
      uniqueUsers: new Set(allVisits.map((v) => v.email)).size,
      trend: Object.entries(trendMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  },
});

/* ─── Game Analysis ───────────────────────────────────────────── */

const GAME_PATHS = new Set([
  "/bb84", "/grovers", "/delivery", "/dock",
  "/container-stack", "/vessel-stowage", "/empty-container", "/berth-race",
  "/trip-chain", "/cross-dock", "/intermodal", "/spot-bid",
  "/uld-loading", "/flight-capacity", "/quantum-shipment",
]);

export const getGameAnalytics = query({
  args: {
    adminEmail: v.string(),
    gamePath: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminEmail);

    let allVisits = await ctx.db.query("pageVisits").collect();
    // Filter to only game pages
    allVisits = allVisits.filter((v) => GAME_PATHS.has(v.page));

    if (args.startDate) allVisits = allVisits.filter((v) => v.visitedAt >= args.startDate!);
    if (args.endDate) allVisits = allVisits.filter((v) => v.visitedAt <= args.endDate!);
    if (args.gamePath) allVisits = allVisits.filter((v) => v.page === args.gamePath);

    // Get all likes
    const allLikes = await ctx.db.query("likes").collect();
    const gameLikes = allLikes.filter((l) => l.targetType === "game");

    // Aggregate per game
    const gameMap = new Map<string, {
      path: string;
      title: string;
      visitCount: number;
      uniqueUsers: Set<string>;
      visitsByDay: Record<string, number>;
      likes: number;
      dislikes: number;
      firstVisit: number;
      lastVisit: number;
    }>();

    for (const v of allVisits) {
      const existing = gameMap.get(v.page) ?? {
        path: v.page,
        title: v.pageTitle ?? v.page,
        visitCount: 0,
        uniqueUsers: new Set<string>(),
        visitsByDay: {},
        likes: 0,
        dislikes: 0,
        firstVisit: Infinity,
        lastVisit: 0,
      };
      existing.visitCount++;
      existing.uniqueUsers.add(v.email);
      const day = new Date(v.visitedAt).toISOString().slice(0, 10);
      existing.visitsByDay[day] = (existing.visitsByDay[day] || 0) + 1;
      existing.lastVisit = Math.max(existing.lastVisit, v.visitedAt);
      existing.firstVisit = Math.min(existing.firstVisit, v.visitedAt);
      gameMap.set(v.page, existing);
    }

    // Add like counts
    for (const [path, data] of gameMap) {
      const targetLikes = gameLikes.filter((l) => l.targetId === path);
      data.likes = targetLikes.filter((l) => l.action === "like").length;
      data.dislikes = targetLikes.filter((l) => l.action === "dislike").length;
    }

    const games = Array.from(gameMap.entries()).map(([path, data]) => ({
      path,
      title: data.title,
      visitCount: data.visitCount,
      uniqueUsers: data.uniqueUsers.size,
      likes: data.likes,
      dislikes: data.dislikes,
      engagement: data.uniqueUsers.size > 0
        ? Math.round((data.visitCount / data.uniqueUsers.size) * 100) / 100
        : 0,
      visitsByDay: Object.entries(data.visitsByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      lastVisit: data.lastVisit,
      firstVisit: data.firstVisit === Infinity ? 0 : data.firstVisit,
    })).sort((a, b) => b.visitCount - a.visitCount);

    // Overall trend
    const trendMap: Record<string, number> = {};
    for (const v of allVisits) {
      const day = new Date(v.visitedAt).toISOString().slice(0, 10);
      trendMap[day] = (trendMap[day] || 0) + 1;
    }

    return {
      games,
      totalGames: games.length,
      totalVisits: allVisits.length,
      totalLikes: games.reduce((s, g) => s + g.likes, 0),
      totalDislikes: games.reduce((s, g) => s + g.dislikes, 0),
      uniqueUsers: new Set(allVisits.map((v) => v.email)).size,
      trend: Object.entries(trendMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  },
});
