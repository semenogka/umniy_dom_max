import type { ComponentPropsWithoutRef, ReactNode } from "react";

/** Тип шапки */
export type HeaderType = "appeal" | "conversation";

/** Статус заявки в подзаголовке */
export type HeaderStatus = "in-progress" | "executed" | "closed";

export type HeaderProps = {
	/** Тип: appeal или conversation */
	type?: HeaderType;
	/** Заголовок */
	title: ReactNode;
	/** Подзаголовок */
	subtitle?: ReactNode;
	/** Статус для точки в appeal */
	status?: HeaderStatus;
	/** Счётчик уведомлений */
	badgeCount?: number;
	/** Клик по центру */
	onSummaryClick?: () => void;
	/** Клик по меню */
	onMenuClick?: () => void;
	/** Клик по дому */
	onHouseClick?: () => void;
	/** Клик по уведомлениям */
	onNotificationsClick?: () => void;
	/** Дополнительный класс */
	className?: string;
} & Omit<ComponentPropsWithoutRef<"header">, "title" | "children">;
