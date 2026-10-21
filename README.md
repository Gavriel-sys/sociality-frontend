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

## Completed in Stage 2C (Auth Guard, Route Protection & Logout Lifecycle)

- **Safe Return URL Utilities (`src/features/auth/redirect-utils.ts`)**:
  - `getSafeReturnUrl(target, fallback = "/me")`: validates internal relative destination paths against open redirect vulnerabilities.
  - Rejects external protocol schemes (`https://`, `http://`, `ftp://`), protocol-relative URLs (`//evil.com`), backslash bypasses (`/\evil.com`), executable pseudo-protocols (`javascript:`, `data:`), path traversal attempts (`/..`, `/../secret`, `/%2e%2e`), and control characters.
  - Returns validated internal path or the safe fallback (`/me`).
- **Logout Hook (`src/features/auth/use-logout.ts`)**:
  - `useLogout()` returns a coordinated `logout(redirectPath = "/login")` action (and `{ logout }` object property).
  - Strictly coordinates all three state layers to eliminate stale data leakage across accounts:
    1. Clears browser session storage (`clearSession()`).
    2. Dispatches `clearSession()` to Redux `authSlice`.
    3. Clears TanStack Query cache (`queryClient.clear()`).
    4. Navigates to `/login` via `router.push('/login')`.
- **Client Route Guards (`src/components/auth/`)**:
  - `AuthGuard` (`src/components/auth/auth-guard.tsx`): Guards private routes. Renders accessible `LoadingState` while auth status is `"idle"` (hydrating). Redirects unauthenticated users to `/login?returnTo=${encodeURIComponent(currentPath)}`. Renders protected children once authenticated.
  - `GuestGuard` (`src/components/auth/guest-guard.tsx`): Guards guest-only routes (`/login`, `/register`). Redirects already-authenticated users to `/me` (or sanitized `returnTo` parameter). Renders children when unauthenticated or idle.
- **Client Session Hydration (`src/providers/app-providers.tsx`)**:
  - `SessionHydrator` component executes on initial client mount inside Redux provider.
  - Reads stored credentials via `loadSession()`.
  - Dispatches `setSession(session)` when a valid session exists or `clearSession()` when no session exists, transitioning Redux auth status from `"idle"` to `"authenticated"` or `"unauthenticated"`.
- **Auth Page Integration (`src/app/(auth)/login/page.tsx` & `src/app/(auth)/register/page.tsx`)**:
  - Both `/login` and `/register` are wrapped with `GuestGuard`.
  - `/login` redirects to validated `returnTo` URL upon successful login completion.

## Completed in Stage 2B (Login & Register UI Pages)

- **Password Input Primitive (`src/features/auth/components/password-input.tsx`)**:
  - Reusable password input wrapping `Input` with an integrated toggle button inside the right side of the field.
  - Vector SVG icons (`Eye` and `EyeOff`) with accessible `aria-label="Show password"` / `"Hide password"`.
  - Accessible min 44x44px touch target for the toggle icon button.
  - Inline error/helper text handling with `aria-invalid` and `aria-describedby`.
- **Login Form (`src/features/auth/components/login-form.tsx`)**:
  - React Hook Form with `zodResolver(loginSchema)`.
  - Fields: Email (`type="email"`, placeholder `"name@example.com"`), Password (`PasswordInput`, placeholder `"Enter your password"`).
  - Form uses `noValidate` to eliminate browser tooltip collisions and surface custom accessible error states.
  - Server error display via top `Alert variant="danger"` banner.
  - Submit button with loading spinner and disabled state during submission.
- **Register Form (`src/features/auth/components/register-form.tsx`)**:
  - React Hook Form with `zodResolver(registerSchema)`.
  - Fields: Name (`placeholder="Enter your full name"`), Username (`placeholder="Enter your username"`, helper text `"Letters, numbers, underscores only"`), Email (`type="email"`), Password (`PasswordInput`, placeholder `"Min. 6 characters"`), Phone (`type="tel"`, placeholder `"e.g. 08123456789"`).
  - Corrects Figma placeholder issue (Name uses dedicated name placeholder, email is distinct).
  - Handles optional phone field conversion to `undefined` when blank.
  - Inline validation errors and top server error alert banner.
- **Auth Shell & Pages (`src/app/(auth)/`)**:
  - `layout.tsx`: Centered flexbox on `#000000` dark background, rendering child views inside responsive auth card container (`max-w-[345px]` mobile, `max-w-[446px]` desktop, `#0A0D12` background, `#1F242F` border, `rounded-2xl`).
  - `/login/page.tsx`: Brand mark & "Sociality" title, "Sign in" heading, subtitle, `LoginForm`, and switch link to `/register`.
  - `/register/page.tsx`: Brand mark & "Sociality" title, "Create an account" heading, subtitle, `RegisterForm`, and switch link to `/login`.
  - Safe demo submit handlers executing without external network requests.
- **Vector Icons (`src/components/ui/icons.tsx`)**:
  - Added `EyeIcon`, `EyeOffIcon`, `Eye`, `EyeOff` vector SVGs.

## Completed in Stage 2A (Auth Schemas, Session Storage & Token Boundary)

