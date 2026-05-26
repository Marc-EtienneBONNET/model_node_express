import { styleText } from "node:util";

const originalInfo = console.info.bind(console);
const originalError = console.error.bind(console);

console.info = (...args: unknown[]): void => {
	originalInfo(
		...args.map((arg) =>
			typeof arg === "string" ? styleText("green", arg) : arg,
		),
	);
};

console.error = (...args: unknown[]): void => {
	originalError(
		...args.map((arg) =>
			typeof arg === "string"
				? styleText("red", arg, { stream: process.stderr })
				: arg,
		),
	);
};
