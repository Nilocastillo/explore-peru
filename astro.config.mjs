// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://exploreperu.com',
  vite: {
    plugins: [tailwindcss()]
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
