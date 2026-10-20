# AGENTS.md - Sociality Frontend MVP & Engineering Guidelines

This document provides binding operating instructions for autonomous AI coding agents (Codex Desktop, Antigravity, Claude Code) working on the `sociality-frontend` repository.

---

## 1. Project Overview & Tech Stack

- **Project:** Sociality Frontend MVP (Social media platform web client).
- **Core Stack:** Next.js (App Router), TypeScript (Strict), Tailwind CSS.
- **Key Capabilities:** Authentication, user profiles, feed/posts, idempotent interactions (like/unlike, follow/unfollow, save/unsave), pagination/infinite scrolling, loading/empty/error states.
- **Reference Specification:** `docs/Sociality-Frontend-MVP-Guide.pdf`.

---

## 2. Clean Code Standards (Robert C. Martin / Uncle Bob)

All code written or modified in this repository MUST strictly follow Clean Code craftsmanship principles:

### A. General Philosophy
- **The Boy Scout Rule:** Leave the campground cleaner than you found it. Whenever touching a file, refactor at least one small issue (rename a poor variable, extract a long method, delete dead code).
- **LeBlanc's Law:** *Later equals never.* Do not write temporary hacks or defer cleanups.
- **Kent Beck's 4 Rules of Simple Design:**
  1. Runs all tests / passes all verification gates.
  2. Contains no duplication (DRY).
  3. Expresses intent of the programmer clearly.
  4. Minimizes the number of classes, functions, and elements.

### B. Meaningful Names (Chapter 2)
- **Intention-Revealing:** Names must answer why it exists, what it does, and how it is used (`isLikedByUser`, `fetchNextPage`, `PostCardProps`). Avoid abbreviations, single-letter variables (except standard loop indices), and generic names (`data`, `item`, `temp`, `val`).
- **Nouns for Classes & Components:** Use nouns or noun phrases (`UserProfileHeader`, `CommentList`, `PostFeed`).
- **Verbs for Functions & Handlers:** Use verbs or verb phrases (`handleFollowToggle`, `createComment`, `formatRelativeDate`).
- **One Word per Concept:** Pick one term across the codebase (e.g., do not mix `fetch`, `get`, and `retrieve` for API calls).

### C. Functions & Components (Chapter 3)
- **Small (<20 Lines):** Functions must be small. Most utility and helper functions should be 2-10 lines. Break large React components into modular sub-components.
- **Do One Thing (Single Responsibility):** A function or hook must do exactly one thing and do it well.
- **One Level of Abstraction (Stepdown Rule):** Code should read like a top-down narrative. Do not mix high-level business workflow with low-level string/array manipulation in the same function.
- **Function Arguments:** Prefer 0-2 arguments. If a function needs 3 or more arguments, encapsulate them into an object parameter (`props` or typed options object).
- **No Flag Arguments:** Never pass a boolean flag to toggle internal behavior (`renderPost(post, true)`). Split into two distinct functions or components (`renderFullPost(post)` vs `renderCompactPost(post)`).
- **Command-Query Separation (CQS):** A function should change system state OR answer a query, never both.
- **No Hidden Side Effects:** Do not mutate input arguments or global state unexpectedly.

### D. Comments (Chapter 4)
- **Code Explains Itself:** Do not write comments to explain confusing code; rewrite the code.
- **Zero Commented-Out Code:** NEVER leave commented-out code. Version control (Git) remembers history. Delete dead code immediately.
- **No Redundant Noise:** Remove comments that merely echo the code (`// fetch posts -> fetchPosts()`).

### E. Error Handling & Null Safety (Chapter 7)
- **Exceptions Over Error Codes:** Handle failures via structured try/catch or typed Result patterns.
- **NEVER Return Null:** Return empty arrays `[]`, fallback objects, or undefined/optional types. Do not make callers perform defensive null-checks everywhere.
- **NEVER Pass Null:** Prohibit passing null into functions unless explicitly required by an external library signature.
- **Extract Try/Catch:** Error handling is "one thing". Separate try/catch wrappers from the core business algorithm.

### F. Objects, Boundaries & Law of Demeter (Chapters 6 & 8)
- **Avoid Train Wrecks:** Do not navigate through chains of internal properties (`user.profile.settings.privacy.isPublic`). Wrap queries in domain methods.
- **Isolate External APIs:** Encapsulate third-party SDKs and raw HTTP fetch calls behind typed service layers or hooks. Do not scatter raw API endpoints across presentation components.

### G. Unit & Component Testing (Chapter 9)
- **Prinsip F.I.R.S.T.:**
  - **Fast:** Tests execute in seconds.
  - **Independent:** Tests do not share state or depend on run order.
  - **Repeatable:** Tests pass in any environment (local, CI, offline).
  - **Self-Validating:** Clear boolean PASS/FAIL.
  - **Timely:** Written alongside or before implementation.
- **Arrange-Act-Assert (AAA):** Structure tests clearly into three phases: setup data, execute action, assert outcome. Single logical concept per test.

---

## 3. TypeScript & React Invariants

- **Strict Typing:** No `any`. Explicitly type all component props, hook return values, and API responses.
- **Type-Only Imports:** Use `import type { ... }` for types to maintain compatibility with `verbatimModuleSyntax`.
- **Component File Bounds:** Keep component files under 150 lines. Extract sub-components into `components/` or co-located sub-folders.
- **Client vs Server Components:** Explicitly mark `'use client'` on interactive components; keep data fetching and static markup on Server Components where possible.
- **Idempotency Guard:** Ensure mutation actions (Like, Follow, Save) have optimistic UI updates and prevent duplicate in-flight requests.

---

## 4. Verification Gate (Must Pass Exit Code 0)

Before considering any task or stage complete, run the following verification commands:

```bash
# Type check and build validation
pnpm run lint
pnpm run build
```

*(Or `npm run lint && npm run build` depending on the active package manager).*

All checks must exit with code 0 without unaddressed errors or warnings.
