import type { ButtonVariant } from "./Button.types";

/**
 * Собирает className кнопки из CSS-модуля
 * @param styles - классы из Button.module.scss
 * @param variant - стиль кнопки
 * @param className - дополнительный класс
 */
export function getButtonClassName(
	styles: Record<string, string>,
	variant: ButtonVariant,
	className?: string,
): string {
	return [styles.root, styles[variant], className].filter(Boolean).join(" ");
}
