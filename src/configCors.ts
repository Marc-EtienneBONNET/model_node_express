import cors from "cors";
import type { RequestHandler } from "express";
import { ClassCustomError } from "./lib/customError/classCustomError.js";

export function createCorsMiddleware(): RequestHandler {
	const rawOrigins = process.env.CORS_ALLOWED_ORIGINS;
	let allowedOrigins: string[] | undefined;
	if (rawOrigins !== undefined) {
		allowedOrigins = rawOrigins
			.split(",")
			.map((o) => o.trim())
			.filter(Boolean);
		if (allowedOrigins.length === 0) {
			throw new ClassCustomError("errors.emptyOrigins", "config/configCors");
		}
		const invalid = allowedOrigins.filter((o) => !/^https?:\/\//.test(o));
		if (invalid.length > 0) {
			throw new ClassCustomError(
				"errors.invalidOriginFormat",
				"config/configCors",
				{ origins: invalid.join(", ") },
			);
		}
	}

	return cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true);
			if (!allowedOrigins || allowedOrigins.includes(origin)) {
				return callback(null, true);
			}
			callback(
				new ClassCustomError(
					"errors.originNotAllowed",
					"config/configCors",
					{ origin },
					undefined,
					403,
				),
			);
		},
		credentials: true,
	});
}
