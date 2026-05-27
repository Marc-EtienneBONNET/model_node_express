# API — middlewares

> ⚠ MAINTENANCE: any new middleware, signature/order change, new header parsed, new req.* extension → update this CLAUDE.md SAME SESSION.

## meta
- role: Express middlewares (request preprocessing) — signature `(req, res, next) => void`
- mounted_in: src/configExpress.ts (in pipeline order)
- 1 file per middleware

## current files
| file | exports | mounted_in pipeline_position |
|---|---|---|
| configRequest.ts | `configRequest` | configExpress.ts after body-parser, before apiRouter |

## configRequest.ts (current implementation)
```ts
import type { NextFunction, Request, Response } from "express";
import { EnumLocale } from "../../lib/trad/enum/enumLocale.js";

export function configRequest(req: Request, _res: Response, next: NextFunction): void {
  const acceptLanguage = req.headers["accept-language"];
  const localeKey = typeof acceptLanguage === "string"
    ? acceptLanguage.slice(0, 2).toLowerCase()
    : undefined;
  const locale = localeKey && localeKey in EnumLocale
    ? EnumLocale[localeKey as keyof typeof EnumLocale]
    : undefined;

  const authHeader = req.headers.authorization;
  const tokenConnection = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim() || undefined
    : undefined;

  req.config = { locale, tokenConnection };
  next();
}
```

### what it does
- reads `Accept-Language` header → takes first 2 chars lowercase → if in `EnumLocale`, sets `req.config.locale`; else undefined
- reads `Authorization` header → if starts with `"Bearer "`, extracts trimmed token; else undefined
- assigns `req.config = { locale, tokenConnection }`
- calls `next()`

### req.config typing
- declared in `src/types/request.ts` (Express namespace augmentation)
- shape: `{ locale?: EnumLocale; tokenConnection?: string }`

## adding a middleware
1. create `middlewares/<name>.ts`
2. signature: `function <name>(req: Request, res: Response, next: NextFunction): void`
3. always call `next()` (or `next(err)` to forward to errorHandler)
4. mount in `src/configExpress.ts` at the right pipeline position
5. if it augments `Request`, declare in `src/types/request.ts`

## pipeline order (configExpress.ts — recap)
```
helmet → cors → express.json → configRequest → apiRouter → errorHandler
```
- DO NOT move configRequest before body-parser if it ever reads `req.body` (currently it doesn't, but stays after for consistency)
- DO NOT move after apiRouter — routes need `req.config` available

## invariants
- ALWAYS call `next()` (or `next(err)`) — middleware not calling next() = request hangs
- middleware NEVER calls `res.send()` directly except for short-circuit cases (auth fail before route)
- middleware augmenting `req` types DOES augment in `src/types/request.ts` (single declaration file)

## pitfalls
- forgetting `next()` → request hangs forever
- using `as` cast on `req.config` without type augmentation → typecheck passes, runtime undefined
- `Bearer  token` (double space) → `slice("Bearer ".length)` includes leading space; `.trim()` handles it — keep the `.trim()`
- Accept-Language can be `"en-US,en;q=0.9"` (full RFC) — current impl takes only first 2 chars (`"en"`), ignoring quality. Sufficient for our 28 locales matching.

## public api (refacto-stable)
- `configRequest` (consumed by configExpress.ts)
- future middlewares export named function
