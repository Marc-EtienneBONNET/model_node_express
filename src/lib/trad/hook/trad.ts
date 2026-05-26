import { ClassTranslation } from "../class/classTranslation.js";
import { EnumLocale } from "../enum/enumLocale.js";
import { translations } from "../translations.js";
import type { TypeArgs } from "../types/typeArgs.js";

export function trad(
	key: string,
	file: string,
	args?: TypeArgs,
	locale: EnumLocale = DEFAULT_LOCALE,
): ClassTranslation | undefined {
	const dict = translations[locale as keyof typeof translations];
	if (!dict) return undefined;
	const namespace = dict[file as keyof typeof dict];
	if (!namespace) return undefined;
	const raw = lookup(namespace, key);
	if (raw === undefined) return undefined;
	return new ClassTranslation(interpolate(raw, args));
}

function resolveDefaultLocale(): EnumLocale {
	const fromEnv = process.env.DEFAULT_LANGAGE;
	if (fromEnv && fromEnv in EnumLocale) {
		return EnumLocale[fromEnv as keyof typeof EnumLocale];
	}
	return EnumLocale.fr;
}

const DEFAULT_LOCALE: EnumLocale = resolveDefaultLocale();

function lookup(dict: unknown, path: string): string | undefined {
	const segments = path.split(".");
	let current: unknown = dict;
	for (const seg of segments) {
		if (current && typeof current === "object" && seg in current) {
			current = (current as Record<string, unknown>)[seg];
		} else {
			return undefined;
		}
	}
	return typeof current === "string" ? current : undefined;
}

function interpolate(template: string, args?: TypeArgs): string {
	if (!args) return template;
	let result = template;
	for (const [key, value] of Object.entries(args)) {
		result = result.split(`{${key}}`).join(String(value));
	}
	return result;
}
