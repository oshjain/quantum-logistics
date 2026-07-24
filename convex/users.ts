import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";

const SUPER_ADMIN_EMAIL = "u306076@wns.com";
const SUPER_ADMIN_NAME = "Hasmukh Jain";

/* ─── Helpers ──────────────────────────────────────────────────── */

async function assertSuperAdmin(ctx: QueryCtx | MutationCtx, email: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .unique();
  if (!user || user.role !== "Super Admin") {
    throw new Error("Not authorized. Super Admin privileges required.");
  }
}

async function assertAdmin(ctx: QueryCtx | MutationCtx, email: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .unique();
  if (!user || (user.role !== "Admin" && user.role !== "Super Admin")) {
    throw new Error("Not authorized. Admin privileges required.");
  }
}

/* ─── Public Functions ─────────────────────────────────────────── */

/**
 * Upsert a user by email when they log in.
 * - If the user doesn't exist, create them with role "Viewer"
 *   (or "Super Admin" for the designated super admin).
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
    const role = email === SUPER_ADMIN_EMAIL ? "Super Admin" : "Viewer";

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

/**
 * Get role for a user by email. Lightweight query.
 */
export const getUserRole = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    return user?.role ?? null;
  },
});

/* ─── Super Admin: User Management ─────────────────────────────── */

/**
 * Get all users (Super Admin only).
 */
export const getAllUsers = query({
  args: {
    adminEmail: v.string(),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx, args.adminEmail);
    return await ctx.db.query("users").order("desc").collect();
  },
});

/**
 * Search users by email or name (Super Admin only).
 */
export const searchUsers = query({
  args: {
    adminEmail: v.string(),
    search: v.string(),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx, args.adminEmail);
    const all = await ctx.db.query("users").collect();
    const q = args.search.toLowerCase();
    return all.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.name && u.name.toLowerCase().includes(q)),
    );
  },
});

/**
 * Update a user's name, role, or email (Super Admin only).
 */
export const updateUser = mutation({
  args: {
    adminEmail: v.string(),
    userId: v.id("users"),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx, args.adminEmail);
    const patch: Record<string, any> = {};
    if (args.name !== undefined) patch.name = args.name;
    if (args.role !== undefined) patch.role = args.role;
    if (args.email !== undefined) patch.email = args.email;
    await ctx.db.patch(args.userId, patch);
  },
});

/**
 * Delete a user (Super Admin only).
 */
export const deleteUser = mutation({
  args: {
    adminEmail: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx, args.adminEmail);
    await ctx.db.delete(args.userId);
  },
});

/**
 * Get platform-wide user stats (Admin+).
 */
export const getUserStats = query({
  args: {
    adminEmail: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx, args.adminEmail);
    const all = await ctx.db.query("users").collect();
    return {
      totalUsers: all.length,
      byRole: {
        superAdmin: all.filter((u) => u.role === "Super Admin").length,
        admin: all.filter((u) => u.role === "Admin").length,
        viewer: all.filter((u) => u.role === "Viewer").length,
      },
    };
  },
});
