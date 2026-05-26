import "./lib/console/applyColors.js";
import { createApp } from "./configExpress.js";
import { connectPrisma } from "./configPrisma.js";
import { createSocketServer } from "./configSocket.js";
import { ClassCustomError } from "./lib/customError/classCustomError.js";
import { trad } from "./lib/trad/hook/trad.js";

async function main(): Promise<void> {
	const port = Number(process.env.API_PORT) || 3000;

	await connectPrisma();

	const app = createApp();

	const server = app.listen(port, () => {
		const address = server.address();
		const url =
			typeof address === "string"
				? address
				: `http://localhost:${address?.port ?? port}`;
		trad("info.listening", "config/configExpress", {
			url,
		})?.console.info();
	});

	createSocketServer(server);

	server.on("error", (err: NodeJS.ErrnoException) => {
		switch (err.code) {
			case "EADDRINUSE":
				new ClassCustomError(
					"errors.portAlreadyInUse",
					"config/configExpress",
					{ port },
					err,
				).console();
				process.exit(1);
				break;
			case "EACCES":
				new ClassCustomError(
					"errors.portPermissionDenied",
					"config/configExpress",
					{ port },
					err,
				).console();
				process.exit(1);
				break;
			default:
				new ClassCustomError(
					"errors.unknownSystemError",
					"config/configExpress",
					{ port },
					err,
				).console();
				process.exit(1);
		}
	});
}

main().catch((err) => {
	new ClassCustomError(undefined, undefined, undefined, err as Error).console();
	process.exit(1);
});
