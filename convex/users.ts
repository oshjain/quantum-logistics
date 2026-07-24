import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const ADMIN_EMAIL = "u306076@wns.com";
const ADMIN_NAME = "Hasmukh Jain";

/**
 * Upsert a user by email when they log in.
 * - If the user doesn't exist, create them with role "Viewer"
 *   (or "Admin" for the designated admin).
 * - If the user exists, update their name in case it changed.
 */
export const upsertUser = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { email, name } = args;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing) {
      // Update name if provided and different
      if (name && name !== existing.name) {
        await ctx.db.patch(existing._id, { name });
      }
      return existing._id;
    }

    // New user — assign role
    const role = email === ADMIN_EMAIL ? "Admin" : "Viewer";

    return await ctx.db.insert("users", {
      email,
      name: name ?? email,
      role,
      createdAt: Date.now(),
    });
  },
});

/**
 * Get a user by email.
 */
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});
