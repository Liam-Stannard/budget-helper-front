# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — run dev server (`ng serve`) with the API proxy from `proxy.config.json` (proxies `/api` to `http://localhost:8080`)
- `npm run build` — production build (`ng build`)
- `npm run watch` — dev build in watch mode
- `npm test` — run all unit tests (Jest, via `jest --verbose`)
- `npm run test:coverage` — run tests with coverage report (output in `coverage/`)
- `npm run test:watch` — run tests in watch mode
- Run a single test file: `npx jest path/to/file.spec.ts`
- Run tests matching a name: `npx jest -t "test name"`

Tests use Jest with `jest-preset-angular` (not Karma, despite what the generated README says).

## Architecture

This is an Angular 18 standalone-components app (no `bootstrapModule`/root `NgModule` — see `src/main.ts` and `src/app/app.config.ts`). It is mid-migration from an older `NgModule`-per-feature layout to a `modules/`-based structure; both patterns currently coexist:

- `src/app/core/` — singleton app-wide concerns: `auth/` (service, guard, interceptor, constants, interfaces) and `component/abstract/` (base component classes, below). Registered via `provideHttpClient(withInterceptors([authInterceptor]))` and `authGuard()` in `app.config.ts` / `app.routes.ts`.
- `src/app/modules/` — feature areas, each with its own `api/`, `components/`, and `shared/` (interfaces/types/constants) subfolders, e.g. `modules/transaction/`, `modules/login/`. The `*.module.ts` files here (`TransactionModule`, etc.) are currently empty/unused vestiges — components are standalone and wired directly into `app.routes.ts`.
- `src/app/shared/` — cross-feature reusable pieces: shared components (`nav`), interfaces, regex helpers, form validators.
- `src/app/core/component/abstract/` — base classes extended by feature components:
  - `AbstractComponent` — injects `Router`/`Location`/`ActivatedRoute`, exposes `navigate()`/`back()`/`loading`.
  - `AbstractNetworkingComponent<T, Y>` — RxJS `Observable`-based GET-on-init + submit pattern built on top of `AbstractComponent`.
  - `AbstractNetworkingSignalComponent<T, Y>` — signal-based variant of the same pattern (the direction new networking components are moving toward).
  - When adding a component that fetches data on init and/or submits a form, extend one of these rather than hand-rolling the lifecycle logic.
- `src/test/mockService.ts` — shared `MockAuthService`/`MockApiService` test doubles used across `.spec.ts` files. Note it currently references paths/types (`HttpResult`, a signal-based `TransactionApiService`) that don't match the RxJS-based `TransactionApiService` in `modules/transaction/api/` — this reflects the in-progress signals migration, not a resolved API.

### Auth flow

`AuthService` (`core/auth/auth.service.ts`) stores JWT access/refresh tokens in `localStorage`, decodes expiry via `jwt-decode`/`dayjs`, and exposes `isLoggedIn()`. `authInterceptor` attaches the bearer token to outgoing requests; `authGuard()` blocks route activation and redirects to `/login` when not authenticated (used on `home` and `transaction/*` routes in `app.routes.ts`).

### Transactions feature

`TransactionApiService` (`modules/transaction/api/`) wraps CRUD calls to `/api/v1/transaction`. `HomeComponent` renders `TransactionListWrapperComponent` (a smart component owning data-fetching and edit/delete actions dispatched via `IMatMenuButtonActionEvent`) which renders the presentational `TransactionListComponent` (Angular Material table). Route param `MODE` (`add`/`edit`/`view`, typed as `Mode` in `app.constants.ts`) drives `TransactionDetailsComponent` behavior for the `transaction/:MODE` and `transaction/:MODE/:ID` routes.

### UI

Angular Material (`deeppurple-amber` prebuilt theme, see `angular.json`), animations via `provideAnimationsAsync()`.
