import type { SupabaseClient } from "@supabase/supabase-js";
import type { CalculationRecord, NewCalculation } from "@/types/calculation";
import type { HistoryRepository } from "./history";

const columns = "id,expression,result,created_at";
function isRecord(value: unknown): value is CalculationRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.expression === "string" &&
    r.expression.length <= 256 &&
    typeof r.result === "string" &&
    r.result.length <= 64 &&
    typeof r.created_at === "string" &&
    Number.isFinite(Date.parse(r.created_at))
  );
}
export class SupabaseHistoryRepository implements HistoryRepository {
  readonly status = "shared" as const;
  constructor(
    private client: SupabaseClient,
    private timeoutMs = 5000,
  ) {}
  async add(calculation: NewCalculation) {
    const { error } = await this.client
      .from("calculations")
      .insert({
        expression: calculation.expression,
        result: calculation.result,
      })
      .abortSignal(AbortSignal.timeout(this.timeoutMs))
      .retry(false);
    if (error) throw new Error("History unavailable");
  }
  async list(): Promise<CalculationRecord[]> {
    const { data, error } = await this.client
      .from("calculations")
      .select(columns)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(10)
      .abortSignal(AbortSignal.timeout(this.timeoutMs))
      .retry(false);
    if (error || !Array.isArray(data) || !data.every(isRecord))
      throw new Error("History unavailable");
    return data;
  }
}
