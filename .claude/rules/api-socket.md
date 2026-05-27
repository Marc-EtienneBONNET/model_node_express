# API — socket

> ⚠ MAINTENANCE: any new event listened/emitted, type change, refacto of registerSocket → update this CLAUDE.md SAME SESSION. ALSO update client side (model_react_native_expo `src/socket/CLAUDE.md`) for event sync.

## meta
- role: register Socket.io handlers per connection
- entry: index.ts
- called_by: src/configSocket.ts on each new connection
- depends: [socket.io, src/types/socket]

## current implementation (index.ts)
```ts
import type { Socket } from "socket.io";
import type {
  TypeClientToServerEvents,
  TypeInterServerEvents,
  TypeServerToClientEvents,
  TypeSocketData,
} from "../../types/socket.js";

type TypeAppSocket = Socket<
  TypeClientToServerEvents,
  TypeServerToClientEvents,
  TypeInterServerEvents,
  TypeSocketData
>;

export function registerSocket(socket: TypeAppSocket): void {
  socket.on("ping", (data) => {
    console.log("ping");
    socket.emit("pong", {});
  });
}
```

## events
| direction | events_now | payload | notes |
|---|---|---|---|
| listened (C→S) | ping | (data, unused) | demo handler logs + emits pong |
| emitted (S→C) | pong | `{}` | empty object |

## types (src/types/socket.ts)
- `TypeClientToServerEvents = DefaultEventsMap` (untyped placeholder)
- `TypeServerToClientEvents = DefaultEventsMap`
- `TypeInterServerEvents = DefaultEventsMap`
- `TypeSocketData = { config: { locale?: EnumLocale; tokenConnection?: string } }`

To type events strictly: replace DefaultEventsMap with explicit interfaces:
```ts
interface TypeClientToServerEvents {
  ping: (data: TypePingPayload) => void;
  authLogin: (token: string, ack: (ok: boolean) => void) => void;
}
```

## adding an event listener
1. inside `registerSocket(socket)`, add `socket.on("eventName", (payload) => { … })`
2. for typed events: extend `TypeClientToServerEvents` in `src/types/socket.ts`
3. on cleanup logic per connection: use `socket.on("disconnect", () => …)` (socket-scoped, auto-cleaned)
4. update CLIENT side accordingly (model_react_native_expo)

## emitting (from anywhere)
- single client: `socket.emit("name", payload)`
- broadcast all: `io.emit("name", payload)` (requires io reference; currently not exposed — refacto needed if used)
- room: `socket.to("roomName").emit("name", payload)` (after `socket.join("roomName")`)

## access to handshake config
- `socket.data.config.locale` and `.tokenConnection` set by configSocket.ts handshake middleware
- use for per-connection i18n message via `trad(...)?.value` with explicit `locale: socket.data.config.locale`
- use `.tokenConnection` to identify the user (validate it in your own auth logic — NOT validated here)

## invariants
- registerSocket is called ONCE per connection
- handlers are scoped to the `socket` instance — disconnect auto-removes them
- io-level events (`io.on("connection", …)`) live in `src/configSocket.ts`, NOT here
- ALL events MUST be mirrored client-side in model_react_native_expo (same name + payload shape)

## pitfalls
- handler in `registerSocket` is per-connection — accumulates if you re-register accidentally (avoid calling registerSocket twice for the same socket)
- emit without payload: `socket.emit("name")` is allowed in untyped mode, breaks if events are typed (some require payload arg)
- console.log("ping") is debug-only — replace with `trad("info.ping", "api/socket", undefined, socket.data.config.locale)?.console.info()` when promoting to real i18n logs
- backend↔frontend event drift: changing event name here without updating client = silent runtime mismatch

## public api (refacto-stable)
- `registerSocket(socket: TypeAppSocket): void` — consumed by configSocket.ts
