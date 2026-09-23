import type { ElementType, Ref } from "react";

import { DATE_CHIP_DEFAULT_TAG } from "./DateChip.config";
import styles from "./DateChip.module.scss";
import { getDateChipClassName } from "./DateChip.service";
import type { DateChipProps } from "./DateChip.types";

/** Date Chip */
export function DateChip<T extends ElementType = "div">(
	props: DateChipProps<T> & { ref?: Ref<Element> },
) {
	const { tag, className, children, ref, ...rest } = props;
	const Tag = (tag ?? DATE_CHIP_DEFAULT_TAG) as ElementType;

	return (
		<Tag ref={ref} className={getDateChipClassName(styles, className)} {...rest}>
			{children}
		</Tag>
	);
}

DateChip.displayName = "DateChip";
