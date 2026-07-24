import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    role: v.string(),         // "Admin" | "Viewer"
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  likes: defineTable({
    email: v.string(),
    targetType: v.string(),   // "game" | "topic"
    targetId: v.string(),     // game path (e.g. "/container-stack") or topic name (e.g. "Shipping Lines")
    action: v.string(),       // "like" | "dislike" | "removed"
    feedback: v.optional(v.string()),
    createdAt: v.number(),
    removedAt: v.optional(v.number()),
  })
    .index("by_target", ["targetType", "targetId"])
    .index("by_user", ["email"])
    .index("by_user_target", ["email", "targetType", "targetId"]),

  ratings: defineTable({
    email: v.string(),
    rating: v.number(),       // 1–5
    comment: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_email", ["email"]),

  pageVisits: defineTable({
    email: v.string(),
    page: v.string(),         // path
    pageTitle: v.optional(v.string()),
    visitedAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_page", ["page"])
    .index("by_date", ["visitedAt"]),

  ideas: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    industry: v.string(),
    domain: v.string(),
    process: v.string(),
    idea: v.string(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_date", ["createdAt"]),

  industries: defineTable({
    name: v.string(),
    order: v.number(),
    createdAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_order", ["order"]),

  domains: defineTable({
    name: v.string(),
    order: v.number(),
    createdAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_order", ["order"]),
});
