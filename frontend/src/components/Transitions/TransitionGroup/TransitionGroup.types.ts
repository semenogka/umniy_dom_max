import type { ReactElement, ReactNode } from "react";

export type TransitionGroupProps = {
	/** Дочерние элементы */
	children: ReactNode;
	/** Дополнительный класс */
	className?: string;
};

/** Данные дочернего элемента */
export type ChildWithKey = {
	/** Ключ */
	key: string;
	/** Элемент */
	element: ReactElement;
	/** Элемент уходит из DOM */
	leaving: boolean;
};
