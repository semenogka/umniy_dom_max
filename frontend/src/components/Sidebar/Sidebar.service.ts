import { SIDEBAR_DISMISS_RATIO } from "./Sidebar.config";
import type { SidebarDirection } from "./Sidebar.types";

/** Имя CSS-класса направления в модуле */
export const SIDEBAR_DIRECTION_CLASS: Record<SidebarDirection, string> = {
	left: "left",
	right: "right",
	bottom: "bottom",
};

/**
 * Собирает className корня Sidebar
 * @param styles - классы из модуля
 * @param open - открыт
 * @param className - дополнительный класс
 */
export function getSidebarRootClassName(
	styles: Record<string, string>,
	open: boolean,
	className?: string,
): string {
	return [styles.root, open && styles.open, className].filter(Boolean).join(" ");
}

/**
 * Собирает className панели Sidebar
 * @param styles - классы из модуля
 * @param direction - сторона выезда
 * @param className - дополнительный класс
 */
export function getSidebarPanelClassName(
	styles: Record<string, string>,
	direction: SidebarDirection,
	className?: string,
): string {
	return [styles.panel, styles[SIDEBAR_DIRECTION_CLASS[direction]], className]
		.filter(Boolean)
		.join(" ");
}

/**
 * Нужно ли закрыть нижний лист по смещению drag
 * @param offset - смещение вниз, px
 * @param height - высота панели, px
 * @param ratio - доля высоты для dismiss
 */
export function shouldDismissBottomSidebar(
	offset: number,
	height: number,
	ratio = SIDEBAR_DISMISS_RATIO,
): boolean {
	if (height <= 0) return false;

	return offset >= height * ratio;
}

/**
 * Прозрачность scrim при drag нижнего листа
 * @param offset - смещение вниз, px
 * @param height - высота панели, px
 */
export function getBottomSidebarScrimOpacity(offset: number, height: number): number {
	if (height <= 0) return 1;

	return Math.max(0, 1 - offset / height);
}
