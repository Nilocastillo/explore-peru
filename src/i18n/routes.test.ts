import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { getLocale, localizePath, tourSlugs } from "./routes";

const pagePairs = [
  ["/", "/en/"],
  ["/tours", "/en/tours"],
  ["/machu-picchu", "/en/machu-picchu"],
  ["/tradicional", "/en/traditional"],
  ["/aventura", "/en/adventure"],
  ["/paquetes", "/en/packages"],
  ["/full-day", "/en/full-day"],
  ["/consultar", "/en/contact"],
  ["/codigo-esnna", "/en/child-protection-code"],
  ["/politica-de-privacidad", "/en/privacy-policy"],
  ["/terminos-y-condiciones", "/en/terms-and-conditions"],
  ["/404", "/en/404"],
] as const;

describe("localized page URLs", () => {
  it.each(pagePairs)("maps %s to %s and back without adding duplicate prefixes", (es, en) => {
    expect(localizePath(es, "en")).toBe(`${en.replace(/\/$/, "")}/`);
    expect(localizePath(en, "es")).toBe(`${es.replace(/\/$/, "")}/`);
    expect(localizePath(en, "en")).toBe(`${en.replace(/\/$/, "")}/`);
    expect(localizePath(es, "es")).toBe(`${es.replace(/\/$/, "")}/`);
  });

  it.each(pagePairs)("accepts trailing slashes on %s and %s", (es, en) => {
    expect(localizePath(`${es.replace(/\/$/, "")}/`, "en")).toBe(`${en.replace(/\/$/, "")}/`);
    expect(localizePath(`${en.replace(/\/$/, "")}/`, "es")).toBe(`${es.replace(/\/$/, "")}/`);
  });

  it("preserves query parameters and fragments when changing page names", () => {
    const suffix = "?tour=Machu%20Picchu&travelers=2#inquiry";
    expect(localizePath(`/consultar${suffix}`, "en")).toBe(`/en/contact/${suffix}`);
    expect(localizePath(`/en/contact${suffix}`, "es")).toBe(`/consultar/${suffix}`);
    expect(localizePath("/#tours", "en")).toBe("/en/#tours");
    expect(localizePath("/en/#tours", "es")).toBe("/#tours");
  });
});

describe("localized tour URLs", () => {
  it("provides exactly 19 unique English counterparts backed by translated content", () => {
    const pairs = Object.entries(tourSlugs);
    expect(pairs).toHaveLength(19);
    expect(new Set(pairs.map(([, en]) => en)).size).toBe(19);

    for (const [es, en] of pairs) {
      const spanishFile = fileURLToPath(new URL(`../content/tours/${es}.mdx`, import.meta.url));
      const englishFile = fileURLToPath(new URL(`../content/tours-en/${en}.mdx`, import.meta.url));
      expect(existsSync(spanishFile), `Missing Spanish tour ${es}`).toBe(true);
      expect(existsSync(englishFile), `Missing English tour ${en}`).toBe(true);
    }
  });

  it.each(Object.entries(tourSlugs))("round-trips %s ↔ %s without changing locale twice", (es, en) => {
    const spanishPath = `/tours/${es}`;
    const englishPath = `/en/tours/${en}`;
    expect(localizePath(spanishPath, "en")).toBe(`${englishPath}/`);
    expect(localizePath(englishPath, "es")).toBe(`${spanishPath}/`);
    expect(localizePath(`${englishPath}/`, "en")).toBe(`${englishPath}/`);
    expect(localizePath(`${spanishPath}/`, "es")).toBe(`${spanishPath}/`);
  });

  it("retains booking parameters and itinerary anchors across both languages", () => {
    const suffix = "?travelers=2&source=home#itinerary";
    expect(localizePath(`/tours/laguna-humantay${suffix}`, "en"))
      .toBe(`/en/tours/humantay-lake/${suffix}`);
    expect(localizePath(`/en/tours/humantay-lake${suffix}`, "es"))
      .toBe(`/tours/laguna-humantay/${suffix}`);
  });
});

describe("locale detection and non-page links", () => {
  it.each(["/en", "/en/", "/en/contact", "/en/tours/humantay-lake"])("detects English only at the /en segment in %s", (path) => {
    expect(getLocale(path)).toBe("en");
  });

  it.each(["/", "/tours", "/english", "/enjoy", "/tours/en", "/en-contact"])("keeps %s in Spanish", (path) => {
    expect(getLocale(path)).toBe("es");
  });

  it.each([
    "https://api.whatsapp.com/send?phone=51986206531&text=Hello",
    "https://example.com/en/contact",
    "http://example.com/tours",
    "//cdn.example.com/image.avif",
    "mailto:info@example.com",
    "tel:+51974346252",
    "#itinerary",
    "?tour=Humantay",
    "/api/consultar",
    "/api/consultar?locale=en",
  ])("does not rewrite the non-page link %s", (path) => {
    expect(localizePath(path, "en")).toBe(path);
    expect(localizePath(path, "es")).toBe(path);
  });
});
