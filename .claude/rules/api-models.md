# API — models

> ⚠ MAINTENANCE: once this folder is populated (or removed), update this CLAUDE.md SAME SESSION.

## meta
- role: placeholder for API-level model representations (DTOs, view models, request/response shapes)
- current_state: **EMPTY** (no files)

## intent
This folder exists for cases where the Prisma model isn't directly suitable as API I/O shape:
- input DTO (different from Prisma model — e.g. omit `id`, `createdAt`)
- output DTO (with computed fields, hidden sensitive fields)
- nested response shapes

## convention (when populated)
- 1 file per resource: `<resource>Model.ts` or `<resource>Dto.ts`
- export types: `TypeXxxRequest`, `TypeXxxResponse`, `TypeXxxCreateDto`, etc.
- naming follows global rule typescript.md (`TypeXxx`, `InterXxx`)
- transformation logic (Prisma model → DTO) lives in `../services/` (NOT here)

## decision tree
| need | location |
|---|---|
| DB model shape | `prisma/schema.prisma` (cf. prisma/CLAUDE.md) |
| Raw API request/response (matches Prisma) | inline in service/controller types |
| Shaped DTO different from Prisma | here, in `<resource>Model.ts` |
| Validation schema (zod/joi) | NOT here — add in service (or new `validators/` folder) |

## alternative
If you never need DTOs different from Prisma models, this folder can be deleted. Decision deferred to project.

## adding a file
1. create `models/<resource>Model.ts`
2. export `type TypeXxx*` shapes
3. import from controllers/services as needed
4. update this CLAUDE.md with the new file

## why empty in template
The template's only Prisma model is `User { id, socketId? }` — trivial enough to use directly. Real projects will likely populate this folder.
