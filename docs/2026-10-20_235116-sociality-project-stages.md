# Sociality Frontend MVP — Delivery Stages

Status: proposed project roadmap; planning only, not implementation authorization.
Prepared: 2026-10-20 WIB.

## Goal and authority
Deliver a responsive, API-integrated social frontend covering MVP Guide flows and the supplied documented endpoints, with real desktop/mobile design fidelity and tested session/mutation behavior.

- Authoritative working folder: `D:\GDT\WPH\Assigments\sociality-frontend` on Davis's Windows laptop, reached read-only through `ssh gilbert-win`.
- Current inspection: only `AGENTS.md` and `docs/Sociality-Frontend-MVP-Guide.pdf`; no application scaffold or Git repository observed at root.
- Primary implementer: Codex for this workstream; Dev is reviewer/gatekeeper; Davis authorizes execution boundaries.
- Visual authority: Owner-selected **Social Media (Copy)**, Figma file `7p8ZALQeJAbbLRqUuJZIHU`. Original file is not a required comparison gate.
- Requirements: MVP Guide; local engineering rules: AGENTS.md. API: `https://be-social-media-api-production.up.railway.app/api-swagger/`.
- API evidence: documented 30 operations on 23 paths; successful-response schemas absent. Public search GET and unauthenticated private-route rejection were tested previously. Authenticated success/mutations have NOT been tested.
- Figma evidence: Codex's node/token inventory is implementer evidence. Dev independently opened desktop detail and mobile comment screenshots, not every measured property.
- No local DB or backend implementation planned. Hosted API is shared/external; its environment name does not imply a disposable test service.

## Architecture and boundaries
Next.js App Router, strict TypeScript, Tailwind, shadcn/ui, Redux Toolkit for necessary client/UI state, TanStack Query for server state, Zod/React Hook Form, Day.js. Central typed API boundary; no endpoint strings scattered through presentation components. Session identity scopes private cache and asynchronous effects; tokens must never enter query keys, reports or screenshots.

Use production components directly, with visual review in each stage. No mandatory throwaway HTML prototype or final-only visual-polish stage. Keep placeholders/fixtures clearly labelled and separate from completed live features.

All paths below are proposed relative to the authoritative Windows folder; exact generated tooling files are part of foundation scope, not assumed omissions. Existing working files must be backed up before edits. No automatic stage/commit/push. No deployment or infrastructure/backend changes.

## Stage 1 — Tooling, design foundations, verification harness
Dependencies: roadmap execution approved.

Likely paths: `package.json`, one chosen package-manager lockfile, `tsconfig.json`, Next/ESLint/PostCSS configs, `components.json`, `src/app/layout.tsx`, `src/app/globals.css`, `src/providers/`, `src/components/ui/`, `src/lib/api/`, `src/lib/query/`, `.env.example`, `.gitignore`, `README.md`, `tests/`.

Tasks:
- Authorize Git initialization separately as part of this batch; do not assume branch/HEAD exists. Establish baseline and writer ownership.
- Scaffold required stack; choose one package manager and record exact resolved versions during execution.
- Set up Query/Redux providers, minimal API transport/config validation, and scripts for lint, explicit typecheck, tests and build.
- Establish observed colors, spacing, typography strategy, UI primitives and layout shell from selected Figma copy. Inspect initial auth frames and required assets. SF Pro name does not authorize redistributing font files; use lawful assets/fallback and label visual differences.
- Install test/browser tooling in explicitly approved scope. Exclude local reports, caches, credentials and temporary captures from checkpoints.

Exit evidence: providers and representative controls render; keyboard focus/contrast/responsive layout checked; lint, typecheck, tests and build pass. No feature/auth acceptance claim yet.

## Stage 2 — Authentication, session lifecycle, read-only /me
Dependencies: Stage 1.

Likely paths: `src/app/(auth)/login/`, `src/app/(auth)/register/`, `src/app/(private)/me/`, `src/features/auth/`, `src/features/profile/`, `src/lib/api/`; tests under `tests/auth/`.

API: POST `/api/auth/register`, POST `/api/auth/login`, GET `/api/me`.

Tasks:
- Responsive Figma login/register, adding required email and correcting misleading Name placeholder.
- Validate forms, disable duplicate submissions, display meaningful server errors.
- Validate actual success/error envelopes; handle whether register returns a session or requires login without inventing a token field.
- Decide session persistence with explicit security trade-off; no token logging. Guard private routes after hydration, preserve only safe same-origin return destinations, implement local logout because no logout/refresh API is documented.
- Isolate private cache and stale responses across logout/account switches; a late 401 from an old session must not invalidate a new one.
- Render /me overview from real profile response, with no fake completed Posts/Settings tabs.

