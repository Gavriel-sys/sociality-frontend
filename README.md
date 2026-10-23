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

## Completed in Stage 4C (Social Graph: Follow/Unfollow Mutation & Lists)

- **Optimistic Follow/Unfollow Mutation Hook (`src/features/profile/use-follow-toggle.ts`)**:
  - `useFollowToggle({ username, isFollowing, followersCount })`: TanStack Query mutation hook managing `POST /api/follow/{username}` (follow) and `DELETE /api/follow/{username}` (unfollow).
  - Optimistic UI: cancels outgoing target profile queries, snapshots previous state, and immediately updates `queryKeys.public.userProfile(username)` (`isFollowing = !isFollowing`, `followersCount` incremented/decremented).
  - Rollback on failure: restores previous profile cache snapshot on network failure.
  - Invalidation: invalidates target profile cache and private feed queries (`["private", sessionId, "feed"]`) on success.
  - Built-in guards:
    - Unauthenticated guard: safely redirects to `/login?returnTo=...` when no token is present without firing network requests.
    - Self-follow guard: no-op if user attempts to follow themselves.
    - In-flight debounce guard: prevents duplicate requests while a mutation is pending.
- **User Network Query Hooks (`src/features/profile/use-user-network.ts`)**:
  - `useUserFollowers(username)`: queries `GET /api/users/{username}/followers` with query key `["public", "user", username, "followers"]`.
  - `useUserFollowing(username)`: queries `GET /api/users/{username}/following` with query key `["public", "user", username, "following"]`.
  - Decodes and normalizes raw user list responses via `normalizeSearchUser`.
- **User List Dialog Modal (`src/features/profile/components/user-list-dialog.tsx`)**:
  - Accessible modal dialog built on `Dialog` primitive with backdrop, close button, title ("Followers" or "Following"), and `max-h-[60vh]` scrollable body.
  - Loading state with 4 `UserRowSkeleton` placeholders.
  - Error state with `ErrorState` and retry callback.
  - Empty state with `EmptyState` ("No followers yet" / "Not following anyone yet").
  - Populated list rendered with `UserRow` items; clicking a user navigates to `/profile/[username]` and closes the modal.
- **Profile Headers & Pages Wiring**:
  - `PublicProfileHeader`: integrates `useFollowToggle` on `FollowButton` and exposes clickable Followers/Following buttons (`aria-haspopup="dialog"`).
  - `ProfileHeader`: exposes clickable Followers/Following buttons (`aria-haspopup="dialog"`) on `/me`.
  - `PublicProfilePage` (`/profile/[username]`): wires `UserListDialog` to Followers/Following counters.
  - `MeProfilePage` (`/me`): wires `UserListDialog` to Followers/Following counters.
- **Unit & Component Test Suites**:
  - `use-follow-toggle.test.ts`: validates optimistic follow and unfollow, POST/DELETE endpoints, error rollback, unauthenticated redirect with returnTo, self-follow guard, and in-flight debounce protection.
  - `use-user-network.test.ts`: validates followers/following fetch, normalization, empty username bypass, and error handling.
  - `user-list-dialog.test.tsx`: validates open/close, skeleton loading, empty state, error state with retry, and user row click navigation callback.

## Completed in Stage 4B (Public Profile Page & Hooks)

- **Public User Profile Types & Decoder (`src/features/profile/types.ts`)**:
  - `PublicUserProfile` interface extending `UserProfile`: adds `isFollowing: boolean`.
  - `normalizePublicUserProfile(raw: unknown): PublicUserProfile`: robustly parses nested envelopes (`data`, `user`), counter fallbacks, and boolean following indicators (`isFollowing`, `following`, `is_following`).
- **Public Profile & User Content Hooks (`src/features/profile/public-profile.ts`)**:
  - `usePublicProfile(username: string)`: TanStack Query hook calling `GET /api/users/{username}` with `queryKeys.public.userProfile(username)`, enabled when username is non-empty, optional auth bearer token support.
  - `useUserPosts(username: string)`: queries `GET /api/users/{username}/posts` with `["public", "user", username, "posts"]`, decoding authored posts via `normalizePost`.
  - `useUserLikes(username: string)`: queries `GET /api/users/{username}/likes` with `["public", "user", username, "likes"]`, decoding liked posts via `normalizePost`.
  - `normalizePostList(raw: unknown)`: handles arrays and envelopes (`posts`, `likes`, `data`).
- **FollowButton Presentation Component (`src/features/profile/components/follow-button.tsx`)**:
  - Action pill button with touch target >= 44x44px.
  - States: "Follow" (primary purple `#6936F2`), "Following" (dark outline, hover: "Unfollow"), and "Edit profile" (for self profile).
  - Handles `onClick`, loading spinner, and keyboard focus indicators.
