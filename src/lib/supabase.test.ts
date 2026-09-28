import { afterEach, expect, it, vi } from "vitest";
import { getSupabaseClient } from "./supabase";
afterEach(() => vi.unstubAllEnvs());
it("returns null when credentials are missing", () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
  expect(getSupabaseClient()).toBeNull();
});
it("returns null for malformed configuration", () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "invalid");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test");
  expect(getSupabaseClient()).toBeNull();
});
