export type ImageLightboxProps = {
	/** URL изображения */
	src: string | null;
	/** Открыт */
	open?: boolean;
	/** Закрытие */
	onClose?: () => void;
};
