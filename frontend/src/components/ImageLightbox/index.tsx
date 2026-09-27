import { useEffect } from "react";
import { createPortal } from "react-dom";

import { Icon } from "@/components/Icon";

import styles from "./ImageLightbox.module.scss";
import type { ImageLightboxProps } from "./ImageLightbox.types";

/**
 * Собирает className лайтбокса
 * @param open - открыт
 */
function getRootClassName(open: boolean): string {
	return [styles.root, open && styles.open].filter(Boolean).join(" ");
}

/** Полноэкранный просмотр изображения */
export function ImageLightbox(props: ImageLightboxProps) {
	const { src, open = false, onClose } = props;

	useEffect(() => {
		if (!open || !onClose) return;

		/**
		 * Escape закрывает лайтбокс
		 * @param event - keydown
		 * @returns {void}
		 */
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open, onClose]);

	useEffect(() => {
		if (!open) return;

		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = previous;
		};
	}, [open]);

	if (!src && !open) return null;

	return createPortal(
		<div
			className={getRootClassName(open)}
			role="dialog"
			aria-modal="true"
			aria-label="Просмотр фото"
		>
			<button type="button" className={styles.scrim} aria-label="Закрыть" onClick={onClose} />

			<button type="button" className={styles.close} aria-label="Закрыть" onClick={onClose}>
				<Icon name="close" size="lg" />
			</button>

			{src && (
				<figure className={styles.figure}>
					<img className={styles.image} src={src} alt="" />
				</figure>
			)}
		</div>,
		document.body,
	);
}

ImageLightbox.displayName = "ImageLightbox";
