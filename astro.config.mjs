// @ts-check
import { defineConfig, fontProviders, sessionDrivers } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),
  output: 'server',
  // La aplicación no usa sesiones. Este driver evita que el adaptador
  // aprovisione automáticamente un namespace KV SESSION innecesario.
  session: {
    driver: sessionDrivers.lruCache(),
  },
  site: 'https://explore-peru.ncastilloumeres.workers.dev',
  vite: {
    plugins: [/** @type {any} */ (tailwindcss())]
  },
  integrations: [mdx(), sitemap()],
  fonts: [
    {
      name: "Manrope",
      cssVariable: "--font-manrope",
      provider: fontProviders.fontsource(),
    },
  ],
});
