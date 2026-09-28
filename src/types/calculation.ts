export interface CalculationRecord {
  id: string;
  expression: string;
  result: string;
  created_at: string;
}
export type NewCalculation = Pick<CalculationRecord, "expression" | "result">;
