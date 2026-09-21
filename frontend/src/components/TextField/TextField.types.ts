import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

/** Размер поля: Single (44) · Multi (110) */
export type TextFieldSize = "single" | "multi";

/** HTML-элемент поля */
export type TextFieldTag = "input" | "textarea";

type TextFieldOwnProps = {
	/** Размер поля */
	size?: TextFieldSize;
	/** HTML-тег или компонент корня */
	tag?: TextFieldTag;
};

type SharedAttrs = Omit<
	InputHTMLAttributes<HTMLInputElement> & TextareaHTMLAttributes<HTMLTextAreaElement>,
	keyof TextFieldOwnProps | "size"
>;

/** Пропсы Text Field */
export type TextFieldProps = TextFieldOwnProps & SharedAttrs;
