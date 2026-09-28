import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("keyboard, pointer, history and recovery work without credentials", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const display = page.getByLabel("Calculator display");
  await page.keyboard.type("0.1+0.2");
  await page.keyboard.press("Enter");
  await expect(display).toHaveText("0.3");
  await expect(page.locator(".history-list li")).toHaveCount(1);
  await page.keyboard.press("Escape");
  await page.keyboard.type("8/0=");
  await expect(display).toHaveText("Cannot divide by zero");
  await page.keyboard.type("9*9=");
  await expect(display).toHaveText("81");
  await page
    .getByRole("button", { name: "Clear calculator", exact: true })
    .click();
  await page.getByRole("button", { name: "7", exact: true }).click();
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("button", { name: "3", exact: true }).click();
  await page.getByRole("button", { name: "Equals", exact: true }).click();
  await expect(display).toHaveText("10");
  await page
    .getByRole("button", { name: "Clear history", exact: true })
    .click();
  await page.getByRole("dialog").getByRole("button", { name: "Clear history" }).click();
  await expect(page.getByText("A clean slate.")).toBeVisible();
  await page.getByRole("button", { name: "7", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(display).toHaveText("7");
  await page.reload();
  await expect(display).toHaveText("0");
  expect(errors).toEqual([]);
});
test("graph mode plots, manages, and resets multiple functions", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Graph" }).click();
  await expect(page.getByRole("region", { name: "Graph calculator" })).toBeVisible();
  const input = page.getByRole("textbox", { name: /Function/ });
  await expect(input).toHaveValue("y = x^2");
  await page.getByRole("button", { name: "Plot function" }).click();
  await input.fill("y = sin(x)");
  await page.getByRole("button", { name: "Plot function" }).click();
  await input.fill("y = 1/x");
  await page.getByRole("button", { name: "Plot function" }).click();
  await expect(page.getByRole("list").getByRole("listitem")).toHaveCount(3);
  await page.getByRole("button", { name: "Trace" }).click();
  await page.locator("#trace-x").fill("2");
  await expect(page.getByText("y(2.00) = 4")).toBeVisible();
  await expect(page.getByText("y(2.00) = 0.9093")).toBeVisible();
  await expect(page.getByTestId("trace-line")).toHaveCount(1);
  await expect(page.getByTestId("trace-point")).toHaveCount(3);
  await page.locator("#trace-x").fill("0");
  await expect(page.getByText("y(0.00) = undefined")).toBeVisible();
  await page.locator(".graph-window").click({ position: { x: 380, y: 240 } });
  await expect(page.getByRole("button", { name: "Trace" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /Hide y = x\^2/ }).click();
  await expect(page.getByRole("button", { name: /Show y = x\^2/ })).toBeVisible();
  await page.getByRole("button", { name: /Remove y = sin\(x\)/ }).click();
  await page.getByRole("button", { name: "Clear functions" }).click();
  await expect(page.getByText("No curves yet.")).toBeVisible();
  await page.getByRole("tab", { name: "Basic" }).click();
  await page.getByRole("button", { name: "7", exact: true }).click();
  await expect(page.getByLabel("Calculator display")).toHaveText("7");
});
for (const width of [320, 390, 1440]) {
  test(`accessible layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await page.keyboard.type("1234567890123456");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("button", { name: "Equals", exact: true }),
    ).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({
      path: `artifacts/kalkulate-${width}.png`,
      fullPage: true,
    });
  });
}