Exit evidence: approved test identity completes register/login/me, refresh, logout and return-to. Negative tests: wrong credentials, malformed stored session, expiry/401, hydration race, account switch, stale completion and unsafe redirect. Live registration/login require explicit authorized test identity/mutation scope; mocks can proceed without creating real users. Never auto-retry an ambiguously completed registration POST.

## Stage 3 — Read-only feed, Explore and reusable post presentation
Dependencies: Stage 2.

Likely paths: `src/app/(private)/feed/`, `src/app/(private)/explore/`, `src/features/posts/`, `src/features/feed/`, shared PostCard/UserChip/media components; `tests/feed/`.

API: GET `/api/feed`, GET `/api/posts` (authenticated Explore).

Tasks: real PostCard with images/caption/author/time/counters; consistent optimized-media policy and fallback; pagination/infinite load, stable IDs, retry and empty states. Feed self-posts remain visible; empty-following alone does not prove feed should be empty. Do not imply like/save/share writes work before their stages. Explore is supported by API but has no confirmed Figma frame: reuse established visual language without inventing a public feed.

Exit evidence: actual rendered desktop/mobile feed at reference and intermediate widths; no duplicate IDs or concurrent duplicate page loads; correct end-of-list/error handling. Public views must not reuse personalized private cache.

## Stage 4 — Search, public profiles and social graph
Dependencies: Stages 2–3.

Likely paths: `src/app/users/search/`, `src/app/profile/[username]/`, `src/app/(private)/me/followers/`, `src/app/(private)/me/following/`, `src/features/users/`, `src/features/follow/`; `tests/users/`, `tests/follow/`.

API: GET `/api/users/search`, `/api/users/{username}`, `/api/users/{username}/posts`, `/api/users/{username}/likes`, public followers/following; POST/DELETE `/api/follow/{username}`; GET `/api/me/followers`, `/api/me/following`.

Tasks: debounced search, public profiles and galleries, public/private follower lists, self-follow guard, optimistic follow/unfollow, serialized in-flight ownership, rollback/reconcile, synchronized counts and affected feed invalidation. Public pages work logged out; private actions prompt login with return-to. Missing designed list surfaces reuse established components.

Exit evidence: delayed search cannot replace newer results; rapid follow toggles preserve accurate server state; failure/account-switch tests; list pagination; public/private access checked.

## Stage 5 — Like/save interactions and personal post collections
Dependencies: Stages 2–4.

Likely paths: `src/features/likes/`, `src/features/saves/`, personal profile tabs/routes in `src/features/profile/`, shared post actions; `tests/interactions/`.

API: POST/DELETE `/api/posts/{id}/like`, GET `/api/posts/{id}/likes`, GET `/api/me/likes`; POST/DELETE `/api/posts/{id}/save`, GET `/api/me/saved`, GET `/api/me/posts`.

Tasks: implement toggles, Liked by list (authenticated per Swagger), My Posts/My Likes/Saved with pagination; optimistic state, rollback, confirming read/invalidation lifecycle and synchronized cards/counters across surfaces. Shared infrastructure may be reused, but tests execute actual production hooks/helpers.

Exit evidence: rapid click, request timeout/unknown outcome, failed reconcile, remount and account-switch cases cannot double-count or affect another session. Do not blindly retry ambiguous writes; reconcile idempotent state under originating ownership.

## Stage 6 — Post detail and comments
Dependencies: Stages 3–5.

Likely paths: `src/app/posts/[id]/`, `src/features/comments/`, `src/features/posts/detail/`; `tests/comments/`, browser detail tests.

API: GET `/api/posts/{id}`, GET/POST `/api/posts/{id}/comments`, DELETE `/api/comments/{id}`.

Tasks: shareable detail route, desktop detail dialog/mobile comment-sheet presentation, comments paging/composer, optimistic pending comment reconciliation, ownership-aware delete UI. Accessible modal focus/close/keyboard behavior; direct links and history navigation remain functional. Logged-out users can read documented public detail/comments but cannot submit.

Exit evidence: single-submit guards and failure handling; no blind retry of a possibly committed non-idempotent comment POST; correct comment counts and removal; pagination and session races; mobile keyboard, focus trapping/restoration and route reload.

Permission boundary: Guide permits comment-owner deletion; Swagger also mentions post-owner moderation. Keep comment-owner-only UI unless Owner explicitly approves broader moderation; report this as unresolved extra capability, not a reason to block unrelated stages.

## Stage 7 — Create/delete posts and edit profile
Dependencies: Stages 2–6.

