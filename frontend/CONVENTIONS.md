# Frontend conventions

The rules that keep this code easy to read and change. If you need to break one, talk to the team first.

## Where code goes

Each layer only talks to the one below it: **component -> hook -> API function -> `api()`**.

| What | Where | Example |
| :-- | :-- | :-- |
| One fetch wrapper (cookies, errors, token refresh) | `src/lib/api/api.ts` | `api<T>()`, `post()` |
| Server calls, plain functions | `src/lib/api/<feature>.ts` | `getClubs()` |
| TanStack Query hooks | `src/hooks/use-<feature>.ts` | `useClubs()` |
| Form rules (Zod) | `src/lib/schemas/<feature>.ts` | `loginSchema` |
| UI-only state (Zustand) | `src/store/` | `auth_popup.ts` |
| Pure helpers | `src/lib/` | `match-utils.ts` |
| Components and pages | `src/components`, `src/app` | only call hooks |

## Server data

- Never call `fetch` outside `src/lib/api/` (ESLint blocks it). Use `api()`.
- Components never import from `src/lib/api/`. They use a hook from `src/hooks/`.
- Every feature has a query key factory (`clubKeys`, `matchKeys`). Do not type keys by hand.
- Do not copy server data into `useState` or Zustand. The query cache is the state.
- Do not load data with `useEffect` + `useState`. Use `useQuery`.
- Mutations use `useMutation`. Show errors with the message from the backend (`err.message`).
- No `try/catch` around queries or mutations. TanStack gives you `isPending`, `isError`, `error`.
- Never return a fake success when a request fails.
- After a mutation, invalidate the query keys it changes.

## Auth

- The logged-in user comes only from `useMe()` (`src/hooks/use-me.ts`).
  - `undefined`: still asking the backend. `null`: visitor. A user: logged in.
- Never store the user or tokens in `localStorage` or Zustand. Tokens are HttpOnly cookies.
- Zustand is for UI-only state, for example the login popup.

## Forms

- Schema in `src/lib/schemas/`, built from shared pieces (`emailSchema`, `passwordSchema`).
- React Hook Form + `zodResolver`. Submit with a mutation hook, not an inline `fetch`.
- Server errors show above the submit button, from `mutation.error.message`.
- Reuse `src/components/auth/form-parts.tsx` for labels, inputs, and errors.

## Backend rules the UI must respect

- A **member id is not a user id**. Get the member id from the club status (`useClubStatus` -> `member_id`).
- Roles: `MemberRole` (0 member, 1 leader, 2 coach). Do not write the numbers by hand.
- Dates are ISO strings. Show dates and times in `Africa/Casablanca`, not the browser time zone.
- Weekday numbers are 0 = Monday ... 6 = Sunday (not like `Date.getDay()`).
- Seeded users can have no first name, last name, or avatar. Never crash on that: fall back to the login.
- Do not rely on the body of DELETE responses.

## Adding a feature (checklist)

1. Add the call in `src/lib/api/<feature>.ts`.
2. Add the hook and its query keys in `src/hooks/use-<feature>.ts`.
3. If there is a form, add the Zod schema in `src/lib/schemas/`.
4. Use the hook in the component. Handle loading and error states.
5. Run `npx tsc --noEmit` and `npx eslint src`.