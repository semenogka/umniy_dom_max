import type { CSSProperties, HTMLAttributes, PropsWithChildren } from "react";

/** Направление появления при анимации transform */
export type CSSTransitionFrom = "bottom" | "left" | "right" | "top";

export type CSSTransitionProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>> & {
	/** Стили с transition */
	animatedStyles: (keyof CSSProperties)[];
	/** Направление сдвига при transform */
	from?: CSSTransitionFrom;
	/** Показать компонент */
	visible?: boolean;
	/** Длительность анимации в мс */
	duration: number;
	/** Дополнительный класс */
	className?: string;
	/** Колбэк скрытия */
	onExited?: (duration: number, stop?: boolean) => void;
	/** Колбэк появления */
	onEnter?: () => void;
};
