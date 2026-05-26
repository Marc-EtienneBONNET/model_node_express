import type { EnumLocale } from "../lib/trad/enum/enumLocale.js";

declare global {
	namespace Express {
		interface Request {
			config: {
				locale?: EnumLocale;
				tokenConnection?: string;
			};
		}
	}
}
