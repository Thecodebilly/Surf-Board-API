# AGENTS.md

Leaderboard API for the Surf CYD game. The ESP32 boards and the browser emulator post scores and read the top 100. This repo is public: never commit secrets, connection strings or player data.

## Stack

- Node >=18 (package.json engines), CommonJS. `npm run dev` uses `node --watch`, which needs Node 18.11 or later.
- Express 4, pg 8, dotenv 16, Postgres (one table, `records`). No package-lock.json is committed, so every install resolves the semver ranges in package.json.

## Where it runs

- Railway, which runs `npm install` and `npm start`. railway.json only sets restart-on-failure (10 retries).
- GitHub deployment records show every merge to `main` deployed to Railway production within seconds. Treat any push or merge to `main` as a production deploy; changes land through pull requests.
- There is no CI, and railway.json sets no health check, so nothing in the repo stops a broken `main` from going live. Run `npm run check` and both test scripts before opening a PR.
- The Surf CYD firmware (the public Surf-CYD repo from the same GitHub owner: `src/Database.cpp` and `include/RecordParser.h`) hard-codes the production URL, so the boards break if the service URL or response shape changes.

## Repo map

- `server.js`: the whole app: pool config, CORS, JSON body limit, routes `/health`, `GET /records`, `POST /records`.
- `records.js`: `validateRecord(body)`: returns `{ name, score }` or `{ error }`.
- `profanity.js`: `containsProfanity(value)` and the word list.
- `test-profanity.js`, `test-records.js`: plain `node:assert` scripts, no framework.
- `readme.md`: user-facing endpoint docs and the `CREATE TABLE` SQL.
- `.env.example`: variable names with placeholder values.

## Commands

- `npm install --no-package-lock`: verified. Plain `npm install` writes package-lock.json, which is neither committed nor gitignored; keep it out of commits, since a committed lockfile pins every later install.
- `npm run check`: syntax-checks server.js only. Verified.
- `npm run test:profanity` and `npm run test:records`: verified, both pass. There is no `npm test`.
- `npm start`: verified against a throwaway local Postgres. Run `docker run -d --rm --name surf-pg -e POSTGRES_PASSWORD=postgres -p 127.0.0.1:<port>:5432 postgres:16-alpine`. Once `docker exec surf-pg pg_isready -h 127.0.0.1 -U postgres` succeeds, run `docker exec surf-pg psql -U postgres -c "<CREATE TABLE from readme.md>"`, then, in a POSIX shell, `PGHOST=127.0.0.1 PGPORT=<port> PGUSER=postgres PGPASSWORD=postgres npm start`. Stop the database with `docker stop surf-pg`.
- `npm run dev`: verified; same as start under `node --watch`. Deploy: not run; it happens in Railway.

## Configuration

- `DATABASE_PUBLIC_URL`: Postgres connection string; when set, server.js uses it instead of the `PG*` vars (pg still fills any part the URL leaves out from them).
- `PGHOST`, `PGPORT` (default 5432), `PGDATABASE`, `PGUSER`, `PGPASSWORD`: used when there is no connection string. Set `PGUSER`: without it pg logs in as the OS user.
- `NODE_ENV`: `production` turns on SSL for the Postgres connection.
- `PORT`: listen port, default 3000. dotenv loads `.env` (gitignored).
- `.env.example` sets both `DATABASE_PUBLIC_URL` and the `PG*` vars. A `.env` copied from it as is keeps the placeholder URL, which wins and fails to connect; delete that line to use the `PG*` vars.

## Conventions

- Routes live in server.js and answer errors as `{ "error": "<message>" }`. Validation lives in records.js.
- New tests: add `test-<name>.js` with `node:assert/strict` and a `test:<name>` script in package.json.
- Browser access is an allowlist: `ALLOWED_ORIGINS` in server.js.

## Gotchas

- No migrations: nothing in the repo creates or alters the `records` table; readme.md holds its `CREATE TABLE`. Never change the production database yourself: the owner applies schema changes by hand, and they must be live before code that needs them reaches `main`. Update the readme.md SQL in the same PR.
- The firmware needs `GET /records` to answer 200 with a JSON array, which it streams reading only `name` and `score`; it accepts 200 or 201 from `POST /records` and reads `error` from any other reply. Keep these shapes.
- `MAX_NAME_LENGTH` (20) is sized for the device leaderboard. `MAX_SCORE` is the Postgres INTEGER limit.
- Keep the `pool.on('error')` listener in server.js: without it a Postgres restart crashes the process, and railway.json allows only 10 restarts on failure.
- Nothing in the code deletes rows, so the production `records` table keeps every accepted score. Never run scripts or send test requests against it. The test scripts never open a database, but `npm start` does: check where `.env` and the shell point before sending a POST.
- The app serves no static files, so files in the repo root (including this one) are not web-served.
