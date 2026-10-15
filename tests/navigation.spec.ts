import { expect, test, type Locator } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 }, contextOptions: { reducedMotion: "reduce" } });

const languages = [
  {
    locale: "es",
    flag: "🇪🇸",
    home: "/",
    navLabels: ["Machu Picchu", "Tradicionales", "Aventura", "Paquetes", "Full Day", "Código ESNNA"],
    navPaths: ["/machu-picchu/", "/tradicional/", "/aventura/", "/paquetes/", "/full-day/", "/codigo-esnna/"],
    traditional: "/tradicional/",
    adventure: "/aventura/",
    contact: "/consultar/",
    detail: "/tours/laguna-humantay/",
    otherDetail: "/en/tours/humantay-lake/",
    otherLocale: "en",
    traditionalLabel: "Tradicionales",
    adventureLabel: "Aventura",
    contactLabel: "Contáctanos",
    chooseLanguage: "Elegir idioma",
    currentLanguage: "Leer esta página en español",
    otherLanguage: "Leer esta página en inglés",
    lastLanguage: "Leer esta página en inglés",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    menu: "Menú principal",
    logo: "Logotipo Agencia de Viajes XPLORE PERÚ",
    explore: "Explorar tours",
    packages: "Ver paquetes",
    packagesPath: "/paquetes/",
    headline: /Tours en Cusco\s+y Machu Picchu/,
    submit: "Solicitar información",
  },
  {
    locale: "en",
    flag: "🇺🇸",
    home: "/en/",
    navLabels: ["Machu Picchu", "Traditional Tours", "Adventure", "Packages", "Full Day", "Child Protection"],
    navPaths: ["/en/machu-picchu/", "/en/traditional/", "/en/adventure/", "/en/packages/", "/en/full-day/", "/en/child-protection-code/"],
    traditional: "/en/traditional/",
    adventure: "/en/adventure/",
    contact: "/en/contact/",
    detail: "/en/tours/humantay-lake/",
    otherDetail: "/tours/laguna-humantay/",
    otherLocale: "es",
    traditionalLabel: "Traditional Tours",
    adventureLabel: "Adventure",
    contactLabel: "Contact us",
    chooseLanguage: "Choose language",
    currentLanguage: "Read this page in English",
    otherLanguage: "Read this page in Spanish",
    lastLanguage: "Read this page in English",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    menu: "Main menu",
    logo: "XPLORE PERÚ travel agency logo",
    explore: "Explore tours",
    packages: "View packages",
    packagesPath: "/en/packages/",
    headline: /Cusco tours\s+& Machu Picchu/,
    submit: "Request information",
  },
] as const;

async function backgroundOpacity(header: Locator) {
  return header.evaluate((element) => {
    const color = getComputedStyle(element).backgroundColor;
    const components = color.match(/[\d.]+/g)?.map(Number) ?? [];
    return components.length === 4 ? components[3] : 1;
  });
}

