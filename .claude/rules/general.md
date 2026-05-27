# General

> ⚠ MAINTENANCE: any new dep, middleware, schema change, env var, external service, refacto bootstrap → update this CLAUDE.md AND sub-folder CLAUDE.md. SAME SESSION.

## meta
- type: Node + Express backend template
- prefix_on_init: node_express_*
- github: Marc-EtienneBONNET/model_node_express (perso, SSH alias github.com-perso)
- module_system: ESM native (NodeNext) — relative imports REQUIRE `.js` extension
- runtime: Node ≥ 20.6 (uses native `--env-file=.env`)
- applicable_global_rules: typescript.md

## stack
| domain | lib | version | notes |
|---|---|---|---|
| http | express | 4.21 | |
| orm | prisma + @prisma/adapter-pg | 7.8 | adapter-based (no binary query engine), driver: pg native |
| driver | pg | 8.21 | |
| ws | socket.io | 4.8 | attached to HTTP server (no separate port) |
| headers | helmet | 8 | CSP/HSTS/X-Frame |
| cors | cors | 2.8 | custom whitelist (configCors.ts) |
| env | dotenv | 17 | used by prisma.config.ts |
| lint | @biomejs/biome | 2.3 | NO eslint/prettier; tab indent, lineWidth 80 |
| dev | tsx + nodemon | 4.19 / 3.1 | watch + reload no build |
| ts | typescript | 5.9 | strict:true, target ES2022, module NodeNext |

## not_in_stack (volontaire, ajouter par projet)
- no logger (winston/pino) — uses patched console
- no validation (zod/joi) — pattern in service throws ClassCustomError
- no tests (jest/vitest) — none
- no auth (passport/jose) — token extracted but never validated

## structure
```
src/
  index.ts                            # bootstrap (6 steps)
  configExpress.ts                    # createApp() — middlewares + router + error handler
  configCors.ts                       # createCorsMiddleware() — whitelist validation
  configPrisma.ts                     # prisma singleton + connectPrisma()
  configSocket.ts                     # createSocketServer(httpServer) — io handshake + registerSocket
  lib/                                # cf. src/lib/CLAUDE.md
  api/                                # cf. src/api/CLAUDE.md
  externalApi/                        # empty (placeholder) — cf. src/externalApi/CLAUDE.md
  database/                           # empty (placeholder for raw SQL / seeds if needed)
  types/
    request.ts                        # augments Express.Request with .config
    socket.ts                         # Socket.io types (events + data)
prisma/
  schema.prisma                       # model User { id, socketId? } — stub
prisma.config.ts                      # loader (dotenv + DATABASE_URL forced)
nodemon.json                          # watch src/, exec tsx --env-file=.env src/index.ts
tsconfig.json, biome.jsonc, package.json
.env                                  # API_PORT, DATABASE_URL, CORS_ALLOWED_ORIGINS, DEFAULT_LANGAGE
.gitignore                            # node_modules, dist, .DS_Store, .vscode
```

## bootstrap (src/index.ts — strict order)
1. `applyColors()` — patch console.info(blue)/console.error(red); MUST be first
2. `await connectPrisma()` — open pg connection; throw if DATABASE_URL absent
3. `const app = createApp()` — Express + middlewares + router (cf. pipeline)
4. `const httpServer = app.listen(API_PORT)` — start HTTP
5. `createSocketServer(httpServer)` — attach Socket.io to same server
6. listen error handlers: EADDRINUSE/EACCES → throw ClassCustomError

## express pipeline (src/configExpress.ts — strict order)
```
app.use(helmet())
app.use(createCorsMiddleware())                # validates origin against CORS_ALLOWED_ORIGINS
app.use(express.json({ limit: "100kb" }))      # JSON only; no urlencoded/multipart
app.use(configRequest)                          # extracts Accept-Language + Authorization → req.config
app.use(apiRouter)                              # cf. src/api/CLAUDE.md
app.use(errorHandler)                           # catches ClassCustomError → res.status().json({ message, status })
```

## req.config (src/types/request.ts)
```ts
declare global { namespace Express { interface Request {
  config?: { locale?: EnumLocale; tokenConnection?: string };
}}}
```
- locale: first 2 chars of Accept-Language IF in EnumLocale, else undefined
- tokenConnection: bearer token string (raw, NOT validated)

## cors
- source: env `CORS_ALLOWED_ORIGINS` (comma-separated)
- empty/absent → ALL origins allowed (NEVER in prod — always whitelist)
- format strict: `^https?://...$` regex per origin (silent skip if not matching)
- credentials: true

