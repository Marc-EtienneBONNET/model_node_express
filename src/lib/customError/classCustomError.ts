import { useTranslation } from "../trad/hook/useTranslation.js";
import type { TypeArgs } from "../trad/types/typeArgs.js";

const MACHINE_FILE = "errorMachine/classCustomError";

export class ClassCustomError extends Error {
	readonly statusCode!: number;
	readonly key?: string;
	readonly file?: string;
	readonly args?: TypeArgs;

	constructor(
		key?: string,
		file?: string,
		args?: TypeArgs,
		errorOrigine?: Error | ClassCustomError,
		statusCode?: number,
	) {
		if (errorOrigine instanceof ClassCustomError) {
			super();
			// biome-ignore lint/correctness/noConstructorReturn: intentional passthrough — avoid double-wrapping an existing ClassCustomError.
			return errorOrigine;
		}
		if (key && !file) {
			throw new ClassCustomError("keyRequiresFile", MACHINE_FILE);
		}
		if (file && !key) {
			throw new ClassCustomError("fileRequiresKey", MACHINE_FILE);
		}
		if ((args || statusCode !== undefined) && (!key || !file)) {
			throw new ClassCustomError(
				"argsOrStatusRequiresKeyAndFile",
				MACHINE_FILE,
			);
		}
		if (!errorOrigine && !key && !file) {
			throw new ClassCustomError("nothingProvided", MACHINE_FILE);
		}

		const message =
			key && file ? (useTranslation(key, file, args)?.value ?? key) : undefined;
		super(message, { cause: errorOrigine });
		this.name = "ClassCustomError";
		this.statusCode = statusCode ?? 500;
		this.key = key;
		this.file = file;
		this.args = args;
		Error.captureStackTrace?.(this, this.constructor);
	}

	console(): this {
		if (this.key && this.file) {
			useTranslation(this.key, this.file, this.args)?.console.error();
		}
		console.error(`  statusCode: ${this.statusCode}`);
		if (this.cause instanceof Error) {
			console.error("  cause:", this.cause);
		}
		return this;
	}
}
