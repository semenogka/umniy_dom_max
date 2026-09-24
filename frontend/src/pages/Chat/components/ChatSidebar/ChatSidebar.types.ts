/** Пропсы ChatSidebar */
export type ChatSidebarProps = {
	/** Id активного чата */
	activeChatId: string;
	/** Выбор чата */
	onSelectChat?: (chatId: string) => void;
	/** Закрытие панели */
	onClose?: () => void;
	/** Дополнительный класс */
	className?: string;
};
