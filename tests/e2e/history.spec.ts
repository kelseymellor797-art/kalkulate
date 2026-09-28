import { expect, test } from "@playwright/test";
const endpoint = "https://kalkulate-test.invalid/rest/v1/calculations*";
const row = {
  id: "00000000-0000-4000-8000-000000000001",
  expression: "4 + 5",
  result: "9",
  created_at: "2026-09-28T12:00:00Z",
};
test("loads, saves, and reloads shared history; confirms and clears remotely", async ({
  page,
}) => {
  const rows = [row];
  const methods: string[] = [];
  await page.route(endpoint, async (route) => {
    const request = route.request();
    methods.push(request.method());
    if (request.method() === "POST") {
      expect(request.postDataJSON()).toEqual({
        expression: "2 + 3",
        result: "5",
      });
      rows.unshift({
        ...row,
        id: "00000000-0000-4000-8000-000000000002",
        expression: "2 + 3",
        result: "5",
        created_at: "2026-09-28T13:00:00Z",
      });
      await route.fulfill({ status: 201, body: "" });
    } else if (request.method() === "DELETE") {
      rows.splice(0);
      await route.fulfill({ status: 204, body: "" });
    } else {
      const url = new URL(request.url());
      expect(url.searchParams.get("limit")).toBe("10");
      expect(url.searchParams.get("order")).toBe("created_at.desc,id.desc");
      await route.fulfill({ json: rows });
    }
  });
  await page.goto("/");
  await expect(page.locator(".record-result").first()).toHaveText("9");
  await expect(page.getByRole("button", { name: "Clear history" }).first()).toBeEnabled();
  await page.keyboard.type("2+3=");
  await expect(page.locator(".record-result").first()).toHaveText("5");
  await page.reload();
  await expect(page.locator(".record-result").first()).toHaveText("5");
  await expect(page.getByText("Public · saved to Supabase")).toBeVisible();
  expect(methods.filter((method) => method === "POST")).toHaveLength(1);
  expect(methods.every((method) => method === "GET" || method === "POST")).toBe(
    true,
  );
  await page.getByRole("button", { name: "Clear history" }).first().click();
  await expect(page.getByRole("dialog")).toContainText("Clear calculation history?");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator(".record-result").first()).toHaveText("5");
  await page.getByRole("button", { name: "Clear history" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Clear history" }).click();
  await expect(page.getByText("A clean slate.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Clear history" }).first()).toBeDisabled();
  expect(methods).toContain("DELETE");
});
test("loading and network failure leave calculator usable", async ({
  page,
}) => {
  let release!: () => void;
  const blocked = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(endpoint, async (route) => {
    await blocked;
    await route.abort("failed");
  });
  await page.goto("/");
  await expect(page.getByText("Loading history…")).toBeVisible();
  await page.keyboard.type("8*8=");
  await expect(page.getByLabel("Calculator display")).toHaveText("64");
  release();
  await expect(
    page.getByText("History offline", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".record-result").first()).toHaveText("64");
});
test("failed saves retain local results and safe text rendering", async ({
  page,
}) => {
  const injected = "<img src=x onerror=alert(1)>";
  await page.route(endpoint, (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 503,
          json: { message: "internal error must stay private" },
        })
      : route.fulfill({ json: [{ ...row, expression: injected }] }),
  );
  await page.goto("/");
  await expect(page.locator(".record-expression")).toContainText(injected);
  await expect(page.locator(".history img")).toHaveCount(0);
  await page.keyboard.type("7+2=");
  await expect(page.locator(".record-result").first()).toHaveText("9");
  await expect(
    page.getByText("History offline", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("internal error must stay private")).toHaveCount(
    0,
  );
  await page.keyboard.press("Escape");
  await page.keyboard.type("9*9=");
  await expect(page.getByLabel("Calculator display")).toHaveText("81");
  await expect(page.locator(".record-result").first()).toHaveText("81");
});

test("failed delete keeps history visible and calculator usable", async ({ page }) => {
  await page.route(endpoint, async (route) => {
    if (route.request().method() === "DELETE") {
      await route.fulfill({ status: 503, json: { message: "private detail" } });
      return;
    }
    await route.fulfill({ json: [row] });
  });
  await page.goto("/");
  await expect(page.locator(".record-result").first()).toHaveText("9");
  await page.getByRole("button", { name: "Clear history" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Clear history" }).click();
  await expect(page.locator(".record-result").first()).toHaveText("9");
  await expect(page.getByText("History could not be updated. You can keep calculating.")).toBeVisible();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.type("6*7=");
  await expect(page.getByLabel("Calculator display")).toHaveText("42");
});
