# src/api/routers/

> ⚠ MAINTENANCE: any new resource router added/removed, any route signature change → update this CLAUDE.md SAME SESSION.

## meta
- role: declare Express routes per resource + central mount point
- pattern: 1 file per resource + index.ts = `apiRouter` aggregator
- mounted_at: configExpress.ts → `app.use(apiRouter)`

## current files
| file | exports | role |
|---|---|---|
| index.ts | `apiRouter` | central Router; `apiRouter.use("/<resource>", <resourceRouter>)` |
| exemple.ts | `exempleRouter` | CRUD `/exemple` (GET/POST/PATCH/DELETE on `/`) |

## index.ts current content
```ts
import { Router } from "express";
import { exempleRouter } from "./exemple.js";
export const apiRouter = Router();
apiRouter.use("/exemple", exempleRouter);
```

## exemple.ts current content
```ts
import { Router } from "express";
import { deleteOne, getOne, patchOne, postOne } from "../controllers/exempleController.js";
export const exempleRouter = Router();
exempleRouter.get("/", getOne);
exempleRouter.post("/", postOne);
exempleRouter.patch("/", patchOne);
exempleRouter.delete("/", deleteOne);
```

## adding a new resource
1. create `routers/<name>.ts`:
   - `import { Router } from "express"`
   - `import { handlers } from "../controllers/<name>Controller.js"`
   - declare routes
   - `export const <name>Router`
2. register in `routers/index.ts`: `apiRouter.use("/<name>", <name>Router)`
3. ensure controller and service exist (see ../controllers/CLAUDE.md and ../services/CLAUDE.md)

## invariants
- ESM imports keep `.js`
- ONE place to mount sub-routers: `routers/index.ts`
- router file exports ONLY the Router instance (no controllers, no helpers)
- protect routes via middlewares mounted on the router OR per-route: `xxxRouter.get("/", requireAuth, getOne)`

## pitfalls
- declaring a route in `routers/index.ts` directly (instead of dedicated file) breaks the pattern — keep one resource = one file
- forgetting `.js` in import → runtime error
- `app.use(apiRouter)` is mounted WITHOUT prefix in configExpress.ts — routes are at root (no `/api`). If you want `/api`, change `configExpress.ts`, not here.

## public api (refacto-stable)
- `apiRouter` (from `./index.js`) — consumed by configExpress
- `<resource>Router` per file (consumed by `./index.js`)
