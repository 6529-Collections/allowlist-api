# API for creating allowlists

To run local DB, make sure you have docker installed and run:
```
docker-compose up -d
```

This makes sure that the DB is running on port 5432 and the DB is named `allowlist` (user: allowlist; password: allowlist)

To install app dependencies run `yarn`

To run database migrations run: `yarn migrate up`

To start the app run `yarn start`

To create new migrations run `yarn migrate create <migration-name>`. This created up an down migration SQL's in migrations/sqls.