# Surf Board API

Express + Postgres API for leaderboard records.

## Endpoints

- `GET /health` - checks API + database connectivity.
- `GET /records` - returns all rows from `records` ordered by score.
- `POST /records` - adds a record with profanity filtering on the `name` field.

### POST /records body

```json
{
  "name": "player-name",
  "score": 123
}
```

## Database table

```sql
CREATE TABLE IF NOT EXISTS records (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Environment variables

Use either:

- `DATABASE_PUBLIC_URL`

Or individual variables:

- `PGHOST`
- `PGPORT`
- `PGDATABASE`
- `PGUSER`
- `PGPASSWORD`

## Run locally

```bash
npm install
npm run start
```

## Deploy on Railway

1. Create a Railway project and attach a Postgres database.
2. Set environment variables (`DATABASE_PUBLIC_URL` **or** PG vars).
3. Railway will run `npm install` and `npm run start` automatically.
4. Ensure your DB has the `records` table shown above.
