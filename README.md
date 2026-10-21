# Sociality frontend

Stage 1B provides application infrastructure (Redux store, TanStack Query client,
HTTP fetch boundary, configuration validation, and query infrastructure). The
root page reports this status while preserving the neutral scaffold presentation.
It makes no product-feature, authentication, or Figma-fidelity acceptance claim.

## Requirements and setup

Use Node.js 26.8.1 or later in major 26 and npm 12.0.2 or later in major 12.
These are the installed versions used for verification; package engines are
checked against the selected tooling. Use npm and the single `package-lock.json`.

```sh
npm ci
npm run dev -- --hostname 127.0.0.1
```

Open <http://127.0.0.1:3000>.

### Environment configuration

Stage 1B introduces `NEXT_PUBLIC_API_BASE_URL` in `.env.example`:

- Must be an HTTP or HTTPS root origin (e.g. `https://be-social-media-api-production.up.railway.app` or `http://localhost:3000`).
- Trailing slash at root is normalized automatically.
- Unsupported schemes, user credentials, non-root paths (including `/api`), query strings, and fragments are strictly rejected without echoing sensitive inputs.
- URL joining constrains request targets to approved `/api/...` endpoints and rejects path traversal or scheme escapes.
- Never add credentials, private keys, or tokens to public environment variables.

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
Testing Library, and jest-dom against co-located unit tests and the scaffold page.
The build runs `next build`; it is independent of lint and tests. Next.js
regenerates the ignored `next-env.d.ts` and `.next` type metadata when needed.

For browser smoke, start the built app on loopback (127.0.0.1) and check the root
heading, desktop/mobile rendering, horizontal overflow, console errors, failed
assets, and network traffic. Ensure no unexpected external network requests are
emitted. Keep temporary screenshots, browser reports, and logs outside authored
source.

## Completed in Stage 1B

- **Composed Providers (`src/providers/app-providers.tsx`)**: Composes Redux and
  TanStack Query providers into a small client boundary while preserving
  `src/app/layout.tsx` as a Server Component.
- **Redux Infrastructure (`src/lib/store/`)**: Store factory (`makeStore`),
  derived `RootState`, `AppStore`, `AppDispatch` types, typed hooks
  (`useAppDispatch`, `useAppSelector`, `useAppStore`), and minimal non-persisted
  client UI state (`uiSlice` for navigation open/closed). Server records, tokens,
  and authentication state are explicitly excluded from Redux.
- **TanStack Query Infrastructure (`src/lib/query/`)**: `QueryClient` factory
  (`makeQueryClient`) and stable browser resolution (`getQueryClient`), isolated
  per-request execution on server, documented client defaults (`staleTime: 60s`,
  `gcTime: 5m`), mutation automatic retry disabled, and bounded query retries
  that strictly reject aborts and non-retryable HTTP client errors (400, 401,
  403, 404, 422).
- **HTTP Fetch & Error Boundary (`src/lib/api/`)**: `apiFetch` using native fetch
  with injectable transport for testing, typed error hierarchy (`ApiHttpError`,
  `ApiNetworkError`, `ApiAbortError`, `ApiDecodeError`), safe single-read body
  handling, explicit runtime schema/decoder support, and endpoint constraints
  restricted to `/api/...` on the validated base origin.
- **Query Keys & Parameters (`src/lib/query/`)**: Strict parameter normalization
  (`normalizePaginationParams`, `normalizeSearchParams`, `buildNormalizedQueryString`)
  guaranteeing key/URL equivalence, positive integer validation rejecting 0,
  floats, and invalid ranges, and isolated public/private namespaces with private
  keys requiring non-empty session identity and rejecting tokens.

## Not implemented

Stage 1C remains pending: design tokens, shared presentation components,
design-system library, and Figma implementation. The shadcn initialization
defaults are tooling support, not an approved product design system.

Stage 2+ remains pending: authentication, session persistence, profile /me,
feeds, social interactions, feature routes/forms, and backend live integration.

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
