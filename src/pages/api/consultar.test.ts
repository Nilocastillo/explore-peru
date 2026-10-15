import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./consultar";

describe("POST /api/consultar", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Limpiamos mocks antes de cada test
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const createRequest = (body: unknown): Request => {
    return new Request("http://localhost:4321/api/consultar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  };

  it("debe fallar con 400 si el JSON no es válido", async () => {
    const request = createRequest("not-a-json");
    const response = await POST({ request, locals: {} } as any);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("La solicitud no tiene un formato válido.");
  });

  it("debe retornar 200 (honeypot) si el campo company está lleno", async () => {
    const request = createRequest({
      name: "Juan Perez",
      phone: "999888777",
      company: "SpamBot Inc", // honeypot
    });
    
    const response = await POST({ request, locals: {} } as any);
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("debe fallar con 400 si falta el nombre o el celular", async () => {
    const requestMissingPhone = createRequest({
      name: "Juan Perez",
      // phone faltante
    });
    const response1 = await POST({ request: requestMissingPhone, locals: {} } as any);
    expect(response1.status).toBe(400);
    expect(await response1.json()).toEqual({
      message: "Completa nombre y WhatsApp para enviar la consulta.",
    });

    const requestMissingName = createRequest({
      phone: "999888777",
      // name faltante
    });
    const response2 = await POST({ request: requestMissingName, locals: {} } as any);
    expect(response2.status).toBe(400);
    expect(await response2.json()).toEqual({
      message: "Completa nombre y WhatsApp para enviar la consulta.",
    });
  });

  it("debe fallar con 400 si el email tiene un formato inválido", async () => {
    const request = createRequest({
      name: "Juan Perez",
      phone: "999888777",
      email: "correo-invalido",
    });
    
    const response = await POST({ request, locals: {} } as any);
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.message).toBe("Ingresa un correo electrónico válido.");
  });

  it("returns English validation messages for an English inquiry", async () => {
    const request = createRequest({ locale: "en", name: "Alex" });
    const response = await POST({ request, locals: {} } as any);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: "Enter your name and WhatsApp number to send your inquiry.",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns an English error for malformed JSON when English is requested", async () => {
    const request = new Request("http://localhost:4321/api/consultar", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept-Language": "en" },
      body: "not-json",
    });
    const response = await POST({ request, locals: {} } as any);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "The request format is invalid." });
  });

  it("sends English inquiry details without changing the tour or traveler information", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as Response);
    const request = createRequest({
      locale: "en", name: "Alex Smith", phone: "+44 7700900123", tour: "Humantay Lake",
      duration: "1 day", travelers: "2", message: "Please check availability.",
    });
    const response = await POST({
      request, locals: { runtime: { env: { RESEND_API_KEY: "test-key" } } },
    } as any);
    expect(response.status).toBe(200);
    const [, options] = vi.mocked(global.fetch).mock.calls[0];
    const payload = JSON.parse(options?.body as string);
    expect(payload.subject).toBe("New inquiry: Humantay Lake");
    expect(payload.text).toContain("Name: Alex Smith");
    expect(payload.text).toContain("Duration: 1 day");
    expect(payload.text).toContain("Travelers: 2");
    expect(payload.html).toContain("New website inquiry");
  });

  it("debe fallar con 500 si RESEND_API_KEY no está configurada", async () => {
    const request = createRequest({
      name: "Juan Perez",
      phone: "999888777",
      email: "juan@perez.com",
    });

    // Simulamos que no hay API Key configurada
    const response = await POST({
      request,
      locals: {
        runtime: {
          env: {}, // sin RESEND_API_KEY
        },
      },
    } as any);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.message).toBe("El envío de correos aún no está configurado.");
  });

  it("debe enviar el mail con éxito usando Resend y retornar 200", async () => {
    const request = createRequest({
      name: "Juan Perez",
      phone: "999888777",
      email: "juan@perez.com",
      tour: "Machu Picchu Mágico",
      message: "Hola, quiero cotizar.",
    });

    // Mockeamos la respuesta exitosa de Resend
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: "email-id-123" }),
    } as Response);

    const response = await POST({
      request,
      locals: {
        runtime: {
          env: {
            RESEND_API_KEY: "re_mock_api_key_12345",
            RESEND_TO_EMAIL: "admin@exploreperu.com",
          },
        },
      },
    } as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.ok).toBe(true);

    // Verificamos que se llamó a la API de Resend
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = vi.mocked(global.fetch).mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(options?.method).toBe("POST");
    
    const requestBody = JSON.parse(options?.body as string);
    expect(requestBody.to).toBe("admin@exploreperu.com");
    expect(requestBody.subject).toContain("Nueva consulta: Machu Picchu Mágico");
    expect(requestBody.text).toContain("Nombre: Juan Perez");
    expect(requestBody.text).toContain("WhatsApp: 999888777");
  });

  it("debe retornar 502 si Resend responde con error", async () => {
    const request = createRequest({
      name: "Juan Perez",
      phone: "999888777",
      email: "juan@perez.com",
    });

    // Mockeamos un error de Resend
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Bad Request" }),
    } as Response);

    const response = await POST({
      request,
      locals: {
        runtime: {
          env: {
            RESEND_API_KEY: "re_mock_api_key_12345",
          },
        },
      },
    } as any);

    expect(response.status).toBe(502);
    const data = await response.json();
    expect(data.message).toBe("No pudimos enviar la consulta. Intenta nuevamente.");
  });
});
