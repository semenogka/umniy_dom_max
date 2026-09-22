import { useEffect, useRef, useState } from "react";

import styles from "./CSSTransition.module.scss";
import { kebabCase } from "./CSSTransition.service";
import type { CSSTransitionFrom, CSSTransitionProps } from "./CSSTransition.types";
import { useHeightTransition } from "./hooks/useHeightTransition";

/** Классы направлений сдвига */
const FROM_CLASS_NAME: Record<CSSTransitionFrom, string> = {
	bottom: styles.from_bottom,
	left: styles.from_left,
	right: styles.from_right,
	top: styles.from_top,
};

/** Контейнер с плавным появлением контента */
export function CSSTransition(props: CSSTransitionProps) {
	const {
		visible = true,
		className,
		duration,
		children,
		animatedStyles,
		from,
		onExited,
		onEnter,
		...attrs
	} = props;

	const contentRef = useRef<HTMLDivElement>(null);
	const [shouldRender, setShouldRender] = useState(false);
	const useHeight = animatedStyles.includes("height");

	useHeightTransition(contentRef, visible, useHeight);

	useEffect(() => {
		const timer = window.setTimeout(() => {
			setShouldRender(visible);

			if (!visible) {
				onExited?.(duration);
			}
		}, 100);

		return () => window.clearTimeout(timer);
	}, [visible, duration, onExited]);

	useEffect(() => {
		if (visible) onEnter?.();
	}, [visible, onEnter]);

	const transitionProps = animatedStyles
		.map((prop) => `${kebabCase(String(prop))} ${duration}ms ease-in-out`)
		.join(", ");

	return (
		<div
			{...attrs}
			ref={contentRef}
			className={[
				styles.animation,
				shouldRender && styles.visible,
				from && FROM_CLASS_NAME[from],
				useHeight && styles.height,
				className,
			]
				.filter(Boolean)
				.join(" ")}
			style={{
				transition: transitionProps,
			}}
		>
			{children}
		</div>
	);
}

CSSTransition.displayName = "CSSTransition";
