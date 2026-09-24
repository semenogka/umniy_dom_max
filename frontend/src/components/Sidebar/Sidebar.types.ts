import type { ComponentPropsWithoutRef, ReactNode } from "react";

/** Сторона выезда */
export type SidebarDirection = "left" | "right" | "bottom";

/** Состояние drag нижнего листа */
export type SidebarDragState = {
	/** Drag активен */
	active: boolean;
	/** Ждём направление жеста с контента */
	pending: boolean;
	/** Y указателя в начале жеста */
	startY: number;
	/** Текущее смещение вниз, px */
	offset: number;
	/** Высота панели в начале жеста, px */
	height: number;
	/** Id указателя жеста */
	pointerId: number | null;
	/** Жест начат с handle / grabber */
	fromHandle: boolean;
};

/** Собственные пропсы Sidebar */
type SidebarOwnProps = {
	/** Сторона выезда */
	direction?: SidebarDirection;
	/** Открыт */
	open?: boolean;
	/** Закрытие (scrim / Escape) */
	onClose?: () => void;
	/** Содержимое панели */
	children?: ReactNode;
	/** Дополнительный класс панели */
	className?: string;
};

/** Пропсы Sidebar */
export type SidebarProps = SidebarOwnProps &
	Omit<ComponentPropsWithoutRef<"aside">, keyof SidebarOwnProps>;
