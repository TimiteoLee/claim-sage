import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

// During build, DATABASE_URL may be empty — neon() will throw if called without it.
// We guard here so the module can be imported; actual queries will fail at runtime
// if the env var is truly missing.
const sql = connectionString ? neon(connectionString) : (null as unknown as ReturnType<typeof neon>);

export const db = sql
  ? drizzle(sql, { schema })
  : (null as unknown as ReturnType<typeof drizzle<typeof schema>>);
