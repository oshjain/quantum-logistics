import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ─── Submit or update a rating ─────────────────────────────────── */
export const submitRating = mutation({
  args: {
    email: v.string(),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("ratings")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        rating: args.rating,
        comment: args.comment,
        createdAt: Date.now(),
      });
      return { action: "updated" };
    }

    await ctx.db.insert("ratings", {
      email: args.email,
      rating: args.rating,
      comment: args.comment,
      createdAt: Date.now(),
    });
    return { action: "created" };
  },
});

/* ─── Get user's own rating ─────────────────────────────────────── */
export const getUserRating = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ratings")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

/* ─── Get overall rating stats ──────────────────────────────────── */
export const getRatingStats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("ratings").collect();
    if (all.length === 0) {
      return { average: 0, count: 0, distribution: [0, 0, 0, 0, 0] };
    }
    const dist = [0, 0, 0, 0, 0];
    let sum = 0;
    for (const r of all) {
      const idx = Math.min(Math.max(Math.round(r.rating) - 1, 0), 4);
      dist[idx]++;
      sum += r.rating;
    }
    return { average: sum / all.length, count: all.length, distribution: dist };
  },
});
