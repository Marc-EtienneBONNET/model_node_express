export class ClassTranslation {
	readonly value: string;

	readonly console = {
		log: (): void => console.log(this.value),
		info: (): void => console.info(this.value),
		error: (): void => console.error(this.value),
	};

	constructor(value: string) {
		this.value = value;
	}

	toString(): string {
		return this.value;
	}
}
