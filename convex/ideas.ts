import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Submit a new idea.
 */
export const submitIdea = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    industry: v.string(),
    domain: v.string(),
    process: v.string(),
    idea: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ideas", {
      email: args.email,
      name: args.name,
      industry: args.industry,
      domain: args.domain,
      process: args.process,
      idea: args.idea,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get all ideas for a specific user (by email).
 */
export const getUserIdeas = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ideas")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .order("desc")
      .collect();
  },
});

/**
 * Get total idea count for a user.
 */
export const getUserIdeaCount = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const ideas = await ctx.db
      .query("ideas")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();
    return ideas.length;
  },
});

/**
 * Get global idea stats (count of all submitted ideas).
 */
export const getGlobalIdeaStats = query({
  args: {},
  handler: async (ctx) => {
    const allIdeas = await ctx.db.query("ideas").collect();
    return {
      totalIdeas: allIdeas.length,
    };
  },
});
