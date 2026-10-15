import { expect, test, type Page } from "@playwright/test";

test.use({ viewport: { width: 1440, height: 900 } });

async function fillEnglishInquiry(page: Page) {
  await page.getByRole("textbox", { name: "Full name", exact: true }).fill("Alex Traveler");
  await page.getByRole("combobox", { name: "Country calling code" }).selectOption("51");
  await page.getByRole("textbox", { name: "WhatsApp number", exact: true }).fill("999888777");
  await page.getByRole("textbox", { name: "Email address", exact: true }).fill("alex@example.com");
  await page.getByLabel("Preferred travel date").fill("2027-06-15");
  await page.getByRole("spinbutton", { name: "Travelers", exact: true }).fill("2");
  await page.getByRole("textbox", { name: "Message", exact: true }).fill("I would like to visit Humantay Lake.");
}

test.describe("English content and navigation", () => {
  test("home shows nine English tours with localized detail links", async ({ page }) => {
    await page.goto("/en/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page).toHaveTitle(/XPLORE PERÚ/);
    await expect(page.locator(".skip-link")).toHaveText("Skip to main content");

    const cards = page.locator("#tours article");
    await expect(cards).toHaveCount(9);
    await expect(cards.getByRole("link", { name: "View details", exact: true })).toHaveCount(9);
    const detailPaths = await cards.locator("h3 a").evaluateAll((links) =>
      links.map((link) => link.getAttribute("href")),
    );
    expect(new Set(detailPaths).size).toBe(9);
    expect(detailPaths.every((href) => href?.startsWith("/en/tours/") && href.endsWith("/"))).toBe(true);

    const whatsappLinks = await cards.locator('a[href^="https://api.whatsapp.com/"]').evaluateAll((links) =>
      links.map((link) => link.getAttribute("href")!),
    );
    expect(whatsappLinks).toHaveLength(9);
    for (const href of whatsappLinks) {
      const url = new URL(href);
      expect(url.searchParams.get("phone")).toBe("51986206531");
      expect(url.searchParams.get("text")).toMatch(/^Hello XPLORE PERÚ/);
    }
  });

  test("the complete English catalog has all 19 tours", async ({ page }) => {
    await page.goto("/en/tours");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    const cards = page.locator("main article");
    await expect(cards).toHaveCount(19);
    await expect(cards.getByRole("link", { name: "View details", exact: true })).toHaveCount(19);
    const detailPaths = await cards.locator("h3 a").evaluateAll((links) =>
      links.map((link) => link.getAttribute("href")),
    );
    expect(new Set(detailPaths).size).toBe(19);
    expect(detailPaths.every((href) => href?.startsWith("/en/tours/") && href.endsWith("/"))).toBe(true);
  });

  for (const [path, heading] of [
    ["/en/privacy-policy", "Privacy Policy"],
    ["/en/terms-and-conditions", "Terms and Conditions"],
    ["/en/child-protection-code", "Code to prevent child sexual exploitation"],
  ]) {
    test(`the legal page ${path} is fully rendered in English`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.locator("main h1")).toHaveText(heading);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://explore-peru.ncastilloumeres.workers.dev${path}/`);
      await expect(page.locator('link[hreflang="es"]')).toHaveCount(1);
      await page.setViewportSize({ width: 375, height: 812 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test("unknown English pages return a localized 404 and home link", async ({ page }) => {
    const response = await page.goto("/en/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("main h1")).toHaveText("Page not found");
    await expect(page.locator("main").getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/en/");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow");
  });

  test("only language switches use the client router and preserve the equivalent tour, query and anchor", async ({ page }) => {
    const suffix = "?travelers=2#recommendations";
    await page.goto(`/en/tours/humantay-lake/${suffix}`);
    await expect(page.getByRole("heading", { name: "Humantay Lake", level: 1 })).toHaveText("Humantay Lake");
    await page.evaluate(() => {
      (window as Window & { languageNavigationMarker?: string }).languageNavigationMarker = "desktop-language-round-trip";
    });

    const englishSelector = page.locator('header.site-header summary[aria-label="Choose language"]');
    await expect(englishSelector.locator(".language-flag")).toBeVisible();
    await expect(englishSelector.locator(".language-flag")).toHaveText("🇺🇸");
    await englishSelector.click();
    await expect(page.locator("header.site-header [data-language-link]")).toHaveCount(1);
    await expect(page.locator("header.site-header").getByRole("link", { name: "Read this page in English", exact: true }))
      .toHaveCount(0);
    await page.locator("header.site-header").getByRole("link", { name: "Read this page in Spanish", exact: true }).click();
    await expect(page).toHaveURL((url) => url.pathname + url.search + url.hash === `/tours/laguna-humantay/${suffix}`);
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await expect(page.getByRole("heading", { name: "Laguna Humantay", level: 1 })).toHaveText("Laguna Humantay");
    expect(await page.evaluate(() => (window as Window & { languageNavigationMarker?: string }).languageNavigationMarker))
      .toBe("desktop-language-round-trip");

    const spanishSelector = page.locator('header.site-header summary[aria-label="Elegir idioma"]');
    await expect(spanishSelector.locator(".language-flag")).toBeVisible();
    await expect(spanishSelector.locator(".language-flag")).toHaveText("🇪🇸");
    await spanishSelector.click();
    await expect(page.locator("header.site-header [data-language-link]")).toHaveCount(1);
    await expect(page.locator("header.site-header").getByRole("link", { name: "Leer esta página en español", exact: true }))
      .toHaveCount(0);
    await page.locator("header.site-header").getByRole("link", { name: "Leer esta página en inglés", exact: true }).click();
    await expect(page).toHaveURL((url) => url.pathname + url.search + url.hash === `/en/tours/humantay-lake/${suffix}`);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.getByRole("heading", { name: "Humantay Lake", level: 1 })).toHaveText("Humantay Lake");
    expect(await page.evaluate(() => (window as Window & { languageNavigationMarker?: string }).languageNavigationMarker))
      .toBe("desktop-language-round-trip");

    await page.locator("header.site-header").getByRole("link", { name: "Traditional Tours", exact: true }).click();
    await expect(page).toHaveURL((url) => url.pathname === "/en/traditional/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("main article")).not.toHaveCount(0);
    expect(await page.evaluate(() => (window as Window & { languageNavigationMarker?: string }).languageNavigationMarker))
      .toBeUndefined();
  });

  test("catalog, details, categories and contact navigation retain /en", async ({ page }) => {
    await page.goto("/en/");
    await page.locator("#tours").getByRole("link", { name: "View more packages", exact: true }).first().click();
    await expect(page).toHaveURL(/\/en\/tours\/$/);

    await page.locator("main article").getByRole("link", { name: "View details", exact: true }).first().click();
    await expect(page).toHaveURL(/\/en\/tours\/[^/?#]+\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.locator("header.site-header").getByRole("link", { name: "Traditional Tours", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/traditional\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");

    await page.locator("header.site-header").getByRole("link", { name: "Contact us", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/contact\/$/);
    await expect(page.getByRole("button", { name: "Request information", exact: true })).toBeVisible();
  });

  test("mobile menu opens, closes by keyboard and links to the English category", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/en/");
    const menuButton = page.locator("#mobile-menu-btn");
    const menu = page.getByRole("dialog", { name: "Main menu", exact: true });

    await menuButton.click();
    await expect(menuButton).toHaveAttribute("aria-expanded", "true");
    await expect(menu).not.toHaveAttribute("inert");
    await expect(menu.getByRole("link", { name: "Adventure", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");
    await expect(menuButton).toBeFocused();

    await menuButton.click();
    await menu.getByRole("link", { name: "Adventure", exact: true }).click();
    await expect(page).toHaveURL(/\/en\/adventure\/$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  for (const width of [375, 1280]) {
    test(`English home, detail and contact pages fit a ${width}px viewport`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ["/en/", "/en/tours/humantay-lake", "/en/contact"]) {
        await page.goto(path);
        await expect(page.locator("html")).toHaveAttribute("lang", "en");
        await page.evaluate(() => document.fonts.ready);
        const overflow = await page.evaluate(() =>
          Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth,
        );
        expect(overflow, `Horizontal overflow at ${path} (${width}px)`).toBeLessThanOrEqual(1);
      }
    });
  }
});

test.describe("English inquiry form", () => {
  test("forms initialize after repeated language switches and submit once per inquiry", async ({ page }) => {
    const receivedPayloads: Record<string, unknown>[] = [];
    await page.route("**/api/consultar/", async (route) => {
      receivedPayloads.push(route.request().postDataJSON());
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });

    await page.goto("/consultar/");
    await page.evaluate(() => {
      (window as Window & { languageNavigationMarker?: string }).languageNavigationMarker = "contact-language-round-trip";
    });

    for (const [index, locale] of ["en", "es", "en"].entries()) {
      const header = page.locator("header.site-header");
      await header.locator(".language-trigger").click();
      await header.locator(`[data-language-link][hreflang="${locale}"]`).click();
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      const form = page.locator("[data-consultation-form]");
      await expect(form).toHaveAttribute("data-bound", "true");
      await expect(form.locator('input[name="locale"]')).toHaveValue(locale);
      await expect(form.locator('input[name="name"]')).toHaveValue("");
      await expect(page.locator("[data-form-status]")).toBeEmpty();
      expect(await page.evaluate(() => (window as Window & { languageNavigationMarker?: string }).languageNavigationMarker))
        .toBe("contact-language-round-trip");

      if (locale === "en") {
        await fillEnglishInquiry(page);
      } else {
        await page.getByRole("textbox", { name: "Nombre completo", exact: true }).fill("Ana Viajera");
        await page.getByRole("textbox", { name: "Número de WhatsApp", exact: true }).fill("999888777");
      }
      await form.getByRole("button", { name: locale === "en" ? "Request information" : "Solicitar información", exact: true }).click();
      await expect(page.locator("[data-form-status]")).toHaveText(locale === "en"
        ? "Your inquiry has been sent. We will get back to you soon."
        : "Consulta enviada. Te responderemos pronto.");
      await expect.poll(() => receivedPayloads.length).toBe(index + 1);
      expect(receivedPayloads.at(-1)).toMatchObject({
        locale,
        name: locale === "en" ? "Alex Traveler" : "Ana Viajera",
        phone: "+51 999888777",
      });
    }
    expect(receivedPayloads.map((payload) => payload.locale)).toEqual(["en", "es", "en"]);
  });

  test("sends locale=en and shows English success without contacting the real API", async ({ page }) => {
    let receivedPayload: Record<string, unknown> | undefined;
    await page.route("**/api/consultar/", async (route) => {
      expect(route.request().method()).toBe("POST");
      expect(route.request().headers()["accept-language"]).toMatch(/^en(?:[-,;]|$)/);
      receivedPayload = route.request().postDataJSON();
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) });
    });

    await page.goto("/en/contact?tour=Humantay%20Lake");
    await fillEnglishInquiry(page);
    await page.getByRole("button", { name: "Request information", exact: true }).click();

    await expect(page.locator("[data-form-status]")).toHaveText("Your inquiry has been sent. We will get back to you soon.");
    expect(receivedPayload).toMatchObject({
      locale: "en",
      name: "Alex Traveler",
      phone: "+51 999888777",
      email: "alex@example.com",
      tour: "Humantay Lake",
      date: "2027-06-15",
      travelers: "2",
      message: "I would like to visit Humantay Lake.",
    });
    expect(receivedPayload).not.toHaveProperty("phoneCode");
    await expect(page.getByRole("textbox", { name: "Full name", exact: true })).toHaveValue("");
    await expect(page.getByRole("button", { name: "Request information", exact: true })).toBeEnabled();
  });

  test("shows the English API validation error and preserves the inquiry for correction", async ({ page }) => {
    await page.route("**/api/consultar/", async (route) => {
      expect(route.request().postDataJSON().locale).toBe("en");
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "Enter a valid email address." }),
      });
    });

    await page.goto("/en/contact");
    await fillEnglishInquiry(page);
    await page.getByRole("button", { name: "Request information", exact: true }).click();

    await expect(page.locator("[data-form-status]")).toHaveText("Enter a valid email address.");
    await expect(page.getByRole("textbox", { name: "Full name", exact: true })).toHaveValue("Alex Traveler");
    await expect(page.getByRole("button", { name: "Request information", exact: true })).toBeEnabled();
  });

  test("shows an English fallback when the API fails without a message", async ({ page }) => {
    await page.route("**/api/consultar/", (route) => route.fulfill({
      status: 502,
      contentType: "application/json",
      body: JSON.stringify({}),
    }));

    await page.goto("/en/contact");
    await fillEnglishInquiry(page);
    await page.getByRole("button", { name: "Request information", exact: true }).click();
    await expect(page.locator("[data-form-status]")).toHaveText("We could not send your inquiry. Please try again.");
  });
});
