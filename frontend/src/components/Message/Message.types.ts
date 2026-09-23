import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

/** Вид сообщения */
export type MessageKind = "out" | "bot" | "operator" | "bot-question";

/** Статус доставки исходящего */
export type MessageDelivery = "sent" | "delivered" | "read";

/** Собственные пропсы Message */
type MessageOwnProps<T extends ElementType = "article"> = {
	/** HTML-тег или компонент корня */
	tag?: T;
	/** Вид сообщения */
	kind?: MessageKind;
	/** Автор */
	author?: ReactNode;
	/** Время */
	time?: ReactNode;
	/** Статус доставки */
	delivery?: MessageDelivery;
	/** Хвостик у угла (у последнего сообщения группы)*/
	tail?: boolean;
	/** Текст / медиа */
	children?: ReactNode;
	/** Кнопки ответа */
	actions?: ReactNode;
};

/** Пропсы Message */
export type MessageProps<T extends ElementType = "article"> = MessageOwnProps<T> &
	Omit<ComponentPropsWithoutRef<T>, keyof MessageOwnProps<T>>;
