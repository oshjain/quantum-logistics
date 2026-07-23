import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/* ─── Like / Dislike a game or topic ────────────────────────────── */
export const toggleLike = mutation({
  args: {
    email: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    action: v.string(),       // "like"
  },
  handler: async (ctx, args) => {
    // Check if user already liked this target
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user_target", (q) =>
        q.eq("email", args.email).eq("targetType", args.targetType).eq("targetId", args.targetId),
      )
      .first();

    if (existing) {
      if (existing.action === "like") {
        // Already liked — unlike (remove), keep history
        await ctx.db.patch(existing._id, { action: "removed", removedAt: Date.now() });
        return { action: "removed" };
      }
      // Was disliked or removed — update to like
      await ctx.db.patch(existing._id, {
        action: "like",
        feedback: undefined,
        createdAt: Date.now(),
        removedAt: undefined,
      });
      return { action: "liked" };
    }

    await ctx.db.insert("likes", {
      email: args.email,
      targetType: args.targetType,
      targetId: args.targetId,
      action: "like",
      createdAt: Date.now(),
    });
    return { action: "liked" };
  },
});

/* ─── Dislike with optional feedback ────────────────────────────── */
export const toggleDislike = mutation({
  args: {
    email: v.string(),
    targetType: v.string(),
    targetId: v.string(),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user_target", (q) =>
        q.eq("email", args.email).eq("targetType", args.targetType).eq("targetId", args.targetId),
      )
      .first();

    if (existing) {
      if (existing.action === "dislike") {
        // Already disliked — remove, keep history
        await ctx.db.patch(existing._id, { action: "removed", removedAt: Date.now() });
        return { action: "removed" };
      }
      // Was liked or removed — update to dislike
      await ctx.db.patch(existing._id, {
        action: "dislike",
        feedback: args.feedback,
        createdAt: Date.now(),
        removedAt: undefined,
      });
      return { action: "disliked" };
    }

    await ctx.db.insert("likes", {
      email: args.email,
      targetType: args.targetType,
      targetId: args.targetId,
      action: "dislike",
      feedback: args.feedback,
      createdAt: Date.now(),
    });
    return { action: "disliked" };
  },
});

/* ─── Get like count for a target ───────────────────────────────── */
export const getLikeCount = query({
  args: {
    targetType: v.string(),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    const likes = await ctx.db
      .query("likes")
      .withIndex("by_target", (q) =>
        q.eq("targetType", args.targetType).eq("targetId", args.targetId),
      )
      .collect();
    const likeCount = likes.filter((l) => l.action === "like").length;
    const dislikeCount = likes.filter((l) => l.action === "dislike").length;
    return { likeCount, dislikeCount, total: likes.length };
  },
});

/* ─── Get user's like status for a target ──────────────────────── */
export const getUserLikeStatus = query({
  args: {
    email: v.string(),
    targetType: v.string(),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("likes")
      .withIndex("by_user_target", (q) =>
        q.eq("email", args.email).eq("targetType", args.targetType).eq("targetId", args.targetId),
      )
      .first();
    return existing ?? null;
  },
});

/* ─── Get all likes by a user ───────────────────────────────────── */
export const getUserLikes = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("likes")
      .withIndex("by_user", (q) => q.eq("email", args.email))
      .order("desc")
      .collect();
  },
});

/* ─── Get all likes for many targets at once (for grids) ────────── */
export const getBulkLikeCounts = query({
  args: {
    targets: v.array(v.object({ targetType: v.string(), targetId: v.string() })),
  },
  handler: async (ctx, args) => {
    const results: Record<string, { likeCount: number; dislikeCount: number }> = {};
    for (const t of args.targets) {
      const key = `${t.targetType}:${t.targetId}`;
      const likes = await ctx.db
        .query("likes")
        .withIndex("by_target", (q) =>
          q.eq("targetType", t.targetType).eq("targetId", t.targetId),
        )
        .collect();
      results[key] = {
        likeCount: likes.filter((l) => l.action === "like").length,
        dislikeCount: likes.filter((l) => l.action === "dislike").length,
      };
    }
    return results;
  },
});
