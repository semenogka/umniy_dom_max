import type { ElementType } from "react";

import { Icon } from "../Icon";
import {
	MESSAGE_DEFAULT_DELIVERY,
	MESSAGE_DEFAULT_KIND,
	MESSAGE_DEFAULT_TAG,
	MESSAGE_DEFAULT_TAIL,
} from "./Message.config";
import styles from "./Message.module.scss";
import { getDeliveryLabel, getMessageClassName } from "./Message.service";
import type { MessageDelivery, MessageProps } from "./Message.types";

/**
 * Иконка / индикатор доставки
 * @param delivery - статус доставки
 */
function DeliveryStatus({ delivery }: { delivery: MessageDelivery }) {
	const label = getDeliveryLabel(delivery);

	if (delivery === "pending") {
		return (
			<span className={styles.deliveryPending} role="status" aria-label={label} title={label} />
		);
	}

	if (delivery === "error") {
		return (
			<Icon
				name="message-error"
				size={14}
				className={[styles.delivery, styles.deliveryError].join(" ")}
				title={label}
			/>
		);
	}

	return (
		<Icon
			name={delivery === "sent" ? "check" : "delivery-read"}
			size={delivery === "sent" ? 12 : undefined}
			className={[styles.delivery, delivery === "read" && styles.deliveryRead]
				.filter(Boolean)
				.join(" ")}
			title={label}
			style={delivery === "sent" ? undefined : { width: 17, height: 12 }}
		/>
	);
}

/** Message дизайн-системы «Домовой» */
export function Message<T extends ElementType = "article">(props: MessageProps<T>) {
	const {
		tag,
		kind = MESSAGE_DEFAULT_KIND,
		author,
		time,
		delivery = MESSAGE_DEFAULT_DELIVERY,
		tail = MESSAGE_DEFAULT_TAIL,
		actions,
		className,
		children,
		...rest
	} = props;

	const Tag = (tag ?? MESSAGE_DEFAULT_TAG) as ElementType;
	const showDelivery = kind === "out";

	return (
		<Tag className={getMessageClassName(styles, kind, tail, className)} {...rest}>
			{author && <div className={styles.author}>{author}</div>}

			{children && <div className={styles.body}>{children}</div>}

			{actions && <div className={styles.actions}>{actions}</div>}

			{(time || showDelivery) && (
				<div className={styles.meta}>
					{time && <time className={styles.time}>{time}</time>}
					{showDelivery && <DeliveryStatus delivery={delivery} />}
				</div>
			)}
		</Tag>
	);
}

Message.displayName = "Message";
