import {
  pgTable,
  serial,
  date,
  varchar,
  bigint,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const dailyMetrics = pgTable(
  "daily_metrics",
  {
    id: serial("id").primaryKey(),
    date: date("date").notNull(),
    source: varchar("source", { length: 20 }).notNull(),
    value: bigint("value", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [unique().on(table.date, table.source)]
);
