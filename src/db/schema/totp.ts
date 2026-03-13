import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { users } from "./users";

export const totpSecrets = pgTable("totp_secrets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  secret: text("secret").notNull(),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