## prisma
- schema: `prisma/schema.prisma` — model User { id String @id @default(cuid()), socketId String? }
- adapter: `new PrismaPg({ connectionString: DATABASE_URL })` + `new PrismaClient({ adapter })`
- ONE singleton; never `new PrismaClient()` elsewhere
- sync: `prisma db push` (dev+start scripts; NO migrations historized)
- to use migrations: replace db push with `prisma migrate dev`/`prisma migrate deploy`, create `prisma/migrations/`

## socket.io (src/configSocket.ts)
- attached to httpServer (no separate port)
- handshake middleware: extracts Accept-Language + token (header OR socket.handshake.auth.token) → `socket.data.config = { locale?, tokenConnection? }`
- per connection: calls `registerSocket(socket)` (src/api/socket/index.ts)

## logging
- NO external logger
- `console.info` → blue (via lib/console/applyColors)
- `console.error` → red
- i18n logs: `trad("info.x", "namespace", args)?.console.info()` (ClassTranslation.console.info/error)

## validation
- NO dependency
- pattern: validate IN service (NOT controller); on invalid → `throw new ClassCustomError("errors.x", "api/y", args, undefined, 400)`

## auth
- NO built-in
- token extracted to req.config.tokenConnection (HTTP) and socket.data.config.tokenConnection (WS) — NOT validated
- to add: protection middleware (e.g. requireAuth), JWT verify (jose/jsonwebtoken), DB lookup

## i18n (src/lib/trad/)
- 28 locales declared in EnumLocale (fr/en/es/de/it/pt/nl/pl/ru/ja/zh/ko/ar/tr/sv/da/no/fi/cs/el/he/hi/th/vi/id/uk/ro/hu)
- registry: src/lib/trad/translations.ts — currently fr/* complete, en/* stub
- hook: `trad(key, file, args?, locale?)` → ClassTranslation | undefined
  - key: dot-notated (`"errors.portAlreadyInUse"`)
  - file: namespace (`"config/configExpress"`)
  - default locale: env `DEFAULT_LANGAGE` (NOTE: spelling `LANGAGE` not `LANGUAGE`) || "fr"
- TypeNamespace: auto-derived from `keyof translations.fr`

## scripts (package.json)
| script | command | use |
|---|---|---|
| dev | `prisma db push && nodemon` | watch via tsx, push schema each restart |
| build | `tsc` | compile to dist/ |
| start | `prisma db push && node --env-file=.env dist/index.js` | prod post-build |
| typecheck | `tsc --noEmit` | CI types check |
| lint | `npx biome check --write` | lint + autofix |
| lint:fix | `npx biome format --write` | format only |
| lint:check | `npx biome check` | CI read-only |

## env vars
| var | required | default | role |
|---|---|---|---|
| API_PORT | no | 3000 | HTTP + Socket.io port |
| DEFAULT_LANGAGE | no | fr | trad() fallback locale (sic: LANGAGE) |
| CORS_ALLOWED_ORIGINS | no | (empty=`*`) | whitelist, comma-separated |
| DATABASE_URL | **YES** | — | postgres connection string |

`.env` is committed (template values). Override via runtime secrets in prod.

## invariants
- ESM imports keep `.js`: `import { foo } from "./bar.js"` even if `bar.ts`
- helmet FIRST middleware always
- one PrismaClient instance only
- connectPrisma() resolves before createApp() (or routes serve with disconnected client)

## pitfalls
- missing `.js` in relative import → runtime "Cannot find module"
- `tsx` skips typecheck — run `npm run typecheck` before commit/push
- `prisma db push` repushes schema every restart — change → restart
- CORS empty = wildcard (dev only)
- req.config may have undefined sub-props — use `req.config?.tokenConnection`
- no `express-async-errors`: `throw` in async handler without try/catch isn't forwarded to errorHandler (Express ≤4 limitation)
- ClassCustomError double-wrap prevention: passing CCE as errorOrigine returns it as-is
- console patch: `applyColors` is global; programmatic capture of stdout sees ANSI codes
- `DEFAULT_LANGAGE` misspelling: keep as-is in env+resolver, do NOT rename

## sub-claude pointers
- src/lib/CLAUDE.md — console patch, ClassCustomError, trad system
- src/api/CLAUDE.md — routers, controllers, services, socket handlers, configRequest middleware
- src/externalApi/CLAUDE.md — empty placeholder; convention for third-party API wrappers
