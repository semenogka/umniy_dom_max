import type { HeaderType } from "@/components/Header/Header.types";
import type { StatusValue } from "@/components/Status/Status.types";
import type { MessageDelivery, MessageKind } from "@/components/Message/Message.types";

/** Тип чата */
export type ChatType = "appeal" | "conversation";

/** Вложение в ленте */
export type ChatAttachment = {
	/** URL / data URL */
	url: string;
	/** Имя файла */
	name: string;
	/** Картинка для превью / лайтбокса */
	isImage: boolean;
};

/** Сообщение в ленте */
export type ChatMessage = {
	/** Идентификатор UI (clientId или id) */
	id: string;
	/** Id сообщения на бэке */
	serverId: number;
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
	/** Вложения */
	attachments?: ChatAttachment[];
};

/** Данные чата для UI */
export type Chat = {
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
	status?: StatusValue;
	/** Счётчик уведомлений */
	badgeCount?: number;
	/** Мета в списке сайдбара */
	sidebarMeta?: string;
	/** Номер заявки */
	number?: string;
	/** Оператор заявки */
	operator?: ChatAppealOperator;
	/** Акт уже запрошен */
	actRequested?: boolean;
	/** Сообщения */
	messages: ChatMessage[];
};

/** Оператор заявки */
export type ChatAppealOperator = {
	/** ФИО */
	name: string;
	/** Роль */
	role: string;
	/** Инициалы */
	initials: string;
	/** URL аватара */
	avatarUrl?: string;
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
	status: StatusValue;
};

/** Пропсы шапки страницы чата */
export type ChatHeaderProps = {
	/** Данные чата */
	chat: Chat;
	/** Открытие сайдбара */
	onMenuClick: () => void;
	/** Открытие сведений о заявке */
	onSummaryClick?: () => void;
};

/** Пропсы поля ввода на странице чата */
export type ChatMessageInputProps = {
	/** Id чата */
	chatId: string;
	/** Отправка сообщения */
	onSubmit: (payload: {
		text: string;
		attachments: Array<{ dataUrl: string; name: string; mime: string }>;
	}) => void;
};
