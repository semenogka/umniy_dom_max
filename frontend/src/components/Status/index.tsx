import type { ElementType } from "react";

import { STATUS_DEFAULT_TAG, STATUS_DEFAULT_VALUE } from "./Status.config";
import styles from "./Status.module.scss";
import { getStatusClassName } from "./Status.service";
import type { StatusProps } from "./Status.types";

/** Status Pill дизайн-системы «Домовой» */
export function Status<T extends ElementType = "span">(props: StatusProps<T>) {
	const { tag, status = STATUS_DEFAULT_VALUE, className, children, ...rest } = props;

	const Tag = (tag ?? STATUS_DEFAULT_TAG) as ElementType;

	return (
		<Tag className={getStatusClassName(styles, status, className)} {...rest}>
			{children}
		</Tag>
	);
}

Status.displayName = "Status";
