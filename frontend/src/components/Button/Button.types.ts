import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

/** Стиль кнопки из дизайн-системы */
export type ButtonVariant = "inverse" | "accent" | "outline" | "secondary" | "icon";

/** Собственные пропсы кнопки */
type ButtonOwnProps<T extends ElementType = "button"> = {
	/** HTML-тег или компонент корня */
	tag?: T;
	/** Стиль кнопки */
	variant?: ButtonVariant;
	/** Контент кнопки */
	children?: ReactNode;
};

/** Пропсы кнопки с полиморфным `tag` */
export type ButtonProps<T extends ElementType = "button"> = ButtonOwnProps<T> &
	Omit<ComponentPropsWithoutRef<T>, keyof ButtonOwnProps<T>>;
