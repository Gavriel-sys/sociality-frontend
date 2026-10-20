# Sociality frontend

Stage 1A provides a runnable scaffold and independent quality gates. The root
page reports this limited status. It makes no product-feature or Figma-fidelity
acceptance claim.

## Requirements and setup

Use Node.js 26.8.1 or later in major 26 and npm 12.0.2 or later in major 12.
These are the installed versions used for verification; package engines are
checked against the selected tooling. Use npm and the single `package-lock.json`.

```sh
npm ci
npm run dev -- --hostname 127.0.0.1
```

Open <http://127.0.0.1:3000>. No environment file is required for Stage 1A.
`.env.example` documents a proposed public API origin for Stage 1B; the scaffold
does not consume it or call the Sociality API. Never add credentials to public
environment variables.

For production locally, stop the development server before building:

```sh
npm run build
npm run start -- --hostname 127.0.0.1
```

Both server commands accept `--port` for a different local port. Do not run a
build and a development server concurrently against the same `.next` directory.

## Verification

Run each gate separately after `npm ci`:

```sh
npm run lint
npm run typecheck
npm run test
npm run build
```

Lint uses ESLint with zero warnings allowed. Typecheck runs
`tsc --noEmit --incremental false`. Tests run Vitest once with jsdom, React
Testing Library, and jest-dom against the actual scaffold page. The build runs
`next build`; it is independent of lint and tests. Next.js regenerates the
ignored `next-env.d.ts` and `.next` type metadata when needed.

For browser smoke, start the built app on loopback and check the root heading,
desktop/mobile rendering, horizontal overflow, console errors, failed assets,
and network traffic. A successful HTTP response alone is not browser proof.
Keep temporary screenshots, browser reports, and logs outside authored source.

## Completed in Stage 1A

- Next.js App Router, React, strict TypeScript, `src/`, and `@/*` imports.
- Tailwind CSS through PostCSS, ESLint, and independent quality scripts.
- shadcn/ui configuration, its class-name utility, and supporting neutral CSS.
- Required MVP libraries installed: Redux Toolkit, React Redux, TanStack Query,
  Zod, React Hook Form/resolvers, and Day.js.
- Minimal accessible scaffold-status page with a Server Component root layout.
- System-font fallback with no build-time font downloads or bundled font assets.

## Not implemented

Stage 1B remains pending: Redux store/provider, QueryClient/provider, API
transport, configuration validation, query keys, and query infrastructure.
Native `fetch` is the proposed transport for that stage.

Stage 1C remains pending: design tokens, shared presentation components,
design-system library, and Figma implementation. The shadcn initialization
defaults are tooling support, not an approved product design system.

Authentication, session persistence, profiles, feeds, social interactions,
feature routes/forms, and backend integration remain pending later stages.

The preserved files in `docs/` and `AGENTS.md` supply the project requirements.
No deployment or backend writes are part of this scaffold.

## Tooling decisions and known warnings

`create-next-app@16.4.2` generated the isolated starting scaffold. Tailwind uses
the PostCSS integration here instead of that generator's direct Turbopack
loader. `shadcn@4.22.1 init --base radix --preset nova` generated
`components.json` and the current `cn` re-export in `src/lib/utils.ts`.
Its Google font, unused component dependencies, animation imports, and unused
theme CSS were removed for this neutral scaffold. No UI components were added.

Resolvers 5.9.2 and React Hook Form 7 avoid the latest resolver's conflicting
optional Effect peers. No force or legacy-peer-deps flags are used.

ESLint 9 is end-of-life and npm reports its deprecation. It remains the latest
major supported by the declared peer range of Next's current React lint plugin.
The lint tooling also has a high-severity `braces` advisory
([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)),
propagated through five development packages. There is no published patched
`braces` release. Exposure is pattern processing in local lint tooling; this
scaffold does not accept user-supplied patterns. Do not apply npm's suggested
forced downgrade of `eslint-config-next`.

npm 12 reports that it blocks `unrs-resolver`'s optional native-binding
postinstall fallback by default. The Windows native binding is supplied as an
optional dependency; verification checks the resulting installed tree without
approving extra install scripts.
