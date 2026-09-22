/**
 * Собирает className Loader
 * @param styles - классы из модуля
 * @param className - дополнительный класс
 */
export function getLoaderClassName(styles: Record<string, string>, className?: string): string {
	return [styles.root, className].filter(Boolean).join(" ");
}
