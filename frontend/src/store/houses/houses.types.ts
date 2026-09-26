import type { RequestStatus } from "@/store/types";

/** Дом пользователя */
export type House = {
	/** Идентификатор */
	id: number;
	/** Адрес */
	address: string;
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
