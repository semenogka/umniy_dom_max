import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

/** Собственные пропсы Badge */
type BadgeOwnProps<T extends ElementType = "span"> = {
	/** HTML-тег или компонент корня */
	tag?: T;
	/** Счётчик / контент */
	children?: ReactNode;
};

/** Пропсы лBadge с поиморфным `tag` */
export type BadgeProps<T extends ElementType = "span"> = BadgeOwnProps<T> &
	Omit<ComponentPropsWithoutRef<T>, keyof BadgeOwnProps<T>>;
