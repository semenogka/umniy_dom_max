/**
 * Собирает className Badge из CSS-модуля
 * @param styles - классы из Badge.module.scss
 * @param className - дополнительный класс
 */
export function getBadgeClassName(styles: Record<string, string>, className?: string): string {
	return [styles.root, className].filter(Boolean).join(" ");
}
