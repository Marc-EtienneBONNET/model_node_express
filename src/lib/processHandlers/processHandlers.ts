import { ClassCustomError } from "../customError/classCustomError.js";

const FILE = "lib/processHandlers";

function isPrismaClientNotGenerated(err: unknown): boolean {
	if (!(err instanceof Error)) return false;
	const code = (err as NodeJS.ErrnoException).code;
	if (code !== "MODULE_NOT_FOUND") return false;
	return /\.prisma[\\/]client/.test(err.message);
}

function reportFatal(err: unknown, fallbackKey: string): void {
	try {
		const errorOrigine = err instanceof Error ? err : new Error(String(err));
		if (isPrismaClientNotGenerated(err)) {
			new ClassCustomError(
				"errors.clientNotGenerated",
				"config/configPrisma",
				undefined,
				errorOrigine,
			).console();
			return;
		}
		new ClassCustomError(
			fallbackKey,
			FILE,
			undefined,
			errorOrigine,
		).console();
	} catch (reportErr) {
		console.error("[processHandlers] failed to report error:", reportErr);
		console.error("[processHandlers] original error:", err);
	}
}

function installProcessHandlers(): void {
	process.on("uncaughtException", (err) => {
		reportFatal(err, "errors.uncaughtException");
		process.exit(1);
	});
	process.on("unhandledRejection", (reason) => {
		reportFatal(reason, "errors.unhandledRejection");
		process.exit(1);
	});
}

installProcessHandlers();
