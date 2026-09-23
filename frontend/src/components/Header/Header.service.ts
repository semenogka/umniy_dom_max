import type { HeaderStatus } from "./Header.types";

/**
 * Собирает className Header
 * @param styles - классы из модуля
 * @param className - дополнительный класс
 */
export function getHeaderClassName(styles: Record<string, string>, className?: string): string {
	return [styles.root, className].filter(Boolean).join(" ");
}

/**
 * Класс точки статуса
 * @param styles - классы из модуля
 * @param status - статус заявки
 */
export function getHeaderStatusClassName(
	styles: Record<string, string>,
	status?: HeaderStatus,
): string {
	if (!status || status === "in-progress") return styles.statusDot;

	if (status === "executed") return [styles.statusDot, styles.statusExecuted].join(" ");

	return [styles.statusDot, styles.statusClosed].join(" ");
}
