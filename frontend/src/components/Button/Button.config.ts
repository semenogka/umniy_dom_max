import type { ButtonVariant } from "./Button.types";

/** Варианты стиля кнопки */
export const BUTTON_VARIANTS = [
	"inverse",
	"accent",
	"outline",
	"secondary",
	"icon",
	"send",
] as const satisfies readonly ButtonVariant[];

/** Вариант по умолчанию */
export const BUTTON_DEFAULT_VARIANT = "accent" as const satisfies ButtonVariant;

/** Тег корня по умолчанию */
export const BUTTON_DEFAULT_TAG = "button" as const;
