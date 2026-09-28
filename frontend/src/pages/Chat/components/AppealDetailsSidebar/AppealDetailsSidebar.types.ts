import type { Chat } from "../../Chat.types";

/** Пропсы AppealDetailsSidebar */
export type AppealDetailsSidebarProps = {
	/** Данные заявки */
	chat: Chat;
	/** Идёт закрытие заявки */
	closing?: boolean;
	/** Закрытие заявки (статус) */
	onCloseAppeal?: () => void;
	/** Закрытие листа */
	onClose?: () => void;
	/** Дополнительный класс */
	className?: string;
};