- **PublicProfileHeader Component (`src/features/profile/components/public-profile-header.tsx`)**:
  - Figma-compliant desktop (80x80px) and mobile (64x64px) circular avatar.
  - Display name bold, `@username`, bio preview or fallback.
  - Stats counters row: Posts count, Followers count, Following count.
  - Renders `FollowButton` in action slot with automatic or explicit `isSelf` detection.
- **Responsive Public Profile Page (`src/app/profile/[username]/page.tsx`)**:
  - Route: `/profile/[username]` accessible to guests and signed-in users.
  - Container: `max-w-[361px] md:max-w-[812px] mx-auto px-4 pt-6 space-y-6 pb-32` on dark canvas.
  - Top `Header` with user fallback.
  - Accessible `PublicProfileSkeleton` for loading states.
  - Error and 404 state via `ErrorState` with "Back to search" navigation to `/users/search`.
  - Content tabs for `Posts` (default) and `Likes` with `PostCard` feeds and dedicated `EmptyState` fallbacks ("No posts yet" / "No liked posts yet").
  - Seamless Next.js 15+ async `use(params)` unwrapping.
  - Bottom `FloatingNav`.

## Completed in Stage 4A (Users Search & User Presentation Components)

- **Search User Types & Decoder (`src/features/users/types.ts`)**:
  - `SearchUser` domain interface: `id` (string | number), `name`, `username`, optional `avatarUrl`, optional `bio`.
  - `SearchUsersResponse` interface: `users` (readonly `SearchUser[]`), `total`, optional `page`, optional `limit`.
  - `normalizeSearchUser(raw: unknown): SearchUser`: defensively normalizes varying response payloads, envelopes (`user`, `author`), key variants (`userId`, `fullName`, `handle`, `avatar`/`image`, `biography`), with strict string fallbacks.
  - `normalizeSearchUsersResponse(raw: unknown): SearchUsersResponse`: handles arrays directly or nested paginated response envelopes (`data`, `users`, `results`, `items`).
- **Debounced User Search Query Hook (`src/features/users/use-search-users.ts`)**:
  - `useSearchUsers(query, page = 1, limit = 20, debounceDelayMs = 300)` TanStack Query hook managing paginated user search queries.
  - 300ms internal query debouncing: suppresses premature network queries while user is actively typing; immediately clears on empty input.
  - Public directory endpoint: queries `GET /api/users/search?q=${encodeURIComponent(trimmedQuery)}&page=${page}&limit=${limit}`.
  - Enabled guard: query runs only when trimmed query length >= 1; returns empty result set (`users: []`, `total: 0`, `isLoading: false`, `isError: false`) when query is blank without triggering any network call.
  - Query keys: uses `queryKeys.public.search({ query: trimmedQuery, page, limit })`.
  - Optional auth token: safely passes bearer token if user is signed in, or queries publicly as guest.
- **Reusable UserRow Component (`src/features/users/components/user-row.tsx`)**:
  - Renders user circular avatar (`Avatar size="md"` 40x40px) with name/initials fallback.
  - Display name bold (`#FDFDFD`), `@username` (`#A4A7AE`), and optional bio preview.
  - Accessible link to `/profile/${user.username}` with >= 44x44px touch target.
  - Hover background `#141820`, rounded-xl border border-transparent `hover:border-[#1F242F]`.
- **Accessible UserRowSkeleton Component (`src/features/users/components/user-row-skeleton.tsx`)**:
  - Avatar circle skeleton, display name bar, username bar, bio line.
  - Accessible attributes: `role="status"`, `aria-busy="true"`, accessible text "Loading user...".
- **Responsive Users Search Page (`src/app/users/search/page.tsx`)**:
  - Public page accessible to both guests and authenticated users.
  - Responsive design container matching Figma specs (`max-w-[361px] md:max-w-[600px] mx-auto px-4 pt-6 space-y-6 pb-32` on `#000000` canvas).
  - Top `Header` with search value sync and user fallback.
  - Dedicated search input with magnifying glass, clear button (`CloseIcon`), and full accessible labels.
  - Comprehensive states:
    - Initial guidance state: "Find creators & friends" prompt when search query is empty.
    - Loading state: renders 4 `UserRowSkeleton` placeholders.
    - Error state: `ErrorState` with retry button.
    - Empty state: `EmptyState` ("No users found") when search produces 0 results.
    - Results list: renders list of `UserRow` components with pagination controls when total > limit.
  - Suspense boundary wrapping `useSearchParams()` content for SSR and static export compliance.
  - Bottom `FloatingNav`.
