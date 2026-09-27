import type { StatusValue } from "@/components/Status/Status.types";
import type { RequestStatus } from "@/store/types";

/** Обращение (ответ `GET /appeals/{house_id}`) */
export type Appeal = {
	/** Идентификатор */
	id: number;
	/** Текст обращения */
	text: string;
	/** Статус с бэка */
	status: StatusValue;
	/** Id автора */
	author_id: number;
	/** Адрес обращения */
	appeal_address: string | null;
	/** Ответственная организация */
	organization: string | null;
	/** Тип проблемы */
	problem_type: string | null;
	/** Срочность */
	urgency: string | null;
	/** Срок в днях */
	deadline_days: number | null;
	/** Текст срока */
	deadline_text: string | null;
	/** План действий */
	action_plan: string | null;
	/** Дата создания */
	created_at: string | null;
};

/** Состояние слайса обращений */
export type AppealsState = {
	/** Список обращений выбранного дома */
	items: Appeal[];
	/** Статус запроса */
	status: RequestStatus;
	/** Ошибка запроса */
	error: string | null;
};

/** Аргумент создания обращения */
export type CreateAppealArg = {
	/** Id дома */
	houseId: number;
	/** Текст обращения */
	text: string;
	/** Вложения (base64) */
	attachments?: string[];
};
