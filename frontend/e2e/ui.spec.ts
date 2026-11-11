import { test, expect, type Page } from "@playwright/test";

// Test-only Wails HTTP boundary. No live game, accounts, or credentials are used.
async function mockDesktop(page: Page, signedIn = true, serverNews: unknown[] = []) {
  await page.addInitScript(() => {
    localStorage.setItem("i18nextLng", "ja");
    localStorage.setItem(
      "setting-storage",
      JSON.stringify({
        version: 1,
        state: {
          locale: "ja",
          gamePath: "C:/Games/StarRail.exe",
          gameDir: "C:/Games",
          serverTarget: "hoyotoon",
          gameProfile: "starrail",
        },
      }),
    );
  });
  await page.route("**/wails/custom.js", (route) =>
    route.fulfill({ status: 404, body: "" }),
  );
  await page.route("**/wails/runtime**", (route) => {
    const url = new URL(route.request().url());
    const body =
      route.request().method() === "POST"
        ? route.request().postDataJSON()
        : {
            object: Number(url.searchParams.get("object")),
            args: JSON.parse(url.searchParams.get("args") || "{}"),
          };
    let result: unknown = null;
    if (body.object === 0) {
      const results: Record<number, unknown> = {
        941664977: [
          signedIn,
          { id: "test", name: "Test Player", image: "", role: "user" },
          "",
        ],
        2767927275: [true, "1.1.2"],
        391023589: [true, "1.1.2", ""],
        607772389: true,
        160707185: true,
        3297030196: true,
        3670222014: [true, serverNews, ""],
        1638005996: [true, [], ""],
        3317106280: "https://register.bassaps.com",
      };
      result = results[body.args.methodID] ?? [
        false,
        "Test-only boundary: method not mocked",
      ];
    }
    return route.fulfill({ json: result });
  });
}

test("server news shows published portal content and opens the portal article", async ({ page }) => {
  const article = "https://register.bassaps.com/announcements#portal-test";
  await mockDesktop(page, true, [{
    id: "portal-test", title: "ポータル配信テスト", intro: "サーバーの公開お知らせ本文",
    image: "", url: article, time: "2026-11-12", timestamp: 1794409200, type: "notice", pinned: true,
  }]);
  let opened: unknown = null;
  await page.route("**/wails/runtime**", route => {
    const url = new URL(route.request().url());
    const body = route.request().method() === "POST" ? route.request().postDataJSON() : {
      args: JSON.parse(url.searchParams.get("args") || "{}"),
    };
    if (body.args.methodID !== 1132232877) return route.fallback();
    opened = body.args.args[0];
    return route.fulfill({ json: [true, ""] });
  });
  await page.goto("/news");
  await page.getByRole("button", { name: "サーバー", exact: true }).click();
  await expect(page.getByText("サーバーの公開お知らせ本文")).toBeVisible();
  await page.getByRole("heading", { name: "ポータル配信テスト" }).click();
  await expect.poll(() => opened).toBe(article);
  await page.getByRole("button", { name: "更新", exact: true }).click();
  await expect(page.getByRole("heading", { name: "ポータル配信テスト" })).toBeVisible();
});

for (const theme of ["light", "dark"] as const) {
  for (const width of [320, 768, 1280, 1920]) {
    test(`${theme}: ${width}px, library and drawer remain usable`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await mockDesktop(page);
      await page.goto("/");
      await expect(
        page.getByRole("heading", { name: "ライブラリ", exact: true }),
      ).toBeVisible();
      await page.getByLabel("カラーテーマ").selectOption(theme);
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        theme === "dark" ? "bassaps" : "bassaps-light",
      );
      const overflow = await page.evaluate(() =>
        Array.from(document.querySelectorAll("body *"))
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return (
              r.width > 0 &&
              r.right > innerWidth + 1 &&
              getComputedStyle(el).position !== "fixed"
            );
          })
          .map((el) => ({
            tag: el.tagName,
            class: el.className,
            right: el.getBoundingClientRect().right,
          }))
          .slice(0, 10),
      );
      expect(overflow).toEqual([]);
      await expect(page.locator(".bassaps-game-card")).toBeVisible();
      await expect(
        page.getByRole("link", { name: /管理者コンソール/ }),
      ).toHaveCount(0);
      if (width < 760) {
        await page.getByRole("button", { name: "メニューを開く" }).click();
        await expect(
          page.getByRole("dialog", { name: "ナビゲーション" }),
        ).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(
          page.getByRole("button", { name: "メニューを開く" }),
        ).toBeFocused();
      }
      if (width === 1280 || width === 320)
        await page.screenshot({
          path: `test-results/library-${theme}-${width}.png`,
          fullPage: true,
          animations: "disabled",
        });
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute(
        "data-theme",
        theme === "dark" ? "bassaps" : "bassaps-light",
      );
    });
  }
}

test("ordinary user cannot open console and all existing routes render on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await mockDesktop(page);
  for (const path of [
    "/howto",
    "/language",
    "/diff",
    "/analysis",
    "/srtools",
    "/news",
    "/about",
    "/console",
  ]) {
    const errors: string[] = [];
    const onError = (error: Error) => errors.push(error.message);
    page.on("pageerror", onError);
    await page.goto(path);
    await expect(page.locator("#main-content")).toBeVisible();
    await expect(page.locator("#main-content")).not.toBeEmpty();
    if (path === "/console")
      await expect(
        page.getByText("この機能を利用する権限がありません。"),
      ).toBeVisible();
    await page.waitForTimeout(350);
    expect(errors, path).toEqual([]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      path,
    ).toBeLessThanOrEqual(320);
    page.off("pageerror", onError);
  }
});

test("reduced motion, signed-out license and theme remain accessible", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await mockDesktop(page, false);
  await page.goto("/");
  const gate = page.locator(".bassaps-gate");
  await expect(gate).toBeVisible();
  await gate.getByLabel("カラーテーマ").selectOption("light");
  await gate.getByRole("button", { name: /Based on Cyrene Launcher/ }).click();
  const dialog = page.getByRole("dialog", { name: "クレジット・ライセンス" });
  await expect(dialog).toContainText("Copyright (c) 2025 Firefly Shelter");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    gate.getByRole("button", { name: /Based on Cyrene Launcher/ }),
  ).toBeFocused();
});

test("settings and exit dialogs trap focus, close on Escape and restore focus", async ({
  page,
}) => {
  await mockDesktop(page);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "ライブラリ", exact: true }),
  ).toBeVisible();
  for (const name of ["設定", "閉じる"]) {
    const trigger = page.getByRole("button", { name, exact: true }).first();
    await trigger.click();
    const dialog = page.locator("dialog.bassaps-modal-frame[open]");
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Shift+Tab");
    expect(
      await dialog.evaluate((el) => el.contains(document.activeElement)),
    ).toBe(true);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
});

test("optimized cover falls back to the existing JPEG if WebP is unavailable", async ({
  page,
}) => {
  await mockDesktop(page);
  await page.route("**/bg-17-*.webp", (route) => route.abort());
  await page.goto("/");
  const cover = page.locator(".bassaps-game-cover > img");
  await expect(cover).toHaveAttribute("src", "/bg-17.jpg");
  await expect
    .poll(() => cover.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);
});
