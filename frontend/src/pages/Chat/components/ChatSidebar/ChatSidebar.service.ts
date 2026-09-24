import type { HeaderStatus } from "@/components/Header/Header.types";

/**
 * Собирает className корня ChatSidebar
 * @param styles - классы из модуля
 * @param className - дополнительный класс
 */
export function getChatSidebarClassName(
	styles: Record<string, string>,
	className?: string,
): string {
	return [styles.root, className].filter(Boolean).join(" ");
}

/**
 * ClassName пункта чата
 * @param styles - классы из модуля
 * @param active - активный пункт
 * @param className - дополнительный класс
 */
export function getChatSidebarItemClassName(
	styles: Record<string, string>,
	active: boolean,
	className?: string,
): string {
	return [styles.item, active && styles.itemActive, className].filter(Boolean).join(" ");
}

/**
 * ClassName иконки статуса обращения
 * @param styles - классы из модуля
 * @param status - статус заявки
 */
export function getChatSidebarStatusIconClassName(
	styles: Record<string, string>,
	status: HeaderStatus,
): string {
	const statusClass =
		status === "in-progress"
			? styles.statusInProgress
			: status === "executed"
				? styles.statusExecuted
				: styles.statusClosed;

	return [styles.statusIcon, statusClass].join(" ");
}
