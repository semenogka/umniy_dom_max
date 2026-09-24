import { type PointerEvent as ReactPointerEvent, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import {
	SIDEBAR_DEFAULT_DIRECTION,
	SIDEBAR_DRAG_ACTIVATE_DELTA,
	SIDEBAR_INITIAL_DRAG,
} from "./Sidebar.config";
import styles from "./Sidebar.module.scss";
import {
	getBottomSidebarScrimOpacity,
	getSidebarPanelClassName,
	getSidebarRootClassName,
	shouldDismissBottomSidebar,
} from "./Sidebar.service";
import type { SidebarDragState, SidebarProps } from "./Sidebar.types";

/** Боковая панель / нижний лист */
export function Sidebar(props: SidebarProps) {
	const {
		direction = SIDEBAR_DEFAULT_DIRECTION,
		open = false,
		onClose,
		children,
		className,
		...rest
	} = props;

	const isBottom = direction === "bottom";
	const panelRef = useRef<HTMLElement>(null);
	const scrimRef = useRef<HTMLButtonElement>(null);
	const dragRef = useRef<SidebarDragState>({ ...SIDEBAR_INITIAL_DRAG });

	useEffect(() => {
		if (!open || !onClose) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [open, onClose]);

	useEffect(() => {
		if (!open) return;

		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.body.style.overflow = previous;
		};
	}, [open]);

	useEffect(() => {
		if (open) return;

		const panel = panelRef.current;
		const scrim = scrimRef.current;

		if (panel) {
			panel.style.transform = "";
			panel.style.transition = "";
			panel.classList.remove(styles.dragging);
		}

		if (scrim) {
			scrim.style.opacity = "";
			scrim.style.transition = "";
		}

		dragRef.current = { ...SIDEBAR_INITIAL_DRAG };
	}, [open]);

	const applyDragOffset = (offset: number, height: number) => {
		const panel = panelRef.current;
		const scrim = scrimRef.current;
		if (!panel) return;

		panel.style.transform = `translateY(${offset}px)`;

		if (scrim) {
			scrim.style.opacity = String(getBottomSidebarScrimOpacity(offset, height));
		}
	};

	const clearInlineMotion = () => {
		const panel = panelRef.current;
		const scrim = scrimRef.current;

		if (panel) {
			panel.style.transform = "";
			panel.style.transition = "";
		}

		if (scrim) {
			scrim.style.opacity = "";
			scrim.style.transition = "";
		}
	};

	const beginDrag = (pointerId: number) => {
		const panel = panelRef.current;
		const drag = dragRef.current;
		if (!panel) return;

		drag.active = true;
		drag.pending = false;
		panel.classList.add(styles.dragging);

		if (!panel.hasPointerCapture(pointerId)) {
			panel.setPointerCapture(pointerId);
		}
	};

	const finishDrag = (dismiss: boolean) => {
		const panel = panelRef.current;
		const scrim = scrimRef.current;
		const drag = dragRef.current;

		if (!panel) return;

		panel.classList.remove(styles.dragging);
		drag.active = false;
		drag.pending = false;
		drag.pointerId = null;

		const transition = "transform 250ms ease";
		panel.style.transition = transition;

		if (scrim) {
			scrim.style.transition = "opacity 200ms ease";
		}

		if (dismiss) {
			panel.style.transform = "translateY(103%)";

			if (scrim) scrim.style.opacity = "0";

			const handleEnd = (event: TransitionEvent) => {
				if (event.propertyName !== "transform") return;

				panel.removeEventListener("transitionend", handleEnd);
				clearInlineMotion();
				onClose?.();
			};

			panel.addEventListener("transitionend", handleEnd);

			return;
		}

		panel.style.transform = "translateY(0)";

		if (scrim) scrim.style.opacity = "1";

		const handleEnd = (event: TransitionEvent) => {
			if (event.propertyName !== "transform") return;

			panel.removeEventListener("transitionend", handleEnd);
			clearInlineMotion();
		};

		panel.addEventListener("transitionend", handleEnd);
	};

	const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
		if (!isBottom || !open || event.button !== 0) return;

		const panel = panelRef.current;
		if (!panel) return;

		const target = event.target as HTMLElement;
		const fromHandle = Boolean(target.closest(`.${styles.handle}`));

		if (!fromHandle && panel.scrollTop > 0) return;

		dragRef.current = {
			active: false,
			pending: true,
			startY: event.clientY,
			offset: 0,
			height: panel.getBoundingClientRect().height,
			pointerId: event.pointerId,
			fromHandle,
		};

		if (fromHandle) {
			event.preventDefault();
			beginDrag(event.pointerId);
		}
	};

	const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
		const drag = dragRef.current;
		if (drag.pointerId !== event.pointerId) return;

		const panel = panelRef.current;
		if (!panel) return;

		const delta = event.clientY - drag.startY;

		if (drag.pending && !drag.active) {
			if (Math.abs(delta) < SIDEBAR_DRAG_ACTIVATE_DELTA) return;

			if (delta < 0 || panel.scrollTop > 0) {
				drag.pending = false;
				drag.pointerId = null;

				return;
			}

			beginDrag(event.pointerId);
		}

		if (!drag.active) return;

		event.preventDefault();

		const offset = Math.max(0, delta);
		drag.offset = offset;
		applyDragOffset(offset, drag.height);
	};

	const handlePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
		const drag = dragRef.current;
		if (drag.pointerId !== event.pointerId) return;

		const panel = panelRef.current;

		if (panel?.hasPointerCapture(event.pointerId)) {
			panel.releasePointerCapture(event.pointerId);
		}

		if (drag.active) {
			finishDrag(shouldDismissBottomSidebar(drag.offset, drag.height));

			return;
		}

		dragRef.current = { ...SIDEBAR_INITIAL_DRAG };
	};

	return createPortal(
		<div className={getSidebarRootClassName(styles, open)} aria-hidden={!open}>
			<button
				ref={scrimRef}
				type="button"
				className={styles.scrim}
				tabIndex={open ? 0 : -1}
				aria-label="Закрыть"
				onClick={onClose}
			/>

			<aside
				{...rest}
				ref={panelRef}
				className={getSidebarPanelClassName(styles, direction, className)}
				role="dialog"
				aria-modal="true"
				onPointerDown={isBottom ? handlePointerDown : undefined}
				onPointerMove={isBottom ? handlePointerMove : undefined}
				onPointerUp={isBottom ? handlePointerUp : undefined}
				onPointerCancel={isBottom ? handlePointerUp : undefined}
			>
				{isBottom && (
					<div className={styles.handle}>
						<div className={styles.grabber} aria-hidden />
					</div>
				)}

				<div className={styles.body}>{children}</div>
			</aside>
		</div>,
		document.body,
	);
}

Sidebar.displayName = "Sidebar";
