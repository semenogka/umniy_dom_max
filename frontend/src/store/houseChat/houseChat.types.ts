import type { HouseMessage } from "@/store/houses/houses.types";
import type { RequestStatus } from "@/store/types";

/** Состояние чата жителей дома */
export type HouseChatState = {
	/** Id дома, для которого загружены сообщения */
	houseId: number | null;
	/** Id дома, сообщения которого сейчас запрашиваем */
	loadingHouseId: number | null;
	/** Сообщения */
	messages: HouseMessage[];
	/** Статус загрузки / отправки */
	status: RequestStatus;
	/** Ошибка */
	error: string | null;
};
