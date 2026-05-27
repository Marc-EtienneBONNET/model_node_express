# src/api/controllers/

> ⚠ MAINTENANCE: any new controller, signature change, response shape change, new status code convention → update this CLAUDE.md SAME SESSION.

## meta
- role: HTTP handlers — parse `req` → call service → respond
- responsibilities: destructure req.{params,body,query,config}, call service, set status code, send JSON
- NOT responsibilities: business logic, Prisma calls, validation deeper than primitive checks
- 1 file per resource: `<resource>Controller.ts` exporting named handler functions

## current files
| file | exports |
|---|---|
| exempleController.ts | getOne, postOne, patchOne, deleteOne |

## handler shape (template — exempleController.ts)
```ts
import type { Request, Response } from "express";
import { createExemple, deleteExemple, findExempleById, updateExemple } from "../services/exempleService.js";

export function getOne(req: Request, res: Response): void {
  const _propsParams = req.params;
  const _propsBody = req.body;
  const _propsQuery = req.query;
  const _propsConfig = req.config;
  const exemple = findExempleById();
  res.json({ data: exemple });
}
// postOne → 201 + json
// patchOne → 200 + json
// deleteOne → 204 + send()
```

## status code conventions
| operation | status |
|---|---|
| GET success | 200 (implicit via `res.json`) |
| POST success (created) | 201 |
| PATCH success | 200 |
| DELETE success | 204 (`res.status(204).send()`, no body) |
| Validation/auth/business error | throw `ClassCustomError(..., status)`; errorHandler renders |

## response shape
- success: `{ data: <result> }` (envelope)
- error (from errorHandler in configExpress): `{ message, status }`
- consistent across the API (envelope `data`)

## adding a controller
1. create `controllers/<name>Controller.ts`
2. import services from `../services/<name>Service.js`
3. export ONE function per HTTP action (`getOne`, `postOne`, `getById`, `patchById`, etc.)
4. signature ALWAYS `(req: Request, res: Response): void` (or `Promise<void>` if async)
5. for async handlers: wrap throws in try/catch and `next(err)` OR add `express-async-errors` (Express ≤4 limitation)

## invariants
- controllers IMPORT from `../services/`, NOT `../../configPrisma`
- prefix `_propsXxx` on destructured-but-unused locals (Biome `noUnusedVariables` exempts `_`-prefixed)
- NO direct `prisma.user.findUnique(...)` in controllers — call service
- `res.json({...})` envelope `{ data }` for success; never raw value

## pitfalls
- async throw without try/catch in Express 4 doesn't reach errorHandler — wrap or add lib
- destructuring `req.config` returns `undefined` if middleware not set it; use optional chaining
- forgetting `res.send()` after `res.status(204)` for DELETE → response never sent (hangs)
- forgetting `return` after `res.json()` in async with branching → double-send error

## public api (refacto-stable)
- per file: handler function names (`getOne`, `postOne`, etc.) — consumed by routers
