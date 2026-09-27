import type { Chat } from "../../Chat.types";

/** Пропсы AppealDetailsSidebar */
export type AppealDetailsSidebarProps = {
	/** Данные заявки */
	chat: Chat;
	/** Акт уже запрошен */
	actRequested?: boolean;
	/** Запрос акта */
	onRequestAct?: () => void;
	/** Закрытие листа */
	onClose?: () => void;
	/** Дополнительный класс */
	className?: string;
};
