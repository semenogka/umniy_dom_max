import type { NEW_APPEAL_TOPICS } from "./NewAppealSidebar.config";

/** Id темы обращения */
export type NewAppealTopicId = (typeof NEW_APPEAL_TOPICS)[number]["id"];

/** Данные формы нового обращения */
export type NewAppealFormValues = {
	/** Id темы */
	topicId: NewAppealTopicId;
	/** Описание */
	description: string;
};

/** Пропсы NewAppealSidebar */
export type NewAppealSidebarProps = {
	/** Адрес дома в шапке формы */
	homeContext?: string;
	/** Закрытие листа */
	onClose?: () => void;
	/** Отправка формы (без бэка) */
	onSubmit?: (values: NewAppealFormValues) => void;
	/** Дополнительный класс */
	className?: string;
};
