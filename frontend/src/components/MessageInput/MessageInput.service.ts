/**
 * Собирает className MessageInput
 * @param styles - классы из модуля
 * @param className - дополнительный класс
 */
export function getMessageInputClassName(
	styles: Record<string, string>,
	className?: string,
): string {
	return [styles.root, className].filter(Boolean).join(" ");
}
