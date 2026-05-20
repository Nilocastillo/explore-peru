import { test, expect } from "@playwright/test";

test.describe("Página de inicio (Home)", () => {
  test.beforeEach(async ({ page }) => {
    // Visitamos la página de inicio
    await page.goto("/");
  });

  test("debe cargar la página con el título y SEO correctos", async ({ page }) => {
    // Validamos el título de la página
    await expect(page).toHaveTitle(/XPLORE PERÚ/);

    // Validamos la etiqueta meta description
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description).toContain("experiencias auténticas por Perú");

    // Validamos idioma del documento
    const htmlLang = await page.locator("html").getAttribute("lang");
    expect(htmlLang).toBe("es");
  });

  test("debe mostrar los elementos de navegación principales en la cabecera", async ({ page }) => {
    // El header debe existir y ser visible
    const header = page.locator("header.fixed");
    await expect(header).toBeVisible();

    // Verificamos enlaces clave en el menú de navegación
    const navLinks = header.locator("a");
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test("debe incluir secciones clave en la página", async ({ page }) => {
    // Verificar skip link para accesibilidad
    const skipLink = page.locator(".skip-link");
    await expect(skipLink).toBeAttached();
    expect(await skipLink.innerText()).toBe("Saltar al contenido principal");

    // Verificar el contenedor de contenido principal
    const main = page.locator("main#main-content");
    await expect(main).toBeVisible();

    // Verificar el pie de página
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
  });
});
