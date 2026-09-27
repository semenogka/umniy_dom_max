import type { Chat, ChatMessage } from "../../Chat.types";

/** Пропсы MessageList */
export type MessageListProps = {
	/** Данные чата */
	chat: Chat;
};

/** Группа сообщений за один день */
export type MessageListDateGroup = {
	/** Метка даты */
	dateLabel: string;
	/** Сообщения */
	messages: ChatMessage[];
};

/** Группа подряд от одного отправителя */
export type MessageListSenderGroup = {
	/** Ключ отправителя */
	key: string;
	/** Флаг исходящего сообщения */
	isOut: boolean;
	/** URL аватара отправителя */
	avatarUrl?: string;
	/** Сообщения */
	messages: ChatMessage[];
};

/** Пропсы группы сообщений одного отправителя */
export type SenderGroupProps = {
	/** Группа сообщений одного отправителя */
	group: MessageListSenderGroup;
	/** Открыть вложение в лайтбоксе */
	onOpenAttachment?: (url: string) => void;
};
