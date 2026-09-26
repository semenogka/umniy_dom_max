import type { House } from "@/store/houses/houses.types";

/** Пропсы HousePickerSidebar */
export type HousePickerSidebarProps = {
	/** Список домов */
	houses: House[];
	/** Выбранный дом */
	selectedHouse?: House;
	/** Выбор дома */
	onSelectHouse?: (house: House) => void;
	/** Закрытие листа */
	onClose?: () => void;
	/** Дополнительный класс */
	className?: string;
};
