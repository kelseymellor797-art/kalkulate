import type { CalculationRecord, NewCalculation } from "@/types/calculation";

export interface HistoryRepository {
  list(): Promise<CalculationRecord[]>;
  add(calculation: NewCalculation): Promise<void>;
  clear(): Promise<void>;
}

/** Per workspace instance, never a server singleton. No data survives a reload. */
export class MemoryHistoryRepository implements HistoryRepository {
  private records: CalculationRecord[] = [];
  async list() {
    return this.records.map((record) => ({ ...record }));
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

// Phase 1 replaces this factory after the table and access policies exist.
export function createHistoryRepository(): HistoryRepository {
  return new MemoryHistoryRepository();
}