- **Top Header Search Form Sync (`src/components/layout/header.tsx`)**:
  - Search input wrapped in accessible form landmark (`role="search"`).
  - Submitting or pressing Enter navigates directly to `/users/search?q=${encodeURIComponent(trimmed)}` when query is non-empty.
- **Unit & Component Test Suites**:
  - `use-search-users.test.ts`: validates empty query without fetch, debounced fetch execution, pagination parameters, token propagation when authenticated, and error handling.
  - `user-row.test.tsx`: validates name/username/bio rendering, avatar fallback, `/profile/[username]` link target, username fallback when name is blank, and skeleton accessibility.
  - `users/search/page.test.tsx`: validates initial prompt when query empty, 4 loading skeletons, empty state on 0 results, user list rendering on results, error state with retry callback, clear button action, and header search form navigation.

## Completed in Stage 3C (Infinite Explore Hook, Explore Page /explore & Root Navigation Flow)

- **Infinite Explore Query Hook (`src/features/explore/use-infinite-explore.ts`)**:
  - `useInfiniteExplore()` TanStack Query hook managing paginated explore posts from `GET /api/posts?page=X&limit=10`.
  - Session-scoped query key: uses `sessionId ? ["private", sessionId, "explore"] : ["private", "unauthenticated", "explore"]`, preventing cross-account cache pollution while ensuring security tokens never enter cache keys.
  - Enabled guard: query runs strictly when authenticated (`token` and `sessionId` present).
  - Normalization: maps page responses through `normalizePost` with flexible envelope support (raw arrays, `{ posts: [...] }`, or `{ data: [...] }`).
  - Post deduplication: aggregates cross-page posts using an order-preserving Map keyed by `post.id`, guaranteeing zero duplicate React keys.
  - Pagination calculation: `getNextPageParam` evaluates fetched page item count against `limit: 10`, cleanly terminating pagination when `lastPage.length < 10` and otherwise requesting `allPages.length + 1`.
  - Return signature: `{ posts, isLoading, isError, error, isFetchingNextPage, hasNextPage, fetchNextPage, refetch }`.
- **Protected Explore Page (`src/app/(private)/explore/page.tsx`)**:
  - Wrapped with `<AuthGuard>` to redirect unauthenticated visits to `/login?returnTo=%2Fexplore`.
  - Responsive layout strictly matching the design container (Desktop max 600px `max-w-[600px]`, Mobile max 361px `max-w-[361px]`, `#000000` background, `pb-32` bottom padding for floating navigation).
  - Top `Header` with current user fallback and search input; accessible `h1` heading "Explore".
  - Comprehensive feedback lifecycle:
    - Loading state: renders 3 `PostCardSkeleton` placeholders with accessible `role="status"` and `aria-label="Loading explore posts"`.
    - Error state: renders `ErrorState` with retry button invoking `refetch()`.
    - Empty state: renders `EmptyState` ("No explore posts available") with community guidance.
    - Loaded list: renders vertically stacked `PostCard` items (`space-y-6`).
    - Pagination affordance: renders centered "Load more posts" button when `hasNextPage` (displaying spinner during `isFetchingNextPage`) and "You're all caught up!" text once end of stream is reached.
  - Bottom `FloatingNav` integration.
- **Root Route Navigation Flow (`src/app/page.tsx`)**:
  - Automatic authenticated redirect: monitors Redux `auth.status` and invokes `router.replace("/feed")` when authenticated.
  - Unauthenticated guest showcase: preserves full design system showcase / landing page for unauthenticated visitors and guests.
- **Unit & Component Test Suites**:
  - `use-infinite-explore.test.ts`: validates unauthenticated disabled state, first page fetch and normalization, next page appending, cross-page post ID deduplication, and API error response handling.
  - `explore/page.test.tsx`: validates 3-skeleton loading state, error state with retry button trigger, empty state rendering, populated explore card rendering with end-of-stream message, and "Load more posts" pagination button triggering `fetchNextPage`.
  - `app/page.test.tsx`: validates automatic redirect to `/feed` when authenticated, as well as preserving showcase rendering when unauthenticated or guest.

## Completed in Stage 3B (Infinite Query Hook & Feed Page /feed)

