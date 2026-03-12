import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { users } from "./users";

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // MIME type
  size: integer("size").notNull(), // bytes
  url: text("url").notNull(), // Vercel Blob URL
  category: text("category", {
    enum: ["policy", "claim", "estimate", "correspondence", "photo", "other"],
  })
    .default("other")
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
