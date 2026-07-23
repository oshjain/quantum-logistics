import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),

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
});
