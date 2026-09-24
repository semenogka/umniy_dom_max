import type { SidebarDirection, SidebarDragState } from "./Sidebar.types";

/** Направления выезда */
export const SIDEBAR_DIRECTIONS = [
	"left",
	"right",
	"bottom",
] as const satisfies readonly SidebarDirection[];

/** Направление по умолчанию */
export const SIDEBAR_DEFAULT_DIRECTION = "left" as const satisfies SidebarDirection;

/** Доля высоты листа для закрытия по drag */
export const SIDEBAR_DISMISS_RATIO = 0.25;

/** Начальное состояние drag */
export const SIDEBAR_INITIAL_DRAG: SidebarDragState = {
	active: false,
	pending: false,
	startY: 0,
	offset: 0,
	height: 0,
	pointerId: null,
	fromHandle: false,
};

/** Порог старта drag с контента, px */
export const SIDEBAR_DRAG_ACTIVATE_DELTA = 8;
