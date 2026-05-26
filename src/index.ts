import "./lib/console/applyColors.js";
import { createApp } from "./configExpress.js";
import { ClassCustomError } from "./lib/customError/classCustomError.js";
import { useTranslation } from "./lib/trad/hook/useTranslation.js";

try {
	const port = Number(process.env.API_PORT) || 3000;
	const app = createApp();

	const server = app.listen(port, () => {
		useTranslation("info.listening", "config/configExpress", {
			url: `http://localhost:${port}`,
		})?.console.info();
	});

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
} catch (err) {
	new ClassCustomError(undefined, undefined, undefined, err as Error).console();
}
