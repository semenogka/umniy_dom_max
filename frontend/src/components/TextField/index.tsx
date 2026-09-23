import { useLayoutEffect, useRef } from "react";

import { TEXT_FIELD_AUTO_GROW_MAX_HEIGHT, TEXT_FIELD_DEFAULT_SIZE } from "./TextField.config";
import styles from "./TextField.module.scss";
import { getTextFieldClassName, resolveTextFieldTag } from "./TextField.service";
import type { TextFieldProps } from "./TextField.types";

/**
 * Подгоняет высоту textarea под содержимое
 * @param element - textarea
 * @param maxHeight - потолок высоты
 */
function resizeTextarea(element: HTMLTextAreaElement, maxHeight: number) {
	element.style.height = "auto";
	element.style.height = `${Math.min(element.scrollHeight, maxHeight)}px`;
}

/** Text Field дизайн-системы «Домовой» */
export function TextField(props: TextFieldProps) {
	const {
		size = TEXT_FIELD_DEFAULT_SIZE,
		tag,
		className,
		disabled = false,
		autoGrow = false,
		autoGrowMaxHeight = TEXT_FIELD_AUTO_GROW_MAX_HEIGHT,
		value,
		defaultValue,
		onChange,
		style,
		...rest
	} = props;

	const Tag = resolveTextFieldTag(size, tag);
	const isAutoGrow = autoGrow && Tag === "textarea";
	const classNames = getTextFieldClassName(
		styles,
		size,
		[isAutoGrow ? styles.autoGrow : undefined, className].filter(Boolean).join(" ") || undefined,
	);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useLayoutEffect(() => {
		if (!isAutoGrow || !textareaRef.current) return;

		void value;
		void defaultValue;
		resizeTextarea(textareaRef.current, autoGrowMaxHeight);
	}, [isAutoGrow, autoGrowMaxHeight, value, defaultValue]);

	if (Tag === "textarea") {
		return (
			<textarea
				{...rest}
				ref={textareaRef}
				className={classNames}
				disabled={disabled}
				rows={size === "single" ? 1 : undefined}
				value={value}
				defaultValue={defaultValue}
				style={{
					...style,
					...(isAutoGrow ? { maxHeight: autoGrowMaxHeight } : undefined),
				}}
				onChange={(event) => {
					onChange?.(event);

					if (isAutoGrow) {
						resizeTextarea(event.currentTarget, autoGrowMaxHeight);
					}
				}}
			/>
		);
	}

	return (
		<input
			{...rest}
			type="text"
			className={classNames}
			disabled={disabled}
			value={value}
			defaultValue={defaultValue}
			style={style}
			onChange={onChange}
		/>
	);
}

TextField.displayName = "TextField";
