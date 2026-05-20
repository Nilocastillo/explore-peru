// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),
  output: 'server',
  site: 'https://explore.ncastilloumeres.workers.dev',
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
