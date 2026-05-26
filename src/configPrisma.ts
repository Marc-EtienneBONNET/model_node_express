import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { ClassCustomError } from "./lib/customError/classCustomError.js";
import { trad } from "./lib/trad/hook/trad.js";

function createClient(): PrismaClient {
	if (!process.env.DATABASE_URL) {
		throw new ClassCustomError(
			"errors.missingDatabaseUrl",
			"config/configPrisma",
		);
	}
	const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
	return new PrismaClient({ adapter });
}

export const prisma = createClient();

export async function connectPrisma(): Promise<void> {
	try {
		await prisma.$connect();
	} catch (err) {
		throw new ClassCustomError(
			"errors.connectionFailed",
			"config/configPrisma",
			undefined,
			err as Error,
		);
	}
	trad("info.connected", "config/configPrisma")?.console.info();
}
