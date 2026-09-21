import type { TextFieldSize, TextFieldTag } from "./TextField.types";

/**
 * Собирает className Text Field из CSS-модуля
 * @param styles - классы из TextField.module.scss
 * @param size - размер поля
 * @param className - дополнительный класс
 */
export function getTextFieldClassName(
	styles: Record<string, string>,
	size: TextFieldSize,
	className?: string,
): string {
	return [styles.root, styles[size], className].filter(Boolean).join(" ");
}

/**
 * Тег по умолчанию от размера
 * @param size - размер поля
 * @param tag - явный тег
 */
export function resolveTextFieldTag(size: TextFieldSize, tag?: TextFieldTag): TextFieldTag {
	if (tag) return tag;
	return size === "multi" ? "textarea" : "input";
}
