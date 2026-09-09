# API for creating allowlists

## Running in local environment

In local the app is ran in one process.

Use Node.js 24 and Yarn 1.22.22 for development, CI, and deployment. If you use
NVM, run `nvm use`; the checked-in `.nvmrc` selects the supported Node.js major.

To run local DB, make sure you have docker installed:

First run in project root:

```
sh build-dev-db.sh
```

This will build the docker image for the DB.

Then run:

```
docker-compose up -d
```

Now the database is ready to be used. Dev DB is running on port 3307 and the DB is named `allowlist` (user: allowlist; password: allowlist)

Create an `.env.local` file in the root of the project and add the following:

```
ALLOWLIST_APP_PORT=3000
ALLOWLIST_DB_HOST=127.0.0.1
ALLOWLIST_DB_PORT=3307
ALLOWLIST_DB_USER=allowlist
ALLOWLIST_DB_NAME=allowlist
ALLOWLIST_DB_PASSWORD=allowlist
ALLOWLIST_ETHERSCAN_API_KEY=<your-etherscan-api-key>
ALLOWLIST_SEIZE_API_PATH=<seize-api-endpoint> (don't put a slash in the end. https://api.6529.io/api for example)
ALLOWLIST_SEIZE_API_KEY=<seize-api-key> (can omit if using only public endpoints)
OFAC_CHECK=true
```

`OFAC_CHECK` defaults to enabled. Only the exact value `false` disables OFAC
screening; missing or malformed values keep screening enabled. In AWS, configure
it in the `prod/lambdas` Secrets Manager secret in the target environment's
region. Disabling it is intended only as an emergency bypass.

To install app dependencies run
`yarn install --frozen-lockfile --registry=https://registry.npmjs.org/`.
`@6529-collections/allowlist-lib` is installed from the public npm registry;
GitHub Packages credentials and `NPM_TOKEN` are not required.

Use Yarn 1.22.22 for development, CI, and deployment. `yarn.lock` is the only
maintained lockfile; update it with Yarn when changing dependencies, then
verify the frozen install command above from a clean checkout. The npm registry
hosts the packages; using npmjs does not require switching package managers.

To start the app run `yarn start:local` or `yarn start:dev` to run with nodemon.

To explore and interact with the api, open `http://localhost:3000/api` in your browser.

To create new migrations run `yarn create-migration <migration-name>`. This creates up an down migration SQL's in migrations/sqls. Migrations are applied automatically on application startup.

Note: As everything is ran in one process if you run the specified allowlist, the API will still return immediately and the allowlist will be created in the background in a dangling promise.
This is not ideal, but is good enough for development environment.

To start with a clean database, stop the application and run:

```
docker-compose stop && docker-compose rm -f && docker-compose up -d
```

Start the application again and you'll have a clean database.

## Deployment to staging and production lambdas

Github actions CI pipelines are used to build and redeploy everything to staging and production.

All three managed Lambda functions use the `nodejs24.x` runtime, which is based
on Amazon Linux 2023. Build and package deployments with Node.js 24 so native
dependencies, if introduced, target the same runtime generation.

`yarn build` first uses the Nest compiler to preserve decorator metadata, then
esbuild bundles the resulting entrypoints and their ESM dependencies into
Node.js 24 CommonJS handlers. `yarn lambda:package` creates one reproducible
`.serverless/allowlist-api.zip` from that `dist/` tree, migrations,
configuration, and a frozen
production-only dependency install. The artifact contains no compiler, test,
Serverless Framework, or optimizer dependencies. Run
`yarn lambda:package:verify` before deployment; it checks both handler paths,
loads every handler under the current Node runtime, confirms Sentry debug IDs,
enforces Lambda size limits, and prints the artifact SHA-256.

The checked-in `serverless-*.yaml` files remain as records of the provisioned
infrastructure, but deployment workflows no longer install or run the obsolete
Serverless v3/plugin build chain. They update the existing functions directly
with the AWS CLI, waiting for each function to finish before continuing. The
order is token-pool downloader, allowlist worker, then API, so workers are ready
before the API can enqueue new work. Compatibility handlers under `src/` are
included in the artifact, so changing the configured handlers to `dist/` cannot
create a code/config transition outage.

After a staging deploy, `yarn lambda:smoke:staging` directly invokes all three
functions. The worker events use a reserved, side-effect-free bootstrap probe;
the API probe requests `/api-json`. The command requires a successful cold-start
`Init Duration`, rejects Lambda function errors or missing-module/runtime-entry
errors in the returned log tail, and validates each response payload.

Sentry source-map debug IDs are injected before packaging. The matching maps
are uploaded before the Lambda code update, ensuring the deployed JavaScript
and uploaded source maps have the same debug IDs.

New migrations are called on first invocation of any lambda.

In production the app is ran in 3 lambas:

1. API lambda - Serves all API requests (handler: `dist/api-lambda.handler`)
2. Worker lambda - Does the actual final allowlist creation (handler: `dist/worker-lambda.handler`)
3. Tokenpool downloader lambda - Helps to get aggregated tokenpool data needed for worker lambda (handler: `dist/token-pool-downloader-lambda.handler`)

## Dependency security policy

CI and both deployment workflows run two independent audits:

- `yarn audit:production` checks the deployable dependency graph.
- `yarn audit:all` checks production and development dependencies.

Both commands fail on any unapproved high or critical advisory, fail closed if
the registry returns no audit result, and print each remaining advisory with
its dependency path. Lower-severity findings remain visible but do not block.
If an advisory truly cannot be removed immediately, add only its exact advisory
ID and dependency path to `dependency-audit-exceptions.json`, together with a
reason and ISO expiry date. Broad package exceptions are not supported. The
exception file is intentionally empty at present.
