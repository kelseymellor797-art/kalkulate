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
  await expect(page.getByText("A clean slate.")).toBeVisible();
  await page.getByRole("button", { name: "7", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(display).toHaveText("7");
  await page.reload();
  await expect(display).toHaveText("0");
  expect(errors).toEqual([]);
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
