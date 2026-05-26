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