- **Zod Validation Schemas (`src/features/auth/schemas.ts`)**:
  - `loginSchema`: validates email (trimmed, valid email format) and password (minimum 6 characters).
  - `registerSchema`: validates name (minimum 1 character, trimmed), username (3-30 characters, alphanumeric and underscore regex `/^[a-zA-Z0-9_]+$/`), email (trimmed, valid format), password (minimum 6 characters), and optional phone (trimmed, converted to `undefined` if empty).
  - Inferred types: exports `LoginInput` and `RegisterInput`.
- **Client Session Storage Wrapper (`src/features/auth/session-storage.ts`)**:
  - Safe client-side `localStorage` wrapper guarding against SSR execution (`typeof window !== "undefined"`).
  - Provides `saveSession(data: SessionData): void`, `loadSession(): SessionData | null`, and `clearSession(): void`.
  - Resilience: gracefully handles private browsing mode, storage quota exceptions, and corrupted JSON without throwing.
  - Validates session integrity ensuring non-empty `token` and `sessionId`.
- **Redux Auth Slice (`src/features/auth/auth-slice.ts`)**:
  - State shape: `token: string | null`, `sessionId: string | null`, `user: AuthUser | null`, `status: "idle" | "authenticated" | "unauthenticated"`.
  - Actions: `setSession(payload: SessionData)` (updates credentials and sets status to `"authenticated"`), `clearSession()` (resets credentials to `null` and sets status to `"unauthenticated"`).
  - Registered in Redux store (`src/lib/store/store.ts`) under `auth`.
- **Authenticated Token Injection (`src/lib/api/api-fetch.ts`)**:
  - Extended `ApiFetchOptions` with optional `token?: string`.
  - Injects `Authorization: Bearer <token>` header when token is provided and non-empty.
  - Does not overwrite custom `Authorization` headers passed explicitly.
  - Never logs raw tokens in console or error messages.
  - Surfaces 401 Unauthorized responses cleanly via typed `ApiHttpError`.

## Completed in Stage 1C (Design System & Presentation Components)

- **Figma Design Tokens (`src/app/globals.css`)**:
  - Dark mode by default (`background: #000000`, `foreground: #FDFDFD`).
  - Dark card & surface colors (`surface: #0A0D12`, `surface-elevated: #141820`).
  - Brand palette: primary `#6936F2`, hover accent `#7F51F9`, destructive/danger `#B41759`.
  - Muted secondary text `#A4A7AE`, subtle dark borders `#1F242F`.
  - Spacing rhythm: 8, 12, 16, 24, 32, 48px (Tailwind 2, 3, 4, 6, 8, 12).
  - Radii: image 8px, card/modal 16px, pill buttons (rounded-full).
  - Typography: SF Pro system fallback stack (`-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, "Segoe UI", Roboto, sans-serif`).
- **Core UI Components (`src/components/ui/`)**:
  - `Button`: variants (`primary`, `outline`, `ghost`, `destructive`, `icon`), sizes (`sm`, `md`, `lg`), loading spinner with `aria-busy`, disabled state, minimum 44x44px touch target.
  - `Input` & `Textarea`: dark surface, focus-visible ring (`#7F51F9`), error border state (`#B41759`), disabled state, label and helper/error text with `aria-invalid` and `aria-describedby`.
  - `Alert`: accessible `role="alert"`, `success` and `danger` variants with accessible vector icons and optional dismiss action.
  - `Avatar`: circular, image loading with automatic fallback to user initials or placeholder icon, high contrast border, sizes `sm` to `xl`.
  - `Tabs`: WAI-ARIA tab list (`role="tablist"`), triggers (`role="tab"`, `aria-selected`, `aria-controls`), and panels (`role="tabpanel"`).
  - `Dialog`: desktop modal container, centered, dark card surface, close button, backdrop scrim, keyboard Escape listener, and body scroll lock.
  - `Sheet`: mobile bottom sheet container, full-width bottom-pinned, dark card surface, handle bar indicator, close button, backdrop scrim.
  - `Skeleton`: accessible loading skeleton pulse placeholder.
  - `Icons`: lightweight, strictly typed vector SVG icons (`Search`, `Home`, `Plus`, `User`, `AlertCircle`, `CheckCircle`, `Close`, `Spinner`, `Refresh`, `EmptyBox`).
- **Layout Shells (`src/components/layout/`)**:
  - `Header`: brand logo (vector mark + text), search bar placeholder/input, user avatar placeholder, responsive heights (80px desktop, 64px mobile).
  - `FloatingNav`: floating pill navigation bar with Home, Add Post (prominent brand button), and Profile; responsive floating appearance (360x80px desktop, 345x64px mobile).
- **Feedback Components (`src/components/feedback/`)**:
  - `LoadingState`: animated spinner with accessible `role="status"` and `aria-busy="true"`.
  - `EmptyState`: icon, title, description, and action button.
  - `ErrorState`: friendly error message, alert icon, and retry button affordance with callback.
- **Showcase Page (`src/app/page.tsx`)**:
  - Interactive design system preview exercising all components, responsive across 1440x900 desktop and 393x852 mobile viewports with zero horizontal overflow.

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
