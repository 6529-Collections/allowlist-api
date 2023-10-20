# API for creating allowlists

## Running in local environment

In local the app is ran in one process.

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
ALLOWLIST_SEIZE_API_PATH=<seize-api-endpoint> (don't put a slash in the end. https://api.seize.io/api for example)
ALLOWLIST_SEIZE_API_KEY=<seize-api-key> (can omit if using only public endpoints)
```

To install app dependencies run `yarn`

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

New migrations are called on first invocation of any lambda.

In production the app is ran in three lambas:

1. API lambda - Serves all API requests (entrypoint: `src/api-lambda.ts/handle`)
2. Worker lambda - Does the actual final allowlist creation (entrypoint: `src/worker-lambda.ts/handle`)
3. Tokenpool downloader lambda - Helps to get aggregated tokenpool data needed for worker lambda (entrypoint: `src/token-pool-downloader-lambda.ts/handle`)