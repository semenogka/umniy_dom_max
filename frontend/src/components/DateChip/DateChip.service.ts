/**
 * Собирает className Date Chip
 * @param styles - классы из модуля
 * @param className - дополнительный класс
 */
export function getDateChipClassName(styles: Record<string, string>, className?: string): string {
	return [styles.root, className].filter(Boolean).join(" ");
}
