# prisma/

> ⚠ MAINTENANCE: any schema change (new model, field, relation, index, enum), generator change, datasource change, migration creation → update this CLAUDE.md SAME SESSION.

## meta
- role: Prisma schema declaration (DB models for the backend)
- current_files: schema.prisma
- generator: prisma-client-js
- datasource: postgresql
- sync_strategy: `prisma db push` (NOT migrations historized) — driven by package.json scripts dev/start

## current schema.prisma
```prisma
generator client {
    provider = "prisma-client-js"
}

datasource db {
    provider = "postgresql"
}

model User {
    id       String  @id @default(cuid())
    socketId String?
}
```

## models
| model | fields | purpose |
|---|---|---|
| User | id (String, cuid PK), socketId (String?) | stub — link to socket.io connection (nullable when offline) |

## conventions (when extending)
- IDs: `@id @default(cuid())` (CUID v1 — sortable, URL-safe, no PII leak vs UUID v4)
- soft-delete: prefer `deletedAt: DateTime?` over hard delete; ignore via `where: { deletedAt: null }` in services
- timestamps: `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
- string lengths: leave unbounded by default (PostgreSQL TEXT) unless constraint needed
- relations: prefer explicit `@relation(...)` with named FK (`@relation(fields: [userId], references: [id])`)
- indexes: `@@index([field])` for query patterns, `@@unique([fieldA, fieldB])` for composite uniqueness

## sync workflow (current — db push)
- `npm run dev` → `prisma db push && nodemon`
- `npm start` → `prisma db push && node --env-file=.env dist/index.js`
- behavior: pushes schema directly to DB (drops/recreates columns as needed in dev)
- pros: fast iteration, no migration history clutter
- cons: NO versioning, NO rollback, NO prod-safe (data loss on column drop/rename)

## migration workflow (when promoting)
1. replace `db push` with `migrate dev` in dev script: `prisma migrate dev`
2. for prod: `prisma migrate deploy` (only applies pending migrations, no schema diff)
3. creates `prisma/migrations/<timestamp>_<name>/migration.sql`
4. commit migrations to git
5. update root CLAUDE.md (mention migrations active)

## prisma.config.ts (root)
- loads `.env` via dotenv
- forces `DATABASE_URL` resolution (throws if missing)
- points to `prisma/schema.prisma`

## adapter (configPrisma.ts)
- uses `@prisma/adapter-pg` (driver-adapter approach in Prisma 7+)
- NO query engine binary → lighter runtime, faster cold start
- ALL queries go through `pg` natively

## adding a model
1. add `model Xxx { … }` in schema.prisma
2. (dev) run `npx prisma db push` (or restart `npm run dev` to auto-push)
3. (gen client) automatically regenerated on push
4. import `prisma.xxx` in service: `prisma.xxx.findUnique(...)`
5. add error keys in `src/lib/trad/json/fr/api/<resource>.json` for not-found/conflict
6. add CLAUDE.md sub-section here if model has non-trivial relations/indexes

## invariants
- `model User` MUST exist (referenced by socketId pattern for socket linkage — even if you use a different shape, keep the user table somehow)
- generator output: default location (`node_modules/.prisma/client`) — DO NOT customize unless intentional
- single datasource — adding a second is non-trivial (Prisma supports it via preview flag)

## pitfalls
- renaming a field with `db push` = drops old column + creates new = DATA LOSS in dev (and prod if used in prod)
- editing schema without restarting dev → server runs with stale Prisma client (no auto-watch)
- `@db.VarChar(255)` constraints applied via push — changing to TEXT later requires migration not push
- composite unique vs simple unique: `@@unique([a,b])` ≠ `@unique` on each — design intentional
- relations: forgetting `onDelete: Cascade` leaves orphans; choose explicit (Cascade/SetNull/Restrict)

## public api (refacto-stable)
- the Prisma client `prisma` (imported from `src/configPrisma.ts`) — schema changes cascade to type signatures automatically
- model names in schema.prisma → `prisma.<modelLowercase>` in code
