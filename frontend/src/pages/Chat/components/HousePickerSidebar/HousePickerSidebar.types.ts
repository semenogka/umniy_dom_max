import type { ChatHouse } from "../../Chat.types";

/** Пропсы HousePickerSidebar */
export type HousePickerSidebarProps = {
	/** Список домов */
	houses: ChatHouse[];
	/** Id выбранного дома */
	selectedHouseId: string;
	/** Выбор дома */
	onSelectHouse?: (houseId: string) => void;
	/** Закрытие листа */
	onClose?: () => void;
	/** Дополнительный класс */
	className?: string;
};
