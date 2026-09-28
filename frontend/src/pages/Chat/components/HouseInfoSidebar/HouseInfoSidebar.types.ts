/** Пропсы HouseInfoSidebar */
export type HouseInfoSidebarProps = {
	/** Адрес дома */
	address: string;
	/** Фото дома (если есть) */
	photoUrl?: string | null;
	/** Квартира для бейджа на фото */
	apartment?: string | null;
	/** Закрытие листа */
	onClose: () => void;
	/** Доп. className */
	className?: string;
};
