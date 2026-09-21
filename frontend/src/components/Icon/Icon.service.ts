import type { IconProps, IconSizeToken } from "./Icon.types";

/**
 * Преобразует путь к файлу в имя иконки.
 * @param path {string} - путь к файлу
 * @returns {string} - имя иконки
 */
export function fileNameToIconName(path: string): string {
	const file = path.split("/").pop() ?? "";
	return file.replace(/\.svg$/i, "");
}

/**
 * Строит карту иконок из модулей.
 * @param modules {Record<string, string>} - модули
 * @returns {Record<string, string>} - карта иконок
 */
export function buildIconsMap(modules: Record<string, string>): Record<string, string> {
	return Object.fromEntries(
		Object.entries(modules).map(([path, url]) => [fileNameToIconName(path), url]),
	);
}

/**
 * Возвращает список имён иконок.
 * @param icons {Record<string, string>} - карта иконок
 * @returns {string[]} - список имён иконок
 */
export function listIconNames(icons: Record<string, string>): string[] {
	return Object.keys(icons).sort();
}

/**
 * Возвращает размер иконки.
 * @param size {IconProps["size"]} - размер иконки
 * @param sizes {Record<IconSizeToken, number>} - размеры иконок
 * @returns {number} - размер иконки
 */
export function resolveIconSize(
	size: IconProps["size"],
	sizes: Record<IconSizeToken, number>,
): number {
	if (size === undefined) {
		return sizes["2xl"];
	}

	if (typeof size === "number") {
		return size;
	}

	return sizes[size as IconSizeToken];
}

/**
 * Возвращает URL иконки.
 * @param icons {Record<string, string>} - карта иконок
 * @param name {string} - имя иконки
 * @returns {string | undefined} - URL иконки
 */
export function getIconUrl(icons: Record<string, string>, name: string): string | undefined {
	return icons[name];
}
