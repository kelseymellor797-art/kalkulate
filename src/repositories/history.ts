import type { CalculationRecord, NewCalculation } from "@/types/calculation";
import { getSupabaseClient } from "../lib/supabase";
import { SupabaseHistoryRepository } from "./supabase-history";

export type HistoryStatus = "local" | "shared" | "offline";
export interface HistoryRepository {
  readonly status: HistoryStatus;
  list(): Promise<CalculationRecord[]>;
  add(calculation: NewCalculation): Promise<void>;
  clear(): Promise<void>;
}

export class MemoryHistoryRepository implements HistoryRepository {
  readonly status = "local" as const;
  private records: CalculationRecord[] = [];
  async list() {
    return this.records.map((record) => ({ ...record }));
  }
  replace(records: CalculationRecord[]) {
    this.records = records.slice(0, 10).map((record) => ({ ...record }));
  }
  async add(calculation: NewCalculation) {
    this.records = [
      {
        ...calculation,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      },
      ...this.records,
    ].slice(0, 10);
  }
  async clear() {
    this.records = [];
  }
}

/** Fail closed to local history for this page. Never replay ambiguous failed writes. */
export class ResilientHistoryRepository implements HistoryRepository {
  status: HistoryStatus = "shared";
  private fallback = new MemoryHistoryRepository();
  constructor(private remote: HistoryRepository) {}
  async list() {
    if (this.status === "shared") {
      try {
        const records = await this.remote.list();
        this.fallback.replace(records);
        return records;
      } catch {
        this.status = "offline";
      }
    }
    return this.fallback.list();
  }
  async add(calculation: NewCalculation) {
    await this.fallback.add(calculation);
    if (this.status === "shared") {
      try {
        await this.remote.add(calculation);
      } catch {
        this.status = "offline";
      }
    }
  }
  async clear() {
    if (this.status !== "shared") throw new Error("History unavailable");
    await this.remote.clear();
    await this.fallback.clear();
  }
}
export function createHistoryRepository(): HistoryRepository {
  const client = getSupabaseClient();
  return client
    ? new ResilientHistoryRepository(new SupabaseHistoryRepository(client))
    : new MemoryHistoryRepository();
}
