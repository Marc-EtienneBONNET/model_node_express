import express, {
	type Express,
	type NextFunction,
	type Request,
	type Response,
} from "express";
import helmet from "helmet";
import { configRequest } from "./api/middlewares/configRequest.js";
import { apiRouter } from "./api/routers/index.js";
import { createCorsMiddleware } from "./configCors.js";
import { ClassCustomError } from "./lib/customError/classCustomError.js";

export function createApp(): Express {
	try {
		const app = express();

		app.use(helmet());
		app.use(createCorsMiddleware());
		app.use(express.json({ limit: "100kb" }));
		app.use(configRequest);

		app.use(apiRouter);

		app.use(
			(err: unknown, _req: Request, res: Response, _next: NextFunction) => {
				if (err instanceof ClassCustomError) {
					err.console();
					res.status(err.statusCode).json({ error: err.message });
					return;
				}
				console.error(err);
				res.status(500).json({ error: "Internal server error" });
			},
		);

		return app;
	} catch (err) {
		throw err;
	}
}