- **Infinite Feed Query Hook (`src/features/feed/use-infinite-feed.ts`)**:
  - `useInfiniteFeed()` TanStack Query hook managing paginated feeds from `GET /api/feed?page=X&limit=10`.
  - Session-scoped query key: uses `queryKeys.private(sessionId).feed()`, preventing cache collisions across accounts while keeping tokens completely out of query keys.
  - Enabled guard: query runs strictly when authenticated (`token` and `sessionId` present).
  - Normalization: maps page responses through `normalizePost` with flexible envelope support (raw arrays, `{ posts: [...] }`, or `{ data: [...] }`).
  - Strict ID deduplication: aggregates cross-page posts using an order-preserving Map keyed by `post.id`, guaranteeing zero duplicate React keys.
  - Page calculation: `getNextPageParam` evaluates fetched page item count against `limit: 10`, terminating pagination cleanly when `lastPage.length < 10` and otherwise requesting `allPages.length + 1`.
  - Return signature: `{ posts, isLoading, isError, error, isFetchingNextPage, hasNextPage, fetchNextPage, refetch }`.
- **Protected Feed Page (`src/app/(private)/feed/page.tsx`)**:
  - Wrapped with `<AuthGuard>` to redirect unauthenticated visits to `/login?returnTo=%2Ffeed`.
  - Responsive design strictly following Figma frames (Desktop max 600px `max-w-[600px]`, Mobile max 361px `max-w-[361px]`, `#000000` background, `pb-32` bottom padding for floating navigation).
  - Top `Header` with current user avatar/fallback and search input.
  - Comprehensive feedback lifecycle:
    - Loading state: renders 3 `PostCardSkeleton` placeholders.
    - Error state: renders `ErrorState` with retry button invoking `refetch()`.
    - Empty state: renders `EmptyState` ("No posts in your feed yet") with "Explore creators" action button navigating to `/explore`.
    - Loaded list: renders vertically stacked `PostCard` components (`space-y-6`).
    - Pagination affordance: renders centered "Load more posts" button when `hasNextPage` (displaying spinner during `isFetchingNextPage`) and "You're all caught up!" text once end of feed is reached.
  - Bottom `FloatingNav` with `activeKey="home"`.
- **Floating Navigation Routing Update (`src/components/layout/floating-nav.tsx`)**:
  - Converted to client component with `useRouter`.
  - Home button navigates to `/feed` by default (or invokes custom `onSelectKey` when provided).
  - Profile button navigates to `/me` by default.
- **Unit & Component Test Suites**:
  - `use-infinite-feed.test.ts`: validates unauthenticated disabled state, first page fetch and normalization, next page appending, cross-page post ID deduplication, and API error response handling.
  - `feed/page.test.tsx`: validates 3-skeleton loading state, error state with retry button trigger, empty feed state with explore action, populated feed card rendering with end-of-list message, and "Load more posts" pagination button triggering `fetchNextPage`.

## Completed in Stage 3A (Post Data Models, Decoder & Reusable PostCard Component)

- **Post Domain Types & Normalizer (`src/features/posts/types.ts`)**:
  - `PostAuthor` domain interface: `id`, `name`, `username`, optional `avatarUrl`.
  - `Post` domain interface: `id`, `caption`, `imageUrl`, `createdAt`, `author`, `likesCount`, `commentsCount`, `isLiked`, `isSaved`.
  - `PaginatedPosts` domain interface: `posts`, `nextPage`, `hasMore`, optional `total`.
  - `normalizePost(raw: unknown): Post`: defensively decodes API responses and envelopes (`data` or `post`), normalizes Prisma-style `_count` (`likes`, `comments`), safely resolves author from nested `author` / `user` objects or flat fields, and guarantees numeric counters default to 0 and interaction booleans default to false.
- **Day.js Relative Time Formatter (`src/features/posts/date-utils.ts`)**:
  - `formatRelativeTime(dateInput, referenceTime?)`: converts ISO date strings into human-friendly relative time ("Just now", "Xm ago", "Xh ago", "Xd ago", or "DD MMM YYYY" for older dates).
  - Robust error fallback: returns "Recently" for invalid dates, empty strings, null, or undefined values.
- **Reusable PostCard Component (`src/features/posts/components/post-card.tsx`)**:
  - Responsive layout matching Figma frames (Desktop 41420:11177 max-width 600px, Mobile 41433:3839 max-width 361px, dark surface `#0A0D12`, border `#1F242F`, `rounded-2xl`).
  - Header: author circular avatar (`Avatar size="md"` 40x40px) with initials fallback, display name, `@username`, relative timestamp, and overflow 3-dots button (`MoreHorizontalIcon`).
  - Media container: 1:1 aspect ratio (`aspect-square`), dark skeleton loading pulse placeholder, smooth image fade-in, and graceful fallback card with `ImageIcon` on broken or missing media.
  - Action row: Like button (pink/crimson `#B41759` active heart, outline inactive), Comment button with counter, Share button, and Save/Bookmark button with accessible `aria-label` attributes and minimum 44x44px touch targets.
  - Caption block: author username in bold with caption text, and an expandable "Show more" / "Show less" toggle for captions longer than 120 characters.
