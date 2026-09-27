import type { StatusValue } from "@/components/Status/Status.types";

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
	status?: StatusValue,
): string {
	if (!status || status === "in_progress" || status === "dop") return styles.statusDot;

	if (status === "checked") return [styles.statusDot, styles.statusChecked].join(" ");

	return [styles.statusDot, styles.statusClose].join(" ");
}
