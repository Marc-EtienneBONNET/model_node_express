import "dotenv/config";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { defineConfig } from "prisma/config";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not set");
}

const connectionString = process.env.DATABASE_URL;

export default defineConfig({
	schema: path.join("prisma", "schema.prisma"),
	datasource: {
		url: connectionString,
	},
	migrations: {
		adapter: () => new PrismaPg({ connectionString }),
	},
});
