import type { DefaultEventsMap } from "socket.io";
import type { EnumLocale } from "../lib/trad/enum/enumLocale.js";

export type TypeClientToServerEvents = DefaultEventsMap;
export type TypeServerToClientEvents = DefaultEventsMap;
export type TypeInterServerEvents = DefaultEventsMap;

export type TypeSocketData = {
	config: {
		locale?: EnumLocale;
		tokenConnection?: string;
	};
};
