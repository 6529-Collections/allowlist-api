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

Now the database is ready to be used. Dev DB is running on port 3306 and the DB is named `allowlist` (user: allowlist; password: allowlist)

Create an `.env.local` file in the root of the project and add the following:

```
ALLOWLIST_APP_PORT=3000
ALLOWLIST_DB_HOST=localhost
ALLOWLIST_DB_PORT=3306
ALLOWLIST_DB_USER=allowlist
ALLOWLIST_DB_NAME=allowlist
ALLOWLIST_DB_PASSWORD=allowlist
ALLOWLIST_ETHERSCAN_API_KEY=<your-etherscan-api-key>
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

## Deployment to production and how it works there

Github CI pipeline builds and redeploys everything to production automatically on push to `main` branch.

New migrations are called on first invocation of any lambda.

In production the app is ran in two lambas:

1. API lambda - Serves all API requests (entrypoint: `src/api-lambda.ts/handle`)
2. Worker lambda - Does the actual final allowlist creation (entrypoint: `src/worker-lambda.ts/handle`)

Lambda configuration is in `serverless.yml`.