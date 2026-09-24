/**
 * Собирает className корня AppealDetailsSidebar
 * @param styles - классы из модуля
 * @param className - дополнительный класс
 */
export function getAppealDetailsSidebarClassName(
	styles: Record<string, string>,
	className?: string,
): string {
	return [styles.root, className].filter(Boolean).join(" ");
}

/**
 * Подпись номера заявки
 * @param number - номер
 */
export function getAppealDetailsNumberLabel(number?: string): string {
	if (!number || number === "формируется") return "Новая заявка";

	return `№ ${number}`;
}
