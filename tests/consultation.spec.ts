import { test, expect } from "@playwright/test";

test.describe("Formulario de Consulta", () => {
  test.beforeEach(async ({ page }) => {
    // Visitamos la página de consulta
    await page.goto("/consultar");
  });

  test("debe mostrar todos los campos requeridos en el formulario", async ({ page }) => {
    // Verificar que el formulario esté presente
    const form = page.locator("form[data-consultation-form]");
    await expect(form).toBeVisible();

    // Verificar campos individuales
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('select[name="phoneCode"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="date"]')).toBeVisible();
    await expect(page.locator('input[name="travelers"]')).toBeVisible();
    await expect(page.locator('textarea[name="message"]')).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });

  test("debe enviar el formulario correctamente cuando la API responde con éxito", async ({ page }) => {
    // Interceptamos la llamada a /api/consultar
    await page.route("**/api/consultar", async (route) => {
      expect(route.request().method()).toBe("POST");
      const postData = route.request().postDataJSON();
      
      // Verificamos los datos que se envían al API
      expect(postData.name).toBe("Nilo Castillo");
      expect(postData.phone).toBe("+51 999888777");
      expect(postData.email).toBe("nilo@exploreperu.com");
      expect(postData.message).toBe("Hola, consulta de prueba.");

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    // Llenamos el formulario
    await page.fill('input[name="name"]', "Nilo Castillo");
    await page.selectOption('select[name="phoneCode"]', { value: "51" }); // Perú
    await page.fill('input[name="phone"]', "999888777");
    await page.fill('input[name="email"]', "nilo@exploreperu.com");
    await page.fill('textarea[name="message"]', "Hola, consulta de prueba.");

    // Enviamos el formulario
    const submitBtn = page.locator("button[data-submit-button]");
    await submitBtn.click();

    // Verificamos el estado y el mensaje de éxito en pantalla
    const statusMsg = page.locator("[data-form-status]");
    await expect(statusMsg).toBeVisible();
    await expect(statusMsg).toHaveText("Consulta enviada. Te responderemos pronto.");

    // El formulario debe haberse limpiado (reset)
    await expect(page.locator('input[name="name"]')).toHaveValue("");
    await expect(page.locator('input[name="phone"]')).toHaveValue("");
    await expect(page.locator('input[name="email"]')).toHaveValue("");
  });

  test("debe mostrar un mensaje de error si la API retorna un error de validación", async ({ page }) => {
    // Interceptamos y forzamos un error
    await page.route("**/api/consultar", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ message: "El formato del correo es inválido." }),
      });
    });

    // Llenamos el formulario
    await page.fill('input[name="name"]', "Nilo Castillo");
    await page.fill('input[name="phone"]', "999888777");
    await page.fill('input[name="email"]', "invalido@exploreperu.com");

    // Enviamos
    await page.locator("button[data-submit-button]").click();

    // Verificamos el error en el status div
    const statusMsg = page.locator("[data-form-status]");
    await expect(statusMsg).toBeVisible();
    await expect(statusMsg).toHaveText("El formato del correo es inválido.");
  });
});
