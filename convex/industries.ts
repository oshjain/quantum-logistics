import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";

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

/* ─── Industries CRUD ──────────────────────────────────────────── */

export const getAllIndustries = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("industries")
      .withIndex("by_order")
      .collect();
  },
});

export const addIndustry = mutation({
  args: {
    adminEmail: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx, args.adminEmail);
    const all = await ctx.db.query("industries").collect();
    return await ctx.db.insert("industries", {
      name: args.name,
      order: all.length,
      createdAt: Date.now(),
    });
  },
});

export const updateIndustry = mutation({
  args: {
    adminEmail: v.string(),
    industryId: v.id("industries"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx, args.adminEmail);
    await ctx.db.patch(args.industryId, { name: args.name });
  },
});

export const reorderIndustry = mutation({
  args: {
    adminEmail: v.string(),
    industryId: v.id("industries"),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx, args.adminEmail);
    await ctx.db.patch(args.industryId, { order: args.order });
  },
});

export const deleteIndustry = mutation({
  args: {
    adminEmail: v.string(),
    industryId: v.id("industries"),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx, args.adminEmail);
    await ctx.db.delete(args.industryId);
  },
});

/* ─── Domains CRUD ─────────────────────────────────────────────── */

export const getAllDomains = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("domains")
      .withIndex("by_order")
      .collect();
  },
});

export const addDomain = mutation({
  args: {
    adminEmail: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx, args.adminEmail);
    const all = await ctx.db.query("domains").collect();
    return await ctx.db.insert("domains", {
      name: args.name,
      order: all.length,
      createdAt: Date.now(),
    });
  },
});

export const updateDomain = mutation({
  args: {
    adminEmail: v.string(),
    domainId: v.id("domains"),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx, args.adminEmail);
    await ctx.db.patch(args.domainId, { name: args.name });
  },
});

export const reorderDomain = mutation({
  args: {
    adminEmail: v.string(),
    domainId: v.id("domains"),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx, args.adminEmail);
    await ctx.db.patch(args.domainId, { order: args.order });
  },
});

export const deleteDomain = mutation({
  args: {
    adminEmail: v.string(),
    domainId: v.id("domains"),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx, args.adminEmail);
    await ctx.db.delete(args.domainId);
  },
});

/* ─── Seed initial data ────────────────────────────────────────── */

const DEFAULT_INDUSTRIES = [
  "Logistics & Supply Chain",
  "Manufacturing",
  "Healthcare",
  "Finance & Banking",
  "Insurance",
  "Retail & E-commerce",
  "Travel & Hospitality",
  "Technology",
  "Telecommunications",
  "Energy & Utilities",
  "Pharmaceuticals",
  "Automotive",
  "Aerospace & Defense",
  "Other",
];

const DEFAULT_DOMAINS = [
  "Back Office Operations",
  "Front Office Operations",
  "Finance & Accounting",
  "Shipping & Maritime",
  "Vessel Operations",
  "Trucking & Freight",
  "Air Cargo",
  "Freight Forwarding",
  "Port & Terminals",
  "Ground Force / Ramp Operations",
  "Warehousing & Distribution",
  "Supply Chain Planning",
  "Procurement & Sourcing",
  "Customer Experience",
  "Data, Analytics & AI",
  "Digital Transformation",
  "Operations Excellence",
  "Sustainability / ESG",
  "Risk & Compliance",
  "Information Technology",
  "Sales & Marketing",
  "Human Resources",
  "Legal & Contracts",
  "Other",
];

export const seedLists = mutation({
  args: {
    adminEmail: v.string(),
  },
  handler: async (ctx, args) => {
    await assertSuperAdmin(ctx, args.adminEmail);

    const existingIndustries = await ctx.db.query("industries").collect();
    const existingDomains = await ctx.db.query("domains").collect();

    const now = Date.now();

    if (existingIndustries.length === 0) {
      for (let i = 0; i < DEFAULT_INDUSTRIES.length; i++) {
        await ctx.db.insert("industries", {
          name: DEFAULT_INDUSTRIES[i],
          order: i,
          createdAt: now,
        });
      }
    }

    if (existingDomains.length === 0) {
      for (let i = 0; i < DEFAULT_DOMAINS.length; i++) {
        await ctx.db.insert("domains", {
          name: DEFAULT_DOMAINS[i],
          order: i,
          createdAt: now,
        });
      }
    }

    return {
      industriesSeeded: existingIndustries.length === 0,
      domainsSeeded: existingDomains.length === 0,
    };
  },
});
