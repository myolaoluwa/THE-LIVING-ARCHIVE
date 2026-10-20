import "server-only";
import { z } from "zod";
export type DbRow = Record<string, unknown>;
export function checkedRows(result: {
  data: unknown;
  error: unknown;
}): DbRow[] {
  if (result.error)
    throw new Error("The requested records could not be loaded.");
  return z.array(z.record(z.string(), z.unknown())).parse(result.data);
}
export function field(row: DbRow, key: string) {
  const value = row[key];
  return value === null || value === undefined ? "" : String(value);
}
export function dateLabel(value: unknown) {
  if (typeof value !== "string") return "—";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? "—"
    : new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeZone: "UTC",
      }).format(date);
}
