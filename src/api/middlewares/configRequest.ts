import type { NextFunction, Request, Response } from "express";
import { EnumLocale } from "../../lib/trad/enum/enumLocale.js";

export function configRequest(
	req: Request,
	_res: Response,
	next: NextFunction,
): void {
	const acceptLanguage = req.headers["accept-language"];
	const localeKey =
		typeof acceptLanguage === "string"
			? acceptLanguage.slice(0, 2).toLowerCase()
			: undefined;
	const locale =
		localeKey && localeKey in EnumLocale
			? EnumLocale[localeKey as keyof typeof EnumLocale]
			: undefined;

	const authHeader = req.headers.authorization;
	const tokenConnection = authHeader?.startsWith("Bearer ")
		? authHeader.slice("Bearer ".length).trim() || undefined
		: undefined;

	req.config = { locale, tokenConnection };
	next();
}
