import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

/** Вид сообщения */
export type MessageKind = "out" | "bot" | "operator" | "bot-question";

/** Статус доставки исходящего */
export type MessageDelivery = "sent" | "delivered" | "read";

/** Собственные пропсы Message */
type MessageOwnProps<T extends ElementType = "article"> = {
	/** HTML-тег или компонент корня */
	tag?: T;
	/** Вид: Out · Bot · Operator · Bot Question */
	kind?: MessageKind;
	/** Автор (для out обычно не нужен) */
	author?: ReactNode;
	/** Время */
	time?: ReactNode;
	/** Галочки доставки (только kind=`out`) */
	delivery?: MessageDelivery;
	/** Текст / медиа */
	children?: ReactNode;
	/** Кнопки для kind=`bot-question` */
	actions?: ReactNode;
};

/** Пропсы Message с полиморфным `tag` */
export type MessageProps<T extends ElementType = "article"> = MessageOwnProps<T> &
	Omit<ComponentPropsWithoutRef<T>, keyof MessageOwnProps<T>>;