for (const copy of languages) {
  test.describe(`${copy.locale.toUpperCase()} header and hero`, () => {
    test("home header becomes opaque on scroll and interior pages start opaque", async ({ page }) => {
      await page.goto(copy.home);
      const header = page.locator("header.site-header");
      await expect(header).toBeVisible();
      await expect.poll(() => backgroundOpacity(header)).toBe(0);

      await page.evaluate(() => window.scrollTo({ top: 420, behavior: "instant" }));
      await expect.poll(() => backgroundOpacity(header)).toBeGreaterThan(0.9);
      await expect(header).toBeInViewport();

      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await expect.poll(() => backgroundOpacity(header)).toBe(0);

      await page.goto(copy.contact);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      await expect.poll(() => backgroundOpacity(page.locator("header.site-header"))).toBeGreaterThan(0.9);
      await expect(page.locator("html")).toHaveAttribute("lang", copy.locale);
    });

    test("desktop menu preserves category order and language controls support keyboard and Escape", async ({ page, browserName }) => {
      await page.goto(copy.home);
      const header = page.locator("header.site-header");
      const navigation = header.locator(".desktop-nav").getByRole("link");
      await expect(navigation).toHaveText([...copy.navLabels]);
      for (const [index, path] of copy.navPaths.entries()) {
        await expect(navigation.nth(index)).toBeVisible();
        await expect(navigation.nth(index)).toHaveAttribute("href", path);
      }

      const language = header.locator(`summary[aria-label="${copy.chooseLanguage}"]`);
      const firstLanguage = header.locator('a[hreflang="es"]');
      await expect(language.locator(".language-flag")).toBeVisible();
      await expect(language.locator(".language-flag")).toHaveText(copy.flag);
      await language.focus();
      await language.press("Enter");
      await expect(firstLanguage).toBeVisible();
      await expect(firstLanguage.locator(".language-flag")).toBeVisible();
      await expect(firstLanguage.locator(".language-flag")).toHaveText("🇪🇸");
      // Safari on macOS uses Option+Tab to include links with its default keyboard settings.
      // https://support.apple.com/guide/safari/cpsh003/mac
      await page.keyboard.press(browserName === "webkit" && process.platform === "darwin" ? "Alt+Tab" : "Tab");
      await expect(firstLanguage).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(firstLanguage).toBeHidden();
      await expect(language).toBeFocused();

      await language.click();
      await expect(header.getByRole("link", { name: copy.currentLanguage, exact: true }))
        .toHaveAttribute("aria-current", "page");
      await expect(header.getByRole("link", { name: copy.otherLanguage, exact: true })).toBeVisible();
      await page.getByRole("heading", { level: 1 }).click();
      await expect(header.getByRole("link", { name: copy.otherLanguage, exact: true })).toBeHidden();

      await expect(header.getByRole("link", { name: copy.contactLabel, exact: true })).toHaveAttribute("href", copy.contact);
      await header.getByRole("link", { name: copy.traditionalLabel, exact: true }).click();
      await expect(page).toHaveURL((url) => url.pathname === copy.traditional);
      await expect(page.locator("html")).toHaveAttribute("lang", copy.locale);
      await expect(page.locator("header.site-header").getByRole("link", { name: copy.traditionalLabel, exact: true }))
        .toHaveAttribute("aria-current", "page");

      await page.locator("header.site-header").getByRole("link", { name: copy.contactLabel, exact: true }).click();
      await expect(page).toHaveURL((url) => url.pathname === copy.contact);
      await expect(page.getByRole("button", { name: copy.submit, exact: true })).toBeVisible();
    });

    test("mobile drawer traps focus, locks background scrolling and restores focus on Escape", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(copy.home);
      await page.evaluate(() => window.scrollTo({ top: 260, behavior: "instant" }));
      const initialScroll = await page.evaluate(() => window.scrollY);
      const initialOverflow = await page.locator("body").evaluate((body) => body.style.overflow);
      const launcher = page.locator("#mobile-menu-btn");
      await expect(launcher).toHaveAccessibleName(copy.openMenu);
      await launcher.click();

      const menu = page.getByRole("dialog", { name: copy.menu, exact: true });
      await expect(menu).toBeVisible();
      await expect(menu).toHaveAttribute("aria-modal", "true");
      await expect(launcher).toHaveAttribute("aria-expanded", "true");
      await expect(menu.getByRole("button", { name: copy.closeMenu, exact: true })).toBeFocused();
      await expect(page.locator("main")).toHaveAttribute("inert", "");
      await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
      const navigation = menu.locator("nav").getByRole("link");
      await expect(navigation).toHaveText([...copy.navLabels]);
      for (const [index, path] of copy.navPaths.entries()) {
        await expect(navigation.nth(index)).toHaveAttribute("href", path);
      }
      await expect(menu.getByRole("link", { name: copy.contactLabel, exact: true })).toHaveAttribute("href", copy.contact);
      const currentLanguage = menu.getByRole("link", { name: copy.currentLanguage, exact: true });
      await expect(currentLanguage.locator(".language-flag")).toBeVisible();
      await expect(currentLanguage.locator(".language-flag")).toHaveText(copy.flag);

      const firstLink = menu.getByRole("link", { name: copy.logo, exact: true });
      const lastLink = menu.getByRole("link", { name: copy.lastLanguage, exact: true });
      await lastLink.focus();
      await page.keyboard.press("Tab");
      await expect(firstLink).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(lastLink).toBeFocused();
      expect(await page.evaluate(() => window.scrollY)).toBe(initialScroll);

      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
      await expect(launcher).toHaveAttribute("aria-expanded", "false");
      await expect(launcher).toBeFocused();
      await expect(page.locator("main")).not.toHaveAttribute("inert");
      expect(await page.locator("body").evaluate((body) => body.style.overflow)).toBe(initialOverflow);
      expect(await page.evaluate(() => window.scrollY)).toBe(initialScroll);

      await launcher.click();
      await menu.getByRole("link", { name: copy.adventureLabel, exact: true }).click();
      await expect(page).toHaveURL((url) => url.pathname === copy.adventure);
      await expect(page.locator("html")).toHaveAttribute("lang", copy.locale);
    });

    test("mobile language links retain the equivalent tour, query and itinerary anchor", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      const suffix = "?travelers=2#recommendations";
      await page.goto(`${copy.detail}${suffix}`);
      await page.getByRole("button", { name: copy.openMenu, exact: true }).click();
      const menu = page.getByRole("dialog", { name: copy.menu, exact: true });
      const otherLanguage = menu.getByRole("link", { name: copy.otherLanguage, exact: true });
      await expect(otherLanguage).toHaveAttribute("href", `${copy.otherDetail}${suffix}`);
      await otherLanguage.click();
      await expect(page).toHaveURL((url) => url.pathname + url.search + url.hash === `${copy.otherDetail}${suffix}`);
      await expect(page.locator("html")).toHaveAttribute("lang", copy.otherLocale);
      await expect(page.locator("#recommendations")).toBeInViewport();
    });

    test("compact desktop hero presents Cusco tours and links to localized packages", async ({ page }) => {
      await page.goto(copy.home);
      const hero = page.locator("[data-home-hero]");
      await expect(hero.getByRole("heading", { level: 1 })).toHaveText(copy.headline);
      const heroHeight = await hero.evaluate((element) => element.getBoundingClientRect().height);
      expect(heroHeight).toBeLessThan(page.viewportSize()!.height);
      const explore = hero.getByRole("link", { name: copy.explore, exact: true });
      const packages = hero.getByRole("link", { name: copy.packages, exact: true });
      await expect(explore).toHaveAttribute("href", "#tours");
      await expect(packages).toHaveAttribute("href", copy.packagesPath);
      await explore.click();
      await expect(page).toHaveURL((url) => url.pathname === copy.home && url.hash === "#tours");
      await expect(page.locator("#tours")).toBeInViewport();

      await page.goto(copy.home);
      await packages.click();
      await expect(page).toHaveURL((url) => url.pathname === copy.packagesPath);
      await expect(page.locator("html")).toHaveAttribute("lang", copy.locale);
      await expect(page.locator("main article")).not.toHaveCount(0);
    });
  });
}
