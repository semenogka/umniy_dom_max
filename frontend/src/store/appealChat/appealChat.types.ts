import type { HouseMessage } from "@/store/houses/houses.types";
import type { RequestStatus } from "@/store/types";

/** Состояние чата обращения */
export type AppealChatState = {
	/** Id обращения, для которого загружены сообщения */
	appealId: number | null;
	/** Id обращения, сообщения которого сейчас запрашиваем */
	loadingAppealId: number | null;
	/** Сообщения */
	messages: HouseMessage[];
	/** Статус загрузки / отправки */
	status: RequestStatus;
	/** Ошибка */
	error: string | null;
};
