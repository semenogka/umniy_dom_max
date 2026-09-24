/**
 * Собирает className корня HousePickerSidebar
 * @param styles - классы из модуля
 * @param className - дополнительный класс
 */
export function getHousePickerSidebarClassName(
	styles: Record<string, string>,
	className?: string,
): string {
	return [styles.root, className].filter(Boolean).join(" ");
}

/**
 * ClassName пункта дома
 * @param styles - классы из модуля
 * @param selected - дом выбран
 */
export function getHousePickerOptionClassName(
	styles: Record<string, string>,
	selected: boolean,
): string {
	return [styles.option, selected && styles.optionSelected].filter(Boolean).join(" ");
}
