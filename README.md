# XPLORE PERÚ

Travel website built with Astro, MDX and Tailwind CSS, deployed to Cloudflare Workers.

## Development

Use Node.js 22.12 or later and Bun.

```sh
bun install
bun run dev
```

Spanish is available at `/` and the complete English version at `/en/`. The language selector links to the equivalent page or tour.

## Content and routes

- `src/content/tours/`: Spanish tour content.
- `src/content/tours-en/`: English tour content, including itineraries and metadata.
- `src/i18n/routes.ts`: matching page URLs and tour slugs for both languages.
- `src/i18n/consultation.ts`: form labels, status messages and email translations.
- `src/components/tours/`: shared catalogue and detail templates.
- `src/pages/en/`: English home, categories, contact, policies and child protection code.

When changing a tour, update both content files and preserve the same services, schedules and booking conditions. When adding a tour, add its Spanish and English slugs to `tourSlugs` in `src/i18n/routes.ts`.

WhatsApp links use the number in `src/data/contact.ts`. The footer contact telephone is configured separately.

## Validation

```sh
bun run typecheck
bun run test:unit
bun run test:e2e
bun run build
```

End-to-end tests cover both languages, route matching, mobile navigation and inquiry forms. Email requests are mocked in browser tests.

## Cloudflare

The Worker name in `wrangler.jsonc` is `explore-peru`. For automatic deployments, connect this repository and its production branch in the Worker's **Settings → Build** panel. Use `bun run build` as the build command and `npx wrangler deploy` as the deploy command.

The build generates the Worker configuration in `dist/server/wrangler.json`. Edit the root configuration and source files; generated deployment files are recreated by Astro.
