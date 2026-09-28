import { expect, it } from "vitest";
import { MemoryHistoryRepository } from "./history";
it("keeps the latest ten records with unique IDs and timestamps, then clears", async () => {
  const repository = new MemoryHistoryRepository();
  for (let i = 0; i < 12; i++)
    await repository.add({ expression: `${i} + 1`, result: `${i + 1}` });
  const rows = await repository.list();
  expect(rows).toHaveLength(10);
  expect(rows[0].result).toBe("12");
  expect(new Set(rows.map((row) => row.id)).size).toBe(10);
  expect(Number.isNaN(Date.parse(rows[0].created_at))).toBe(false);
  rows[0].result = "mutated";
  expect((await repository.list())[0].result).toBe("12");
  expect(await new MemoryHistoryRepository().list()).toEqual([]);
  await repository.clear();
  expect(await repository.list()).toEqual([]);
});
