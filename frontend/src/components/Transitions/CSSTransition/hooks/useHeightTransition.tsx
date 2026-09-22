import { type RefObject, useEffect } from "react";

/** Задержка debounce в мс */
const DEBOUNCE_DELAY = 50;

/**
 * Плавное раскрытие по height
 * @param contentRef - реф контейнера
 * @param visible - виден ли элемент
 * @param enabled - включить хук
 */
export function useHeightTransition(
	contentRef: RefObject<HTMLDivElement | null>,
	visible: boolean,
	enabled = true,
): void {
	useEffect(() => {
		if (!enabled) return;

		let timeout: number | null = null;
		const container = contentRef.current;
		const childrenCollection = container?.children;

		if (!container) return;

		if (!childrenCollection?.length) {
			container.style.setProperty("--height", "0px");
			return;
		}

		const updateHeight = (): void => {
			const totalHeight = Array.from(childrenCollection).reduce((sum, child) => {
				const childElement = child as HTMLElement;
				const style = getComputedStyle(childElement);

				if (style.display === "none" || ["absolute", "fixed"].includes(style.position)) {
					return sum;
				}

				const marginTop = parseFloat(style.marginTop) || 0;
				const marginBottom = parseFloat(style.marginBottom) || 0;

				return sum + childElement.offsetHeight + marginTop + marginBottom;
			}, 0);

			const containerStyle = getComputedStyle(container);
			const paddingBottom = parseFloat(containerStyle.paddingBottom) || 0;
			const paddingTop = parseFloat(containerStyle.paddingTop) || 0;
			const finalHeight = totalHeight + paddingBottom + paddingTop;

			container.style.setProperty("--height", visible ? `${finalHeight}px` : "0px");
		};

		requestAnimationFrame(updateHeight);

		const observer = new ResizeObserver(() => {
			if (timeout) window.clearTimeout(timeout);

			timeout = window.setTimeout(() => {
				updateHeight();
			}, DEBOUNCE_DELAY);
		});

		const handleTransitionStart = (e: Event): void => {
			const ev = e as TransitionEvent;

			if (ev.propertyName !== "height") return;

			container.style.setProperty("--height", "auto");
		};

		const handleTransitionEnd = (e: Event): void => {
			const ev = e as TransitionEvent;

			if (ev.propertyName !== "height") return;

			const heightValue = getComputedStyle(container).getPropertyValue("--height");

			if (heightValue !== "auto") return;

			setTimeout(() => updateHeight(), DEBOUNCE_DELAY);
		};

		Array.from(childrenCollection).forEach((child) => {
			observer.observe(child);
			child.addEventListener("transitionstart", handleTransitionStart);
			child.addEventListener("transitionend", handleTransitionEnd);
		});

		return () => {
			observer.disconnect();

			Array.from(childrenCollection).forEach((child) => {
				child.removeEventListener("transitionstart", handleTransitionStart);
				child.removeEventListener("transitionend", handleTransitionEnd);
			});
		};
	}, [contentRef, visible, enabled]);
}
