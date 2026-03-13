import { pgTable, text, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const claimStatusEnum = ["open", "in_review", "approved", "denied", "settled", "closed"] as const;
export type ClaimStatus = (typeof claimStatusEnum)[number];

export const claims = pgTable("claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  insuranceCompany: text("insurance_company"),
  policyNumber: text("policy_number"),
  claimNumber: text("claim_number"),
  status: text("status", {
    enum: claimStatusEnum,
  })
    .default("open")
    .notNull(),
  dateOfLoss: timestamp("date_of_loss", { mode: "date" }),
  claimAmount: text("claim_amount"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("claims_user_id_updated_at_idx").on(table.userId, table.updatedAt),
]);
