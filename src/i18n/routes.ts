export type Locale = "es" | "en";

const pagePaths: Record<string, string> = {
  "/": "/en/",
  "/tours": "/en/tours",
  "/machu-picchu": "/en/machu-picchu",
  "/tradicional": "/en/traditional",
  "/aventura": "/en/adventure",
  "/paquetes": "/en/packages",
  "/full-day": "/en/full-day",
  "/consultar": "/en/contact",
  "/codigo-esnna": "/en/child-protection-code",
  "/politica-de-privacidad": "/en/privacy-policy",
  "/terminos-y-condiciones": "/en/terms-and-conditions",
  "/404": "/en/404",
};

export const tourSlugs: Record<string, string> = {
  "7-lagunas-ausangate": "ausangate-7-lakes",
  "camino-inca-2-dias": "inca-trail-2-days",
  "camino-inca-4-dias": "inca-trail-4-days",
  "choquequirao-trek-4-dias": "choquequirao-trek-4-days",
  "city-tour-arequipa": "arequipa-city-tour",
  "city-tour-cusco": "cusco-city-tour",
  "city-tour-lima": "lima-city-tour",
  "glaciar-quelccaya-suyuparina-full-day": "quelccaya-suyuparina-glacier-full-day",
  "inca-jungle-a-machu-picchu-4-dias": "inca-jungle-machu-picchu-4-days",
  "laguna-humantay": "humantay-lake",
  "machu-picchu-2-dias": "machu-picchu-2-days",
  machupicchufullday: "machu-picchu-full-day",
  "maras-y-moray": "maras-moray",
  "montana-de-colores-vinicunca": "rainbow-mountain-vinicunca",
  "palcoyo-montana-de-colores": "palcoyo-rainbow-mountain",
  "salkantay-trek-machu-picchu-4-dias": "salkantay-trek-machu-picchu-4-days",
  "sobrevuelo-lineas-de-nazca": "nazca-lines-flight",
  "valle-sagrado-de-los-incas": "sacred-valley-of-the-incas",
  "valle-sur-cusco": "cusco-south-valley",
};

export function getLocale(pathname: string): Locale {
  return /^\/en(?:\/|$)/.test(pathname) ? "en" : "es";
}

const withTrailingSlash = (path: string) => `${path.replace(/\/+$/, "")}/`;

/** Link to the equivalent page, retaining query strings and fragment links. */
export function localizePath(path: string, locale: Locale): string {
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/api/")) return path;
  const [, rawPath, suffix] = path.match(/^([^?#]*)(.*)$/)!;
  const pathname = rawPath.replace(/\/+$/, "") || "/";
  const page = Object.entries(pagePaths).find(([es, en]) => es === pathname || en.replace(/\/+$/, "") === pathname);
  if (page) return withTrailingSlash(locale === "en" ? page[1] : page[0]) + suffix;

  const tour = pathname.match(/^(?:\/en)?\/tours\/([^/]+)$/);
  if (tour) {
    const slug = tour[1];
    const pair = Object.entries(tourSlugs).find(([es, en]) => es === slug || en === slug);
    return `${locale === "en" ? "/en" : ""}/tours/${pair ? pair[locale === "en" ? 1 : 0] : slug}/${suffix}`;
  }

  const unprefixed = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  return withTrailingSlash(`${locale === "en" ? "/en" : ""}${unprefixed}`) + suffix;
}
