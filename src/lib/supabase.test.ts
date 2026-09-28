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
it("rejects secret keys and legacy privileged JWTs", () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://kalkulate-test.invalid");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "sb_secret_test_fixture_only");
  expect(getSupabaseClient()).toBeNull();
  vi.stubEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    `header.${btoa(JSON.stringify({ role: "service_role" }))}.signature`,
  );
  expect(getSupabaseClient()).toBeNull();
});
it("creates an optional client with public configuration without a network request", () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://kalkulate-test.invalid");
  vi.stubEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "sb_publishable_test_fixture_only",
  );
  expect(getSupabaseClient()).not.toBeNull();
});