Likely paths: `src/features/posts/create/`, post deletion controls, `src/features/profile/edit/`, relevant private routes; `tests/authoring/`, `tests/profile/`.

API: POST `/api/posts` multipart (`image`, optional `caption` per API; preserve Guide image+caption UX), DELETE `/api/posts/{id}`, PATCH `/api/me` (JSON or multipart/avatar).

Tasks: image validation/preview, upload limits and error UX, create submission guard and server reconciliation, delete-own confirmation, all-list cleanup, editable documented profile fields/avatar and cross-surface refresh. Do not expose unsupported email editing. Username changes must update links/cache identity safely. Do not claim aborting transport rolls back a backend write.

Exit evidence: image format/size validation, upload failure/timeout, duplicate submit, ownership and count consistency, deleted-detail behavior and saved/liked-list invalidation; edit failure and username/avatar propagation. Ambiguous non-idempotent create outcomes need explicit uncertain state, not automatic repost. Separate authorized live test writes from mocks.

## Stage 8 — Integrated acceptance, accessibility and delivery
Dependencies: Stages 1–7 accepted individually.

Likely paths: cross-flow test suites, bounded corrections in reviewed feature files, `README.md`, `docs/` for approved durable decisions only.

Tasks:
- New-user journey: register/login, follow, feed, post, like/save, comment, personal collections, profile edit, deletes, logout/login; compare two isolated sessions.
- Endpoint-to-feature checklist: implemented vs verified vs deferred, including Explore and all list endpoints.
- Recheck desktop 1440 and mobile 393 references plus intermediate widths; zoom, long content, image errors, keyboard, safe-area/soft keyboard, contrast and reduced motion. Verify actual measured styles and screenshots, not class-name searches alone.
- Test loading/empty/error/retry/401/403/404/rate-limit handling; accessible alerts and focus.
- Analytics requirement: cover lightweight listed events without tokens, PII or comment/post content; real external analytics requires a separately approved destination/privacy scope. Never fake absent share counts/endpoints; optional platform share must not imply backend counts.
- Final lint, explicit typecheck, tests, build, browser checks and authorized API smoke. Treat each proof separately; passing build is not browser/API acceptance.
- Document setup/env names, feature status, test boundaries and known limitations. Review repository hygiene and secrets before checkpoint.

Exit evidence: all Guide DoD flows and endpoint coverage recorded honestly; no unresolved correctness/security blockers. Deployment is a separate authorized batch after hosting, environment, privacy and asset/font distribution checks; no automatic publish/push.

## Delivery discipline (every stage)
1. Reuse this roadmap; define only next bounded execution scope, exact allowed effects, tests and stops. Do not create roadmap-about-roadmap gates.
2. Codex backs up existing working files, writes production code/tests, and reports branch/baseline, paths, actual commands/results, visual/API evidence, deviations and risks.
3. Dev performs direct Windows source/diff review and checks relevant screenshot/test evidence; elevated risk gets scope pass plus adversarial invariant pass. Do not rerun mutating tests without authorization.
4. CONTENT REVIEW does not authorize a commit. Separate explicit-path stage-only approval, COMMIT READINESS (raw diff/numstat and candidate/index parity), separately authorized local commit, then CHECKPOINT VERIFIED. No automatic push.
5. Resume next dependency-ready stage. A stage may be split into small review batches without restarting design intake or inventing extra mandatory documents.

## Atomic open-item classification
- IMPLEMENTATION VALIDATION: exact API response envelopes and documented-versus-runtime behavior, demonstrated through authorized tests during affected stage.
- IMPLEMENTATION VALIDATION: tablet/intermediate breakpoints, safe lawful typography fallback and actual visual/accessibility measurements during bounded UI work.
- BLOCKS ROLLOUT: lack of authorized live test account/scope prevents claiming live authenticated acceptance; stop affected live calls only, not safe mocked implementation. Obtain explicit permission before those calls.
- FOLLOW-UP: broader post-owner comment moderation beyond Guide's owner-only UI; no silent expansion.
- BLOCKS ROLLOUT: missing font/asset redistribution rights for any bundled restricted file; do not bundle restricted assets meanwhile.
- BLOCKS ROLLOUT: hosting/public publication and external analytics remain separately gated.

## Estimates and non-goals
Sequence is dependency-based, not a promised seven-day schedule. Guide's seven-day suggestion is not verified delivery capacity. Backend modifications, new DB, notifications, chat, share counters, unsupported account settings and public anonymous feed are excluded unless separately approved. No implementation/test/build/install has been executed as part of this planning task.
