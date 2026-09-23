import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type DateChipOwnProps<T extends ElementType = "div"> = {
	/** HTML-тег или компонент корня */
	tag?: T;
	/** Подпись даты */
	children?: ReactNode;
};

/** Пропсы Date Chip */
export type DateChipProps<T extends ElementType = "div"> = DateChipOwnProps<T> &
	Omit<ComponentPropsWithoutRef<T>, keyof DateChipOwnProps<T>>;
