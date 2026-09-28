/**
 * Собирает className корня HouseInfoSidebar
 * @param styles - классы модуля
 * @param className - доп. класс
 */
export function getHouseInfoSidebarClassName(
	styles: Record<string, string>,
	className?: string,
): string {
	return [styles.root, className].filter(Boolean).join(" ");
}

/**
 * Ссылка на Яндекс.Карты по адресу
 * @param address - адрес дома
 */
export function getHouseMapsUrl(address: string): string {
	return `https://yandex.ru/maps/?text=${encodeURIComponent(address)}`;
}

/**
 * Embed Яндекс.Карт для мини-превью в карточке
 * @param address - адрес дома
 */
export function getHouseMapEmbedUrl(address: string): string {
	return `https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(address)}&z=16`;
}
