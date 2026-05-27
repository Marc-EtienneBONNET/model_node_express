# API

> ⚠ MAINTENANCE: any new resource (router+controller+service), new middleware, new socket event → update this CLAUDE.md AND the relevant sub-folder CLAUDE.md. SAME SESSION.

## meta
- role: HTTP REST + WebSocket application layer
- pattern: feature/domain-based (resource = router + controller + service triplet)
- mount_point: configExpress.ts → `app.use(apiRouter)` (after configRequest, before errorHandler)
- depends: [express, socket.io, src/lib/customError, src/lib/trad, src/configPrisma (via services), src/types/{request,socket}]

## structure
```
api/
  routers/             # mount points (Express Router), cf. routers/CLAUDE.md
  controllers/         # HTTP handlers (parse req → call service → respond), cf. controllers/CLAUDE.md
  services/            # business logic, db calls, validation, cf. services/CLAUDE.md
  middlewares/         # configRequest only currently, cf. middlewares/CLAUDE.md
  models/              # EMPTY placeholder, cf. models/CLAUDE.md
  socket/              # registerSocket(socket) — handlers WS, cf. socket/CLAUDE.md
```

## triplet pattern (per resource)
| layer | file | responsibility |
|---|---|---|
| router | routers/<name>.ts | declare routes (`router.get/post/patch/delete`), mount middlewares, bind controllers |
| controller | controllers/<name>Controller.ts | destructure req.{params,body,query,config} → call service → `res.status().json()` |
| service | services/<name>Service.ts | validations, business logic, Prisma calls; throws ClassCustomError on invalid; NEVER touches req/res |

### example wiring (exemple resource)
```
routers/index.ts          apiRouter.use("/exemple", exempleRouter)
routers/exemple.ts        exempleRouter.{get,post,patch,delete}("/", controllers...)
controllers/exempleController.ts  getOne/postOne/patchOne/deleteOne
services/exempleService.ts        findExempleById/createExemple/updateExemple/deleteExemple
```

## current routes
| method | path | controller | service | success status |
|---|---|---|---|---|
| GET | /exemple | getOne | findExempleById | 200 |
| POST | /exemple | postOne | createExemple | 201 |
| PATCH | /exemple | patchOne | updateExemple | 200 |
| DELETE | /exemple | deleteOne | deleteExemple | 204 |

- no `:id` params in template — add when extending (`/:id` then `req.params.id`)
- no auth middleware mounted in template — add at router or controller level

## validation location
- **in service** (NOT controller)
- on invalid: `throw new ClassCustomError("errors.x", "api/<resource>", { ... }, undefined, 400)`
- caught by errorHandler in configExpress → JSON response `{ message, status }`

## socket layer
- entry: socket/index.ts → `registerSocket(socket: TypeAppSocket)`
- called by configSocket.ts on each new connection
- pattern: `socket.on("eventName", (data) => { … socket.emit("response", payload) })`
- typed via `Socket<C2S, S2C, InterServer, SocketData>` from `src/types/socket.ts`

## invariants
- ESM imports keep `.js` (e.g. `from "../services/exempleService.js"`)
- controllers do NOT call Prisma directly — go through services
- services do NOT touch req/res — receive primitives, return primitives or throw
- routers mount ONLY in `routers/index.ts` (single mount point per `apiRouter`)
- 1 file = 1 controller function group; renaming a controller → rename router import path + sync CLAUDE.md

## pitfalls
- async throws in controllers without try/catch are NOT forwarded by Express ≤4 errorHandler — wrap manually OR add `express-async-errors`
- prefix `_props*` on unused params in template is intentional (Biome `noUnusedVariables` errors otherwise — `_` prefix exempted)
- `req.config` may be undefined per-prop — use `req.config?.tokenConnection`

## sub-claude pointers
- routers/CLAUDE.md
- controllers/CLAUDE.md
- services/CLAUDE.md
- middlewares/CLAUDE.md
- models/CLAUDE.md
- socket/CLAUDE.md
