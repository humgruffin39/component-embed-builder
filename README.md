# Component Embed Builder

Discord will show a custom card instead of the usual link preview if your page
serves a component embed. Make it yours with this builder!

https://embed.hugh.dev

## Run it

```bash
pnpm install
pnpm dev
```

```bash
pnpm test
pnpm typecheck
pnpm lint
```

Set `NEXT_PUBLIC_SITE_URL` in production. Without it the absolute URLs in the
site's own embed point at the wrong host.

The code panel wants Berkeley Mono. It's licensed, so it isn't in the repo. Put
`BerkeleyMono-Regular.woff2` in `public/fonts/` if you have a copy, otherwise
you get the system mono stack.