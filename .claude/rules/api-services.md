# API — services

> ⚠ MAINTENANCE: any new service, signature change, new Prisma query pattern, new error key → update this CLAUDE.md SAME SESSION.

## meta
- role: business logic + Prisma queries + applicative validation
- responsibilities: validate inputs, call `prisma.*`, transform results, throw ClassCustomError on invalid
- NOT responsibilities: touching req/res, HTTP status codes, JSON envelope (controllers do that)
- depends: [src/configPrisma (`prisma` singleton), src/lib/customError, src/lib/trad]
- 1 file per resource: `<resource>Service.ts` exporting named functions

## current files
| file | exports |
|---|---|
| exempleService.ts | findExempleById, createExemple, updateExemple, deleteExemple (stubs returning boolean) |

## current template (exempleService.ts)
```ts
export function findExempleById(): boolean {
  console.log("findExempleById");
  return true;
}
// createExemple, updateExemple, deleteExemple — same stub shape
```

## expected real shape (when implementing)
```ts
import { prisma } from "../../configPrisma.js";
import { ClassCustomError } from "../../lib/customError/classCustomError.js";

export async function findExempleById(id: string): Promise<Exemple> {
  if (!id) {
    throw new ClassCustomError("errors.idRequired", "api/exemple", undefined, undefined, 400);
  }
  const exemple = await prisma.exemple.findUnique({ where: { id } });
  if (!exemple) {
    throw new ClassCustomError("errors.notFound", "api/exemple", { id }, undefined, 404);
  }
  return exemple;
}
```

## validation pattern
- check inputs first (presence, type, format)
- on invalid → `throw new ClassCustomError("errors.<key>", "api/<resource>", args?, undefined, status)`
- `<key>` in `src/lib/trad/json/fr/api/<resource>.json` (and en/ mirror)
- status: 400 (validation), 404 (not found), 409 (conflict), 401/403 (auth), 500 (unexpected)

## adding a service
1. create `services/<name>Service.ts`
2. import `prisma` + `ClassCustomError`
3. export ONE async function per business operation
4. validations → throw CCE early
5. Prisma calls → await, return result
6. add error keys in `src/lib/trad/json/fr/api/<name>.json` + `en/` mirror
7. add the namespace `"api/<name>"` consumption is auto-typed via TypeNamespace

## invariants
- NEVER import `Request`/`Response` from express — service is HTTP-agnostic
- ALWAYS go through `prisma` singleton (NEVER `new PrismaClient()` here)
- throws are typed: `ClassCustomError` only (NOT plain `Error`) so errorHandler can render i18n message + status
- service signatures take primitives (string, number, object), return primitives or models (NOT Request/Response)

## pitfalls
- forgetting `await` on Prisma call → returns Promise, controller serializes weird object
- creating a `new PrismaClient()` instead of importing singleton → connection pool explosion
- throw raw `Error("message")` → status 500 + generic message (i18n lost)
- async service called sync in controller (`const x = service()` instead of `await service()`) → x is a Promise

## public api (refacto-stable)
- per file: named function exports — consumed by controllers
- coupling: 1 service file ↔ 1 controller file ↔ 1 router file (same `<name>`)
