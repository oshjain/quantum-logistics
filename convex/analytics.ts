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
    const totalDislikes = allLikes.filter((l) => l.action === "dislike").length;
    const activeUsers = allUsers.filter((u) =>
      allVisits.some((v) => v.email === u.email),
    ).length;

    // ─── Ratios & Averages ───
    const engagementRate = allUsers.length > 0
      ? Math.round((activeUsers / allUsers.length) * 100) : 0;
    const visitsPerUser = allUsers.length > 0
      ? Math.round((allVisits.length / allUsers.length) * 10) / 10 : 0;
    const likesPerVisit = allVisits.length > 0
      ? Math.round((totalLikes / allVisits.length) * 100) / 100 : 0;
    const ideasPerUser = allUsers.length > 0
      ? Math.round((allIdeas.length / allUsers.length) * 100) / 100 : 0;
    const userGrowthRate = (allUsers.length - newUsers7d) > 0
      ? Math.round((newUsers7d / (allUsers.length - newUsers7d)) * 100) : 0;
    const visitGrowthRate = (allVisits.length - visits7d) > 0
      ? Math.round((visits7d / (allVisits.length - visits7d)) * 100) : 0;
    const likeRatio = (totalLikes + totalDislikes) > 0
      ? Math.round((totalLikes / (totalLikes + totalDislikes)) * 100) : 0;
    const ratingParticipation = allUsers.length > 0
      ? Math.round((allRatings.length / allUsers.length) * 100) : 0;

    // Role distribution percentages
    const roleDistribution = allUsers.reduce<Record<string, number>>((acc, u) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});
    const rolePct = Object.entries(roleDistribution).map(([role, count]) => ({
      role,
      count,
      pct: Math.round((count / allUsers.length) * 100),
    }));

    // Rating distribution percentages
    const ratingDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of allRatings) ratingDist[r.rating] = (ratingDist[r.rating] || 0) + 1;
    const ratingPct = Object.entries(ratingDist).map(([rating, count]) => ({
      rating: Number(rating),
      count,
      pct: allRatings.length > 0 ? Math.round((count / allRatings.length) * 100) : 0,
    }));

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
      // ─── Ratios ───
      engagementRate,
      visitsPerUser,
      likesPerVisit,
      ideasPerUser,
      userGrowthRate,
      visitGrowthRate,
      likeRatio,
      ratingParticipation,
      rolePct,
      ratingPct,
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

    // ─── Ratios ───
    const visitsPerPage = Object.keys(byPage).length > 0
      ? Math.round((visits.length / Object.keys(byPage).length) * 10) / 10 : 0;
    const visitsPerUser = Object.keys(byUser).length > 0
      ? Math.round((visits.length / Object.keys(byUser).length) * 10) / 10 : 0;
    const avgDailyVisits = visitsByDay.length > 0
      ? Math.round((visits.length / visitsByDay.length) * 10) / 10 : 0;

    // Page traffic share percentages
    const totalPageCount = Object.values(byPage).reduce((s, p) => s + p.count, 0);
    const topPagesWithPct = Object.entries(byPage)
      .map(([page, data]) => ({
        page,
        title: data.title,
        count: data.count,
        share: totalPageCount > 0 ? Math.round((data.count / totalPageCount) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      totalVisits: visits.length,
      uniquePages: Object.keys(byPage).length,
      uniqueUsers: Object.keys(byUser).length,
      visitsByDay,
      topPages: topPagesWithPct,
      topUsers: Object.entries(byUser)
        .map(([email, count]) => ({ email, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
      // ─── Ratios ───
      visitsPerPage,
      visitsPerUser,
      avgDailyVisits,
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

    const totalIdeas = ideas.length;

    return {
      totalIdeas,
      byIndustry: Object.entries(byIndustry)
        .map(([industry, count]) => ({
          industry,
          count,
          share: totalIdeas > 0 ? Math.round((count / totalIdeas) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count),
      byDomain: Object.entries(byDomain)
        .map(([domain, count]) => ({
          domain,
          count,
          share: totalIdeas > 0 ? Math.round((count / totalIdeas) * 100) : 0,
        }))
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

    const totalUsers = users.length;

    const usersByDayArr = Object.entries(byDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalUsers,
      usersByDay: usersByDayArr,
      byRole: Object.entries(byRole).map(([role, count]) => ({
        role,
        count,
        pct: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
      })),
      // Weekly growth rate (last 7 days vs previous 7 days)
      weeklyGrowthRate: computeGrowthRate(usersByDayArr, 7),
      monthlyGrowthRate: computeGrowthRate(usersByDayArr, 30),
    };
  },
});

function computeGrowthRate(byDay: { date: string; count: number }[], periodDays: number) {
  const now = Date.now();
  const period = periodDays * 86400000;
  const recent = byDay.filter((d) => new Date(d.date).getTime() > now - period);
  const prior = byDay.filter(
    (d) =>
      new Date(d.date).getTime() > now - period * 2 &&
      new Date(d.date).getTime() <= now - period,
  );
  const recentSum = recent.reduce((s, d) => s + d.count, 0);
  const priorSum = prior.reduce((s, d) => s + d.count, 0);
  if (priorSum === 0) return recentSum > 0 ? 100 : 0;
  return Math.round(((recentSum - priorSum) / priorSum) * 100);
}

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

    const totalRatings = ratings.length;

    return {
      totalRatings,
      avgRating: Math.round(avgRating * 10) / 10,
      distribution: Object.entries(distribution).map(([rating, count]) => ({
        rating: Number(rating),
        count,
        pct: totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0,
      })),
      // Satisfaction ratio (ratings 4-5 vs 1-3)
      satisfactionRate: totalRatings > 0
        ? Math.round((ratings.filter((r) => r.rating >= 4).length / totalRatings) * 100)
        : 0,
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

        // ─── User Ratio Metrics ───
        const activityDays = Object.keys(visitsByDay).length;
        const engagementScore = activityDays > 0
          ? Math.round((filtVisits.length / activityDays) * 10) / 10 : 0;
        const visitFrequency = pageSet.size > 0
          ? Math.round((filtVisits.length / pageSet.size) * 10) / 10 : 0;
        const likeRate = filtVisits.length > 0
          ? Math.round((filtLikes.filter((l) => l.action === "like").length / filtVisits.length) * 100) : 0;
        const gameVisits = filtVisits.filter((v) => GAME_PATHS.has(v.page)).length;
        const contentVsGameRatio = gameVisits > 0 && filtVisits.length > gameVisits
          ? Math.round(((filtVisits.length - gameVisits) / gameVisits) * 10) / 10 : 0;

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
          // ─── Ratios ───
          engagementScore,
          visitFrequency,
          likeRate,
          activityDays,
          gameVisits,
          contentVsGameRatio,
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

    const sorted = userData.sort((a, b) => b.totalVisits - a.totalVisits);
    const totalUsers = users.length;
    const activeCount = userData.filter((u) => u.totalVisits > 0).length;
    const totalVisitsSum = userData.reduce((s, u) => s + u.totalVisits, 0);
    const totalLikesSum = userData.reduce((s, u) => s + u.totalLikes, 0);
    const totalIdeasSum = userData.reduce((s, u) => s + u.totalIdeas, 0);

    return {
      users: sorted,
      totalUsers,
      activeUsers: activeCount,
      totalVisits: totalVisitsSum,
      totalLikes: totalLikesSum,
      totalIdeas: totalIdeasSum,
      avgRating: userData.filter((u) => u.rating !== null).reduce((s, u, _, arr) => s + (u.rating ?? 0) / arr.length, 0),
      // ─── Aggregate Ratios ───
      engagementRate: totalUsers > 0 ? Math.round((activeCount / totalUsers) * 100) : 0,
      avgVisitsPerUser: totalUsers > 0 ? Math.round((totalVisitsSum / totalUsers) * 10) / 10 : 0,
      avgLikesPerUser: totalUsers > 0 ? Math.round((totalLikesSum / totalUsers) * 10) / 10 : 0,
      avgIdeasPerUser: totalUsers > 0 ? Math.round((totalIdeasSum / totalUsers) * 100) / 100 : 0,
      likeRate: totalVisitsSum > 0 ? Math.round((totalLikesSum / totalVisitsSum) * 100) : 0,
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

    const totalVisitCount = allVisits.length;

    const pages = Array.from(pageMap.entries()).map(([page, data]) => {
      const visitDepth = data.uniqueUsers.size > 0
        ? Math.round((data.count / data.uniqueUsers.size) * 10) / 10 : 0;
      return {
        page,
        title: data.title,
        count: data.count,
        uniqueUsers: data.uniqueUsers.size,
        trafficShare: totalVisitCount > 0
          ? Math.round((data.count / totalVisitCount) * 100) : 0,
        visitDepth,
        visitsByDay: Object.entries(data.visitsByDay)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        lastVisit: data.lastVisit,
        firstVisit: data.firstVisit === Infinity ? 0 : data.firstVisit,
      };
    }).sort((a, b) => b.count - a.count);

    // Overall trend
    const trendMap: Record<string, number> = {};
    for (const v of allVisits) {
      const day = new Date(v.visitedAt).toISOString().slice(0, 10);
      trendMap[day] = (trendMap[day] || 0) + 1;
    }

    const uniqueUserCount = new Set(allVisits.map((v) => v.email)).size;

    return {
      pages,
      totalPages: pages.length,
      totalVisits: totalVisitCount,
      uniqueUsers: uniqueUserCount,
      // ─── Ratios ───
      avgVisitsPerPage: pages.length > 0
        ? Math.round((totalVisitCount / pages.length) * 10) / 10 : 0,
      avgVisitsPerUser: uniqueUserCount > 0
        ? Math.round((totalVisitCount / uniqueUserCount) * 10) / 10 : 0,
      pageConcentration: pages.length > 0 && pages[0]
        ? Math.round((pages[0].count / totalVisitCount) * 100) : 0,
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

    const totalGameVisits = allVisits.length;
    const totalUniqueUsers = new Set(allVisits.map((v) => v.email)).size;
    const allGameLikes = gameLikes.filter((l) => l.action === "like").length;
    const allGameDislikes = gameLikes.filter((l) => l.action === "dislike").length;

    const games = Array.from(gameMap.entries()).map(([path, data]) => {
      const totalReactions = data.likes + data.dislikes;
      return {
        path,
        title: data.title,
        visitCount: data.visitCount,
        uniqueUsers: data.uniqueUsers.size,
        likes: data.likes,
        dislikes: data.dislikes,
        engagement: data.uniqueUsers.size > 0
          ? Math.round((data.visitCount / data.uniqueUsers.size) * 100) / 100
          : 0,
        // ─── Game Ratios ───
        likeRatio: totalReactions > 0
          ? Math.round((data.likes / totalReactions) * 100) : 0,
        trafficShare: totalGameVisits > 0
          ? Math.round((data.visitCount / totalGameVisits) * 100) : 0,
        avgVisitsPerUser: data.uniqueUsers.size > 0
          ? Math.round((data.visitCount / data.uniqueUsers.size) * 10) / 10 : 0,
        userCapture: totalUniqueUsers > 0
          ? Math.round((data.uniqueUsers.size / totalUniqueUsers) * 100) : 0,
        visitsByDay: Object.entries(data.visitsByDay)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        lastVisit: data.lastVisit,
        firstVisit: data.firstVisit === Infinity ? 0 : data.firstVisit,
      };
    }).sort((a, b) => b.visitCount - a.visitCount);

    // Overall trend
    const trendMap: Record<string, number> = {};
    for (const v of allVisits) {
      const day = new Date(v.visitedAt).toISOString().slice(0, 10);
      trendMap[day] = (trendMap[day] || 0) + 1;
    }

    // Category share
    const categoryMap: Record<string, { visits: number; count: number }> = {};
    for (const game of games) {
      const topic = getGameTopicName(game.path);
      if (!categoryMap[topic]) categoryMap[topic] = { visits: 0, count: 0 };
      categoryMap[topic].visits += game.visitCount;
      categoryMap[topic].count++;
    }
    const categoryShare = Object.entries(categoryMap).map(([name, data]) => ({
      name,
      visits: data.visits,
      games: data.count,
      share: totalGameVisits > 0 ? Math.round((data.visits / totalGameVisits) * 100) : 0,
    })).sort((a, b) => b.visits - a.visits);

    return {
      games,
      categoryShare,
      totalGames: games.length,
      totalVisits: totalGameVisits,
      totalLikes: allGameLikes,
      totalDislikes: allGameDislikes,
      uniqueUsers: totalUniqueUsers,
      // ─── Aggregate Ratios ───
      overallEngagement: totalUniqueUsers > 0
        ? Math.round((totalGameVisits / totalUniqueUsers) * 10) / 10 : 0,
      overallLikeRatio: (allGameLikes + allGameDislikes) > 0
        ? Math.round((allGameLikes / (allGameLikes + allGameDislikes)) * 100) : 0,
      avgVisitsPerGame: gameMap.size > 0
        ? Math.round((totalGameVisits / gameMap.size) * 10) / 10 : 0,
      trend: Object.entries(trendMap)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  },
});

function getGameTopicName(path: string): string {
  const map: Record<string, string> = {
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
  return map[path] ?? "Other";
}

/* ─── Rating Analytics (Detailed) ────────────────────────────── */

export const getRatingAnalyticsDetailed = query({
  args: {
    adminEmail: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminEmail);

    const [allRatings, allUsers, allVisits, allLikes] = await Promise.all([
      ctx.db.query("ratings").collect(),
      ctx.db.query("users").collect(),
      ctx.db.query("pageVisits").collect(),
      ctx.db.query("likes").collect(),
    ]);

    let ratings = allRatings;
    if (args.startDate) ratings = ratings.filter((r) => r.createdAt >= args.startDate!);
    if (args.endDate) ratings = ratings.filter((r) => r.createdAt <= args.endDate!);

    const totalRaters = ratings.length;
    const hasComments = ratings.filter((r) => r.comment && r.comment.trim().length > 0);

    // Rating trend by day
    const byDay: Record<string, { count: number; sum: number }> = {};
    for (const r of ratings) {
      const day = new Date(r.createdAt).toISOString().slice(0, 10);
      if (!byDay[day]) byDay[day] = { count: 0, sum: 0 };
      byDay[day].count++;
      byDay[day].sum += r.rating;
    }
    const ratingTrend = Object.entries(byDay)
      .map(([date, data]) => ({ date, count: data.count, avg: Math.round((data.sum / data.count) * 10) / 10 }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Distribution with percentage
    const dist: Record<number, { count: number; sum: number }> = { 1: { count: 0, sum: 0 }, 2: { count: 0, sum: 0 }, 3: { count: 0, sum: 0 }, 4: { count: 0, sum: 0 }, 5: { count: 0, sum: 0 } };
    for (const r of ratings) {
      dist[r.rating].count++;
      dist[r.rating].sum += r.rating;
    }
    const distribution = Object.entries(dist).map(([rating, data]) => ({
      rating: Number(rating),
      count: data.count,
      pct: totalRaters > 0 ? Math.round((data.count / totalRaters) * 100) : 0,
    }));

    // Average
    const avgRating = totalRaters > 0
      ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / totalRaters) * 10) / 10
      : 0;

    // Satisfaction
    const satisfied = ratings.filter((r) => r.rating >= 4).length;
    const dissatisfied = ratings.filter((r) => r.rating <= 2).length;
    const neutral = ratings.filter((r) => r.rating === 3).length;
    const satisfactionRate = totalRaters > 0 ? Math.round((satisfied / totalRaters) * 100) : 0;
    const dissatisfactionRate = totalRaters > 0 ? Math.round((dissatisfied / totalRaters) * 100) : 0;

    // User segment analysis
    const ratersByRole: Record<string, { count: number; sum: number }> = {};
    for (const r of ratings) {
      const user = allUsers.find((u) => u.email === r.email);
      const role = user?.role ?? "Unknown";
      if (!ratersByRole[role]) ratersByRole[role] = { count: 0, sum: 0 };
      ratersByRole[role].count++;
      ratersByRole[role].sum += r.rating;
    }
    const byRole = Object.entries(ratersByRole).map(([role, data]) => ({
      role,
      count: data.count,
      avg: Math.round((data.sum / data.count) * 10) / 10,
      pct: totalRaters > 0 ? Math.round((data.count / totalRaters) * 100) : 0,
    }));

    // Rating participation rate
    const usersWhoRated = new Set(ratings.map((r) => r.email)).size;
    const participationRate = allUsers.length > 0
      ? Math.round((usersWhoRated / allUsers.length) * 100) : 0;

    // Repeat vs first-time raters
    const ratingCounts: Record<string, number> = {};
    for (const r of allRatings) {
      ratingCounts[r.email] = (ratingCounts[r.email] || 0) + 1;
    }
    const repeatRaters = Object.values(ratingCounts).filter((c) => c > 1).length;
    const firstTimeRaters = Object.values(ratingCounts).filter((c) => c === 1).length;
    const repeatRate = (repeatRaters + firstTimeRaters) > 0
      ? Math.round((repeatRaters / (repeatRaters + firstTimeRaters)) * 100) : 0;

    // Comments analysis
    const comments = hasComments.map((r) => ({
      email: r.email,
      rating: r.rating,
      comment: r.comment!.slice(0, 200),
      createdAt: r.createdAt,
      user: allUsers.find((u) => u.email === r.email),
    })).sort((a, b) => b.createdAt - a.createdAt).slice(0, 50);

    // Ratings correlation with engagement
    const ratedUserEmails = new Set(ratings.map((r) => r.email));
    const ratedUsersData = allUsers.filter((u) => ratedUserEmails.has(u.email));
    const unratedUsersData = allUsers.filter((u) => !ratedUserEmails.has(u.email));
    const ratedVisits = allVisits.filter((v) => ratedUserEmails.has(v.email));
    const unratedVisits = allVisits.filter((v) => !ratedUserEmails.has(v.email));
    const ratedLikes = allLikes.filter((l) => ratedUserEmails.has(l.email) && l.action === "like");

    return {
      totalRatings: totalRaters,
      uniqueRaters: usersWhoRated,
      avgRating,
      distribution,
      satisfactionRate,
      dissatisfactionRate,
      neutralRate: totalRaters > 0 ? Math.round((neutral / totalRaters) * 100) : 0,
      ratingTrend,
      byRole,
      participationRate,
      repeatRate,
      totalComments: hasComments.length,
      commentRate: totalRaters > 0 ? Math.round((hasComments.length / totalRaters) * 100) : 0,
      recentComments: comments,
      // Correlation
      engagementOfRaters: ratedUsersData.length > 0
        ? Math.round((ratedVisits.length / ratedUsersData.length) * 10) / 10 : 0,
      engagementOfNonRaters: unratedUsersData.length > 0
        ? Math.round((unratedVisits.length / unratedUsersData.length) * 10) / 10 : 0,
      likeRateOfRaters: ratedVisits.length > 0
        ? Math.round((ratedLikes.length / ratedVisits.length) * 100) : 0,
      // Time analysis
      newestRating: ratings.length > 0 ? Math.max(...ratings.map((r) => r.createdAt)) : 0,
      oldestRating: ratings.length > 0 ? Math.min(...ratings.map((r) => r.createdAt)) : 0,
    };
  },
});

/* ─── Topic Analytics (deep within games) ────────────────────── */

export const getTopicAnalytics = query({
  args: {
    adminEmail: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminEmail);

    let allVisits = await ctx.db.query("pageVisits").collect();
    allVisits = allVisits.filter((v) => GAME_PATHS.has(v.page));
    if (args.startDate) allVisits = allVisits.filter((v) => v.visitedAt >= args.startDate!);
    if (args.endDate) allVisits = allVisits.filter((v) => v.visitedAt <= args.endDate!);

    const allLikes = await ctx.db.query("likes").collect();
    const gameLikes = allLikes.filter((l) => l.targetType === "game");

    const allUsers = await ctx.db.query("users").collect();

    // Group by topic
    const topicMap = new Map<string, {
      visits: number;
      users: Set<string>;
      likes: number;
      dislikes: number;
      games: Set<string>;
      visitsByDay: Record<string, number>;
      firstVisit: number;
      lastVisit: number;
    }>();

    for (const v of allVisits) {
      const topic = getGameTopicName(v.page);
      const existing = topicMap.get(topic) ?? {
        visits: 0,
        users: new Set<string>(),
        likes: 0,
        dislikes: 0,
        games: new Set<string>(),
        visitsByDay: {},
        firstVisit: Infinity,
        lastVisit: 0,
      };
      existing.visits++;
      existing.users.add(v.email);
      existing.games.add(v.page);
      const day = new Date(v.visitedAt).toISOString().slice(0, 10);
      existing.visitsByDay[day] = (existing.visitsByDay[day] || 0) + 1;
      existing.lastVisit = Math.max(existing.lastVisit, v.visitedAt);
      existing.firstVisit = Math.min(existing.firstVisit, v.visitedAt);
      topicMap.set(topic, existing);
    }

    // Add likes by topic (via game paths)
    for (const [topic, data] of topicMap) {
      for (const gamePath of data.games) {
        const targetLikes = gameLikes.filter((l) => l.targetId === gamePath);
        data.likes += targetLikes.filter((l) => l.action === "like").length;
        data.dislikes += targetLikes.filter((l) => l.action === "dislike").length;
      }
    }

    const totalGameVisits = allVisits.length;
    const totalGameUsers = new Set(allVisits.map((v) => v.email)).size;
    const totalGameLikes = gameLikes.filter((l) => l.action === "like").length;

    const topics = Array.from(topicMap.entries()).map(([name, data]) => {
      const engagementRate = data.users.size > 0
        ? Math.round((data.visits / data.users.size) * 10) / 10 : 0;
      const totalReactions = data.likes + data.dislikes;
      return {
        name,
        visits: data.visits,
        uniqueUsers: data.users.size,
        gameCount: data.games.size,
        likes: data.likes,
        dislikes: data.dislikes,
        likeRatio: totalReactions > 0 ? Math.round((data.likes / totalReactions) * 100) : 0,
        engagementRate,
        trafficShare: totalGameVisits > 0 ? Math.round((data.visits / totalGameVisits) * 100) : 0,
        userCapture: totalGameUsers > 0 ? Math.round((data.users.size / totalGameUsers) * 100) : 0,
        likeShare: totalGameLikes > 0 ? Math.round((data.likes / totalGameLikes) * 100) : 0,
        visitsByDay: Object.entries(data.visitsByDay)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        firstVisit: data.firstVisit === Infinity ? 0 : data.firstVisit,
        lastVisit: data.lastVisit,
      };
    }).sort((a, b) => b.visits - a.visits);

    // Overall trend by topic (for stacked area)
    const allDays = [...new Set(allVisits.map((v) => new Date(v.visitedAt).toISOString().slice(0, 10)))].sort();
    const topicTrend = topics.map((t) => ({
      name: t.name,
      data: allDays.map((day) => {
        const dayData = t.visitsByDay.find((d) => d.date === day);
        return { date: day, count: dayData?.count ?? 0 };
      }),
    }));

    return {
      topics,
      topicTrend,
      totalTopics: topics.length,
      totalVisits: totalGameVisits,
      totalUsers: totalGameUsers,
      topTopic: topics[0] ?? null,
      concentration: topics.length > 0 && topics[0]
        ? Math.round((topics[0].visits / totalGameVisits) * 100) : 0,
    };
  },
});
