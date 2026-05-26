import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { registerSocket } from "./api/socket/index.js";
import { EnumLocale } from "./lib/trad/enum/enumLocale.js";
import { useTranslation } from "./lib/trad/hook/useTranslation.js";
import type {
	TypeClientToServerEvents,
	TypeInterServerEvents,
	TypeServerToClientEvents,
	TypeSocketData,
} from "./types/socket.js";

type TypeIo = Server<
	TypeClientToServerEvents,
	TypeServerToClientEvents,
	TypeInterServerEvents,
	TypeSocketData
>;

export function createSocketServer(httpServer: HttpServer): TypeIo {
	const io: TypeIo = new Server(httpServer, {
		cors: {
			origin:
				process.env.CORS_ALLOWED_ORIGINS?.split(",").map((o) => o.trim()) ??
				"*",
			credentials: true,
		},
	});

	io.use((socket, next) => {
		const authFromHandshake = socket.handshake.auth?.token;
		const localeFromHandshake = socket.handshake.auth?.locale;
		const authHeader = socket.handshake.headers.authorization;
		const acceptLanguage = socket.handshake.headers["accept-language"];

		const rawLocale =
			(typeof localeFromHandshake === "string"
				? localeFromHandshake
				: undefined) ??
			(typeof acceptLanguage === "string"
				? acceptLanguage.slice(0, 2)
				: undefined);
		const localeKey = rawLocale?.toLowerCase();
		const locale =
			localeKey && localeKey in EnumLocale
				? EnumLocale[localeKey as keyof typeof EnumLocale]
				: undefined;

		const tokenConnection =
			(typeof authFromHandshake === "string" ? authFromHandshake : undefined) ??
			(authHeader?.startsWith("Bearer ")
				? authHeader.slice("Bearer ".length).trim() || undefined
				: undefined);

		socket.data.config = { locale, tokenConnection };
		next();
	});

	useTranslation("info.ready", "config/configSocket")?.console.info();
	io.on("connection", (socket) => {
		useTranslation("info.connected", "config/configSocket", {
			id: socket.id,
			locale: socket.data.config.locale ?? "?",
			token: socket.data.config.tokenConnection ? "oui" : "non",
		})?.console.info();

		registerSocket(socket);

		socket.on("disconnect", (reason) => {
			useTranslation("info.disconnected", "config/configSocket", {
				id: socket.id,
				reason,
			})?.console.info();
		});
	});

	return io;
}
