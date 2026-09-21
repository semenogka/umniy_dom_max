import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

/** Статус заявки */
export type StatusValue = "in-progress" | "executed" | "closed";

/** Собственные пропсы Status */
type StatusOwnProps<T extends ElementType = "span"> = {
	/** HTML-тег или компонент корня */
	tag?: T;
	/** Статус заявки */
	status?: StatusValue;
	/** Иконка + подпись */
	children?: ReactNode;
};

/** Пропсы Status с полиморфным `tag` */
export type StatusProps<T extends ElementType = "span"> = StatusOwnProps<T> &
	Omit<ComponentPropsWithoutRef<T>, keyof StatusOwnProps<T>>;
