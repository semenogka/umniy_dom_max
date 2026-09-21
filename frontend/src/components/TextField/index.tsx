import { TEXT_FIELD_DEFAULT_SIZE } from "./TextField.config";
import styles from "./TextField.module.scss";
import { getTextFieldClassName, resolveTextFieldTag } from "./TextField.service";
import type { TextFieldProps } from "./TextField.types";

/** Text Field дизайн-системы «Домовой» */
export function TextField(props: TextFieldProps) {
	const { size = TEXT_FIELD_DEFAULT_SIZE, tag, className, disabled = false, ...rest } = props;

	const Tag = resolveTextFieldTag(size, tag);
	const classNames = getTextFieldClassName(styles, size, className);

	if (Tag === "textarea") {
		return (
			<textarea
				className={classNames}
				disabled={disabled}
				rows={size === "single" ? 1 : undefined}
				{...rest}
			/>
		);
	}

	return <input type="text" className={classNames} disabled={disabled} {...rest} />;
}

TextField.displayName = "TextField";
