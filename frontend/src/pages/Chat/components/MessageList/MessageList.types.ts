import type { Ref } from "react";

import type { ChatMessage, ChatMock } from "../../Chat.types";

/** Imperative API ленты */
export type MessageListHandle = {
	/** Добавляет исходящее сообщение */
	addMessage: (text: string) => void;
};

/** Пропсы MessageList */
export type MessageListProps = {
	/** Данные чата */
	chat: ChatMock;
	/** Imperative handle */
	ref?: Ref<MessageListHandle>;
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
};
