import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  passwordHash: text("password_hash"),
  image: text("image"),
  role: text("role", { enum: ["consumer", "adjuster", "attorney", "contractor"] })
    .default("consumer")
    .notNull(),
  aiProvider: text("ai_provider", { enum: ["claude", "openai"] })
    .default("claude")
    .notNull(),
  subscriptionTier: text("subscription_tier", { enum: ["free", "pro"] })
    .default("free")
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
