import type { ElementType } from "react";

import { BUTTON_DEFAULT_TAG, BUTTON_DEFAULT_VARIANT } from "./Button.config";
import styles from "./Button.module.scss";
import { getButtonClassName } from "./Button.service";
import type { ButtonProps } from "./Button.types";

/** Кнопка дизайн-системы «Домовой» */
export function Button<T extends ElementType = "button">(props: ButtonProps<T>) {
	const { variant = BUTTON_DEFAULT_VARIANT, tag, className, children, ...rest } = props;

	const Tag = (tag ?? BUTTON_DEFAULT_TAG) as ElementType;
	const restProps = rest as Record<string, unknown>;
	const { disabled, type, ...domRest } = restProps;

	const isNativeButton = Tag === "button";

	return (
		<Tag
			className={getButtonClassName(styles, variant, className)}
			{...(isNativeButton
				? { type: (type as string | undefined) ?? "button", disabled: Boolean(disabled) }
				: disabled
					? { "aria-disabled": true }
					: {})}
			{...domRest}
		>
			{children}
		</Tag>
	);
}

Button.displayName = "Button";
