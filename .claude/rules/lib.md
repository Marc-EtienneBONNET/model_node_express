# lib

> ⚠ MAINTENANCE: any new utility, signature change, new locale/namespace, refacto of ClassCustomError → update this CLAUDE.md SAME SESSION.

## meta
- role: transverse utilities (console color patch, typed error class with i18n, i18n system)
- layer: bottom — NEVER imports from api/, externalApi/, configXxx.ts
- ESM imports always with `.js` extension

## structure
```
lib/
  processHandlers/processHandlers.ts       # side-effect: install uncaughtException/unhandledRejection handlers
  console/applyColors.ts                   # side-effect: patch console.info/error colors
  customError/classCustomError.ts          # ClassCustomError extends Error
  trad/
    hook/trad.ts                           # trad(key, file, args?, locale?) → ClassTranslation | undefined
    class/classTranslation.ts              # ClassTranslation { value; console:{log,info,error}; toString() }
    enum/enumLocale.ts                     # EnumLocale (28 keys)
    types/typeArgs.ts                      # TypeArgs = Record<string, string|number|boolean>
    translations.ts                        # registry { fr: {...}, en: {} } + TypeLocale + TypeNamespace
    json/
      fr/
        config/{configExpress,configCors,configPrisma,configSocket}.json
        lib/processHandlers.json
        api/exemple.json
        errorMachine/classCustomError.json
      en/                                  # stub
```

## processHandlers/processHandlers.ts
- exports: nothing (side-effect only — installs handlers at top-level on import)
- patches: `process.on("uncaughtException")` + `process.on("unhandledRejection")`
- behaviour: wraps the raw error into `new ClassCustomError(...).console()` then `process.exit(1)`
- special case: `MODULE_NOT_FOUND` with message matching `\.prisma[\\/]client` → reports `"errors.clientNotGenerated"` in `config/configPrisma` (suggests `npx prisma generate`)
- fallback keys: `errors.uncaughtException` / `errors.unhandledRejection` (namespace `lib/processHandlers`)
- MUST be imported in `src/index.ts` as the FIRST import — only this guarantees the handlers are active before module-loading errors are thrown (e.g. import of an ungenerated `@prisma/client`)
- defensive: the `reportFatal` function wraps the report itself in try/catch and falls back to raw `console.error` if `ClassCustomError` / `trad` chain misbehaves — this is the bottom safety net, it MUST NOT throw

## console/applyColors.ts
- exports: nothing (side-effect only)
- patches: `console.info` (blue via `util.styleText("blue", …)`), `console.error` (red)
- MUST be imported in `src/index.ts` BEFORE any console.info/error usage (and AFTER processHandlers, so its own colored output benefits)

## customError/classCustomError.ts
```ts
class ClassCustomError extends Error {
  readonly statusCode: number;     // default 500
  readonly key?: string;
  readonly file?: string;
  readonly args?: TypeArgs;
  
  constructor(
    key?: string,
    file?: string,
    args?: TypeArgs,
    errorOrigine?: Error | ClassCustomError,
    statusCode?: number,
  );
  
  console(): this;                  // log red + details + cause if present
}
```

### constructor behavior
1. NO double-wrap: `errorOrigine instanceof ClassCustomError` → return errorOrigine as-is
2. validation (throws ClassCustomError itself on misuse):
   - key without file → throw
   - file without key → throw
   - args/statusCode without (key, file) → throw
   - no params at all → throw
3. message: `trad(key, file, args)?.value` or fallback to raw `key`
4. statusCode: param or 500
5. captures stack: `Error.captureStackTrace(this, ClassCustomError)`
6. preserves cause via `.cause = errorOrigine`

### usage patterns
| case | form |
|---|---|
| business error i18n | `throw new ClassCustomError("errors.x", "api/y", { ... }, undefined, 400)` |
| wrap native (db/net) | `throw new ClassCustomError("errors.x", "api/y", undefined, originalErr, 500)` |
| transparent re-throw | `throw new ClassCustomError(undefined, undefined, undefined, alreadyCCE)` → returns alreadyCCE |

## trad/ system

### hook signature
```ts
function trad(
  key: string,                            // e.g. "errors.portAlreadyInUse"
  file: string,                           // e.g. "config/configExpress"
  args?: TypeArgs,                         // e.g. { port: 3000 }
  locale?: EnumLocale,                     // default: process.env.DEFAULT_LANGAGE || "fr"
): ClassTranslation | undefined;
```

### resolution
- lookup: `translations[locale][file]` → drill-down via key dot-notated
- interpolation: `{xxx}` (no spaces) → `String(args.xxx)`; missing args left as `{xxx}` raw
- not-found → returns `undefined` (safe-chain: `trad(...)?.console.info()`)

### ClassTranslation
- `.value: string` — interpolated message
- `.console.info()` — log blue
- `.console.error()` — log red
- `.console.log()` — log default
- `.toString()` — returns value (allows `String(trad(...))`)

### EnumLocale (28)
fr, en, es, de, it, pt, nl, pl, ru, ja, zh, ko, ar, tr, sv, da, no, fi, cs, el, he, hi, th, vi, id, uk, ro, hu

### TypeNamespace (auto-derived)
`type TypeNamespace = keyof (typeof translations)["fr"]` — current values: `"config/configExpress" | "config/configCors" | "config/configPrisma" | "config/configSocket" | "errorMachine/classCustomError" | "lib/processHandlers" | "api/exemple"`

### adding a locale
1. mkdir `src/lib/trad/json/<locale>/{config,api,errorMachine}/`
2. mirror FR JSON files, translate
3. `import xxx from "./json/<locale>/<ns>.json" with { type: "json" }` in translations.ts
4. add to EnumLocale

### adding a namespace
1. create `src/lib/trad/json/fr/<file>/` + JSON (and en/ mirror, even stub)
2. import in translations.ts
3. use: `trad("key.path", "<file>", ...)`

## conventions
- naming: ClassXxx (PascalCase prefix), EnumXxx, TypeXxx; vars/fn camelCase
- ESM imports `.js`
- NEVER import from api/, externalApi/, configXxx.ts

## invariants
- processHandlers FIRST import of src/index.ts (before applyColors and before any other import that could throw at module load)
- applyColors() right after processHandlers — patches console BEFORE any other code logs
- ClassCustomError no double-wrap
- trad() returns undefined on missing key (silent) — caller chains with `?.`
- JSON imports REQUIRE `with { type: "json" }` (ESM runtime requirement)

## pitfalls
- console.info/error before applyColors() → uncolored output
- interpolation `{ foo }` (with spaces) doesn't match — must be `{foo}`
- missing args leave `{foo}` raw in message
- `captureStackTrace` is V8-only; Bun/Deno = silent no-op
- env var spelling: `DEFAULT_LANGAGE` (NOT LANGUAGE) — do not "fix" without coordinated rename

## public api (refacto-stable)
- processHandlers (side-effect)
- applyColors (side-effect)
- ClassCustomError (class)
- trad, ClassTranslation, EnumLocale, TypeArgs, TypeLocale, TypeNamespace, translations
