# Agent Notes (iot-workspace)

## Workspace Reality
- This is an Nx + pnpm monorepo; there are no root `package.json` scripts, so use `pnpm exec nx ...` for almost everything.
- `pnpm-workspace.yaml` includes `admin-dashboard`, `resident-app`, `api-backend`, and libs under `backend/**`, `frontend/**`, `shared/**`; `hardware/**` is outside the JS workspace flow.
- Project names are not always folder names: `core` (`backend/core`), `backend-utils` (`backend/utils`), `frontend-utils` (`frontend/utils`), `interfaces` (`shared/interfaces`). Use `pnpm exec nx show projects` if unsure.

## High-Value Commands
- List projects: `pnpm exec nx show projects`
- Inspect actual/inferred targets for a project: `pnpm exec nx show project <project>`
- Run one project checks: `pnpm exec nx lint <project>`, `pnpm exec nx typecheck <project>`, `pnpm exec nx test <project>`
- Start apps: `pnpm exec nx serve api-backend`, `pnpm exec nx serve admin-dashboard`, `pnpm exec nx serve resident-app`

## Backend Wiring (easy to miss)
- API entrypoint is `api-backend/src/main.ts`; Nest global prefix is `/api`, default port is `3000`, CORS is enabled.
- `api-backend/src/app/app.module.ts` loads env files from `['.env', '../.env', '../../.env']`.
- Required backend env vars are effectively: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (core Supabase client), and `JWT_SECRET` (JWT module + strategy).
- Shared DTO/contracts come from `@iot-workspace/interfaces`; backend imports `@iot-workspace/core` and `@iot-workspace/interfaces` via TS path aliases.

## Testing Quirks
- MVP workspace currently has no Nx e2e projects; focus verification on per-project `lint`, `typecheck`, and `test` targets.

## Mobile + Hardware
- Capacitor is wired to resident app output: `capacitor.config.ts` uses `webDir: dist/resident-app/browser`; rebuild `resident-app` before sync/copy steps.
- ESP32 code is in `hardware/esp32-garita` (PlatformIO, not Nx). Secrets live in `hardware/esp32-garita/src/secrets.h` and are gitignored.
