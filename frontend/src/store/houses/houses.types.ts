import type { MessageDelivery } from "@/components/Message/Message.types";
import type { RequestStatus } from "@/store/types";

/** Дом пользователя */
export type House = {
	/** Идентификатор */
	id: number;
	/** Адрес */
	address: string;
};

/** Вложение сообщения */
export type MessageAttachment = {
	/** Идентификатор */
	id: number;
	/** URL файла */
	url: string;
	/** Порядок */
	ord: number;
	/** Локальное имя файла (optimistic) */
	name?: string;
};

/** Сообщение чата дома */
export type HouseMessage = {
	/** Идентификатор */
	id: number;
	/** Id отправителя (MAX / users.id) */
	sender_id: number;
	/** Имя отправителя */
	sender: string;
	/** Текст */
	text: string;
	/** Дата создания */
	created_at: string;
	/** Вложения */
	attachments: MessageAttachment[];
	/** Локальный id сообщения */
	clientId?: string;
	/** Локальный статус доставки */
	delivery?: MessageDelivery;
};

/** Дом с сообщениями */
export type HouseDetail = House & {
	/** Сообщения общего чата */
	messages: HouseMessage[];
};

/** Состояние слайса домов */
export type HousesState = {
	/** Список домов */
	items: House[];
	/** Выбранный дом */
	selectedHouse?: House;
	/** Статус запроса */
	status: RequestStatus;
	/** Ошибка запроса */
	error: string | null;
};
