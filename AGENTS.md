# Repository Guidelines

## Project Structure & Module Organization
The NestJS codebase lives in `src/`, with feature modules grouped by dependency (`src/api`, `src/worker.module.ts`, `src/token-pool`). Lambda entrypoints sit alongside modules (`src/api-lambda.ts`, `src/worker-lambda.ts`). Shared utilities, interceptors, and decorators are under `src/common`, `src/interceptors`, and `src/decorators`. Database migrations are tracked in `migrations/`, and secrets or runtime config live in `config/` and `.env.*` files. Built artifacts are emitted to `dist/`. Local DB helpers (`build-dev-db.sh`, `docker-compose.yml`) and infrastructure definitions (`serverless*.yaml`, `dockerfiles/`) stay at the repo root.

## Build, Test, and Development Commands
- `yarn start:local` (or `yarn start:dev` with watch) boots the API against the local DB.
- `yarn build` compiles TypeScript to `dist/`.
- `yarn test`, `yarn test:watch`, and `yarn test:cov` run Jest once, in watch mode, or with coverage.
- `yarn lint` and `yarn format` keep imports, spacing, and Prettier rules aligned.
- `yarn new-endpoint` scaffolds a Nest controller/service pair; follow up with module wiring.
- `yarn create-migration <name>` generates SQL templates under `migrations/sqls`.

## Coding Style & Naming Conventions
Use TypeScript with 2-space indentation and single quotes (Prettier defaults). Classes, modules, and providers follow Nest conventions (`PascalCase`), while files and functions use `kebab-case` and `camelCase`. Keep DTOs and validators near their consumers in the module folder. Always run `yarn lint` before opening a PR so ESLint/Prettier fixes land in the commit.

## Testing Guidelines
Jest is configured to discover `.spec.ts` files within `src/`. Name tests after the unit under test (`token-pool.service.spec.ts`) and prefer fast, deterministic specs. Use `yarn test:cov` to confirm coverage stays above the existing baseline; flag any intentional gaps in the PR description. For HTTP endpoints, rely on SuperTest helpers already available in the project.

## Commit & Pull Request Guidelines
Write imperative commit subjects under 72 characters (e.g., `Add token pool retry logging`) and bundle related changes together. Reference tickets or incidents in the body when applicable (`B-12345`). Pull requests should include: a high-level summary, testing notes (`yarn test`, `yarn lint`), database migration callouts, and any screenshots of API responses if they clarify the change. Request reviews from domain owners and ensure CI passes before merging.

## Environment & Deployment Notes
For local development, run `sh build-dev-db.sh` followed by `docker-compose up -d` to provision the MariaDB instance (port `3307`, user/password `allowlist`). Add required secrets to `.env.local` as documented in `README.md`. Serverless deployments use the `serverless*.yaml` definitions; coordinate infrastructure changes with DevOps before editing those files.
