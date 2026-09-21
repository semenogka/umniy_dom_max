import type { ElementType } from "react";

import { BADGE_DEFAULT_TAG } from "./Badge.config";
import styles from "./Badge.module.scss";
import { getBadgeClassName } from "./Badge.service";
import type { BadgeProps } from "./Badge.types";

/** Компонент Badge */
export function Badge<T extends ElementType = "span">(props: BadgeProps<T>) {
	const { tag, className, children, ...rest } = props;
	const Tag = (tag ?? BADGE_DEFAULT_TAG) as ElementType;

	return (
		<Tag className={getBadgeClassName(styles, className)} {...rest}>
			{children}
		</Tag>
	);
}

Badge.displayName = "Badge";
