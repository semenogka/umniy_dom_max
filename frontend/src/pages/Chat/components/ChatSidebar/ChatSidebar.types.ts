import type { ChatSidebarAppealItem } from "../../Chat.types";

/** Пропсы ChatSidebar */
export type ChatSidebarProps = {
	/** Id активной заявки; без неё активен чат жителей */
	activeAppealId?: string;
	/** Адрес выбранного дома */
	houseAddress: string;
	/** Мета выбранного дома */
	houseMeta: string;
	/** Обращения дома */
	appeals: ChatSidebarAppealItem[];
	/** Открыть чат жителей */
	onSelectResidents?: () => void;
	/** Открыть обращение */
	onSelectAppeal?: (appealId: string) => void;
	/** Открыть форму нового обращения */
	onNewAppeal?: () => void;
	/** Открыть выбор дома */
	onSelectHouse?: () => void;
	/** Закрытие панели */
	onClose?: () => void;
	/** Дополнительный класс */
	className?: string;
};
