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
	/** Мета в списке сайдбара */
	sidebarMeta?: string;
	/** Сообщения */
	messages: ChatMessage[];
};

/** Дом в переключателе сайдбара */
export type ChatSidebarHouse = {
	/** Адрес */
	address: string;
	/** Доп. сведения */
	meta: string;
};

/** Пункт обращения в сайдбаре */
export type ChatSidebarAppealItem = {
	/** Id чата */
	id: string;
	/** Заголовок */
	title: string;
	/** Подпись статуса / времени */
	meta: string;
	/** Статус заявки */
	status: HeaderStatus;
};

/** Пропсы шапки страницы чата */
export type ChatHeaderProps = {
	/** Данные чата */
	chat: ChatMock;
	/** Открытие сайдбара */
	onMenuClick: () => void;
};

/** Пропсы поля ввода на странице чата */
export type ChatMessageInputProps = {
	/** Id чата */
	chatId: string;
	/** Отправка сообщения */
	onSubmit: (text: string) => void;
};
