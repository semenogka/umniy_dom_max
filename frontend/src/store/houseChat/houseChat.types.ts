import type { HouseMessage } from "@/store/houses/houses.types";
import type { RequestStatus } from "@/store/types";

/** Состояние чата жителей дома */
export type HouseChatState = {
	/** Id дома, для которого загружены сообщения */
	houseId: number | null;
	/** Сообщения */
	messages: HouseMessage[];
	/** Имя текущего пользователя из последнего исходящего */
	ownSenderName: string | null;
	/** Статус загрузки / отправки */
	status: RequestStatus;
	/** Ошибка */
	error: string | null;
};