- **PostCard Skeleton Component (`src/features/posts/components/post-card-skeleton.tsx`)**:
  - Matches the `PostCard` dimensions with loading skeleton placeholders for author row, square image, action buttons, and caption lines (`aria-busy="true"`, `role="status"`).
- **Unit & Integration Test Suites**:
  - `date-utils.test.ts`: validates relative time intervals (minutes, hours, days, older dates, future/sub-minute timestamps, invalid date fallbacks).
  - `post-card.test.tsx`: validates normalizer edge cases (envelopes, counts, fallbacks), full card rendering, like/save active states and accessible labels, 44px action click callbacks, caption truncation toggle, image error fallback box, and skeleton component.

## Completed in Stage 2D (Read-Only /me Profile Page & E2E Auth Integration)

- **Profile Domain Types & Normalizer (`src/features/profile/types.ts`)**:
  - `UserProfile` domain interface: `id`, `name`, `username`, optional `email`, `phone`, `bio`, `avatarUrl`, and numeric counts `postsCount`, `followersCount`, `followingCount`.
  - `normalizeUserProfile(raw: unknown): UserProfile`: decodes and normalizes both flat API payloads and nested `{ data: ... }` / `{ user: ... }` response envelopes, with fallback resolution for Prisma-style `_count` objects.
- **TanStack Query Profile Hook (`src/features/profile/use-my-profile.ts`)**:
  - `useMyProfile()` hook querying `GET /api/me`.
  - Session-scoped query key: uses `queryKeys.private(sessionId).me()` ensuring private cache isolation across user sessions without leaking tokens into query keys.
  - Enabled guard: query runs only when authenticated (`token` and `sessionId` present).
  - Integrates `apiFetch` with `normalizeUserProfile` decoder and forwards abort signal.
  - Returns `{ profile, isLoading, isError, error, refetch }`.
- **Profile Header Component (`src/features/profile/components/profile-header.tsx`)**:
  - Responsive layout matching Figma frames (Desktop 41420:6315 max-width 812px, Mobile 41439:4314 max-width 361px).
  - Avatar with initials fallback or image URL (`size="xl"`, responsive dimensions `h-16 w-16 md:h-20 md:w-20`).
  - Identity presentation: bold display name (`#FDFDFD`), `@username` (`#A4A7AE`), bio text with fallback "No bio yet".
  - Quick stats row displaying `Posts`, `Followers`, and `Following` counts with bold numbers.
  - Action buttons: "Edit profile" (accessible disabled placeholder with "Available in Stage 7" notice) and "Log out" button invoking `useLogout()`.
- **Read-Only /me Profile Page (`src/app/(private)/me/page.tsx`)**:
  - Wrapped with `<AuthGuard>` to strictly prevent unauthenticated access.
  - Full feedback lifecycle: loading skeleton (`ProfileSkeleton`), error state with retry (`ErrorState`), and loaded profile view.
  - WAI-ARIA accessible tabs: `Overview` (active), `Posts`, `Saved`, `Likes`, `Settings`.
  - `Overview` tab: displays user account details (email, user ID) and honest stage notice ("Posts, Saved, and Liked collections will be integrated in Stages 3–5.").
  - Content tabs: display `<EmptyState>` indicating future stage integration.
  - Layout includes top sticky `Header` and floating navigation pill `FloatingNav activeKey="profile"`.
- **Header Avatar Link Integration (`src/components/layout/header.tsx`)**:
  - Avatar button links to `/me` if authenticated, or `/login` if unauthenticated.
  - Redux-aware navigation without crashing in disconnected preview environments.
- **E2E Auth Integration Test Suite (`tests/auth/auth-lifecycle.test.tsx`)**:
  - Validates complete user lifecycle: registration schema verification -> mock login credential submission -> session storage persistence and Redux hydration -> `/me` protected view rendering with real user data -> logout execution (clearing storage, Redux auth, and TanStack Query cache, with safe redirection to `/login`).
  - Verifies AuthGuard redirecting unauthenticated `/me` visits to `/login?returnTo=%2Fme`.

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

Stages 1, 2, 3, and 4 (Search, Public Profiles, and Social Graph) are completed. Stage 5 (Like/save interactions and personal post collections), Stage 6 (Post detail and comments), Stage 7 (Create/delete posts and edit profile), and Stage 8 (Integrated acceptance and delivery) remain pending.

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
