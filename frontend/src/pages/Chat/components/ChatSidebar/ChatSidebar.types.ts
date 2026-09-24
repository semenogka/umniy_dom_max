/** Пропсы ChatSidebar */
export type ChatSidebarProps = {
	/** Id активного чата */
	activeChatId: string;
	/** Адрес выбранного дома */
	houseAddress: string;
	/** Мета выбранного дома */
	houseMeta: string;
	/** Выбор чата */
	onSelectChat?: (chatId: string) => void;
	/** Открыть форму нового обращения */
	onNewAppeal?: () => void;
	/** Открыть выбор дома */
	onSelectHouse?: () => void;
	/** Закрытие панели */
	onClose?: () => void;
	/** Дополнительный класс */
	className?: string;
};
