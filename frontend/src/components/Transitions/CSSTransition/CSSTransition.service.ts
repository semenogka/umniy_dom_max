/** Переводит camelCase в kebab-case */
export function kebabCase(input: string): string {
	return input
		.replace(/([a-z\d])([A-Z])/g, "$1-$2")
		.replace(/[_\s]+/g, "-")
		.toLowerCase();
}
