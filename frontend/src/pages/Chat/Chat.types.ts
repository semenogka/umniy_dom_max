import type { HeaderStatus, HeaderType } from "@/components/Header/Header.types";
import type { MessageDelivery, MessageKind } from "@/components/Message/Message.types";

/** Тип чата */
export type ChatType = "appeal" | "conversation";

/** Сообщение в ленте */
export type ChatMessage = {
	/** Идентификатор */
	id: string;
	/** Вид сообщения */
	kind: MessageKind;
	/** Автор */
	author?: string;
	/** Текст */
	text: string;
	/** Время */
	time: string;
	/** Подпись дня в ленте */
	dateLabel: string;
	/** URL аватара с бэка */
	avatarUrl?: string;
	/** Статус доставки */
	delivery?: MessageDelivery;
};

/** Мок чата */
export type ChatMock = {
	/** Идентификатор */
	id: string;
	/** Тип чата */
	type: ChatType;
	/** Тип шапки */
	headerType: HeaderType;
	/** Заголовок */
	title: string;
	/** Подзаголовок */
	subtitle: string;
	/** Статус заявки */
	status?: HeaderStatus;
	/** Счётчик уведомлений */
	badgeCount?: number;
	/** Сообщения */
	messages: ChatMessage[];
};
