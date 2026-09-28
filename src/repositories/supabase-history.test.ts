import { createClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";
import { SupabaseHistoryRepository } from "./supabase-history";
import { ResilientHistoryRepository, createHistoryRepository } from "./history";
const rows = Array.from({ length: 10 }, (_, i) => ({
  id: `id-${i}`,
  expression: `${10 - i} + 1`,
  result: `${11 - i}`,
  created_at: new Date(Date.UTC(2026, 0, 10 - i)).toISOString(),
}));
function setup(response: Response | (() => Promise<Response>)) {
  const fetcher = vi.fn(async () =>
    typeof response === "function" ? response() : response.clone(),
  );
  const client = createClient(
    "https://kalkulate-test.invalid",
    "sb_publishable_test_fixture_only",
    {
      global: { fetch: fetcher },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
  return { repository: new SupabaseHistoryRepository(client, 10), fetcher };
}
describe("Supabase history through the real SDK with mocked transport", () => {
  it("inserts only expression and result, leaving defaults to the database", async () => {
    const { repository, fetcher } = setup(new Response(null, { status: 201 }));
    await repository.add({ expression: "2 + 3", result: "5" });
    const call = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(call[0]).toContain("/rest/v1/calculations");
    expect(call[1].method).toBe("POST");
    expect(JSON.parse(call[1].body as string)).toEqual({
      expression: "2 + 3",
      result: "5",
    });
  });
  it("requests newest-first order and a server-side ten-row limit", async () => {
    const { repository, fetcher } = setup(Response.json(rows));
    expect(await repository.list()).toEqual(rows);
    const url = new URL((fetcher.mock.calls[0] as unknown as [string])[0]);
    expect(url.searchParams.get("order")).toBe("created_at.desc,id.desc");
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("select")).toBe(
      "id,expression,result,created_at",
    );
  });
  it("returns an empty list when the database is empty", async () =>
    expect(await setup(Response.json([])).repository.list()).toEqual([]));
  it("hides database details on read and write failure", async () => {
    const { repository } = setup(
      Response.json({ message: "internal details" }, { status: 403 }),
    );
    await expect(repository.list()).rejects.toThrow("History unavailable");
    await expect(
      repository.add({ expression: "1 + 1", result: "2" }),
    ).rejects.toThrow("History unavailable");
  });
  it("handles network failure", async () => {
    const { repository } = setup(async () => {
      throw new TypeError("Network unavailable");
    });
    await expect(repository.list()).rejects.toThrow("History unavailable");
  });
  it("rejects malformed remote rows", async () => {
    await expect(
      setup(
        Response.json([{ expression: "missing fields" }]),
      ).repository.list(),
    ).rejects.toThrow("History unavailable");
  });
  it("aborts slow requests", async () => {
    const fetcher: typeof fetch = (_input, options) =>
      new Promise((_resolve, reject) => {
        options?.signal?.addEventListener("abort", () =>
          reject(new DOMException("Timed out", "AbortError")),
        );
      });
    const client = createClient(
      "https://kalkulate-test.invalid",
      "sb_publishable_test_fixture_only",
      { global: { fetch: fetcher } },
    );
    await expect(
      new SupabaseHistoryRepository(client, 10).list(),
    ).rejects.toThrow("History unavailable");
  });
});
describe("fallback", () => {
  it("keeps cached history and failed saves without retrying remote writes", async () => {
    const remote = {
      status: "shared" as const,
      list: vi.fn().mockResolvedValue(rows),
      add: vi.fn().mockRejectedValue(new Error("offline")),
    };
    const repository = new ResilientHistoryRepository(remote);
    expect(await repository.list()).toEqual(rows);
    await repository.add({ expression: "20 + 1", result: "21" });
    expect(repository.status).toBe("offline");
    expect((await repository.list())[0].result).toBe("21");
    await repository.add({ expression: "30 + 1", result: "31" });
    expect(await repository.list()).toHaveLength(10);
    expect(remote.add).toHaveBeenCalledTimes(1);
    expect("clear" in repository).toBe(false);
  });
  it("retains a successful save locally if the following read fails", async () => {
    const repository = new ResilientHistoryRepository({
      status: "shared",
      add: vi.fn().mockResolvedValue(undefined),
      list: vi.fn().mockRejectedValue(new Error("offline")),
    });
    await repository.add({ expression: "1 + 1", result: "2" });
    expect((await repository.list())[0].result).toBe("2");
    expect(repository.status).toBe("offline");
  });
  it("switches to fallback when initial load fails", async () => {
    const repository = new ResilientHistoryRepository({
      status: "shared",
      add: vi.fn(),
      list: vi.fn().mockRejectedValue(new Error("offline")),
    });
    expect(await repository.list()).toEqual([]);
    expect(repository.status).toBe("offline");
    await repository.add({ expression: "1 + 1", result: "2" });
    expect(await repository.list()).toHaveLength(1);
  });
  it("selects memory when configuration is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(createHistoryRepository().status).toBe("local");
    vi.unstubAllEnvs();
  });
});
