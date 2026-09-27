import type { ComponentPropsWithoutRef, ReactNode } from "react";

import type { StatusValue } from "@/components/Status/Status.types";

/** Тип шапки */
export type HeaderType = "appeal" | "conversation";

export type HeaderProps = {
	/** Тип: appeal или conversation */
	type?: HeaderType;
	/** Заголовок */
	title: ReactNode;
	/** Подзаголовок */
	subtitle?: ReactNode;
	/** Статус для точки в appeal */
	status?: StatusValue;
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
