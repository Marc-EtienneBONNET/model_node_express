import exempleApiFr from "./json/fr/api/exemple.json";
import configFrCors from "./json/fr/config/configCors.json";
import configFrExpress from "./json/fr/config/configExpress.json";
import configFrPrisma from "./json/fr/config/configPrisma.json";
import configFrSocket from "./json/fr/config/configSocket.json";
import classCustomErrorFr from "./json/fr/errorMachine/classCustomError.json";

export const translations = {
	fr: {
		"config/configExpress": configFrExpress,
		"config/configCors": configFrCors,
		"config/configPrisma": configFrPrisma,
		"config/configSocket": configFrSocket,
		"errorMachine/classCustomError": classCustomErrorFr,
		"api/exemple": exempleApiFr,
	},
	en: {},
} as const;

export type TypeLocale = keyof typeof translations;
export type TypeNamespace = keyof (typeof translations)["fr"];
