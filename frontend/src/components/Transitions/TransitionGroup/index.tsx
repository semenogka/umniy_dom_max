import {
	Children,
	cloneElement,
	isValidElement,
	type ReactElement,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import type { ChildWithKey, TransitionGroupProps } from "./TransitionGroup.types";

/** Обёртка для анимации появления и исчезновения детей */
export function TransitionGroup(props: TransitionGroupProps) {
	const { children, className } = props;

	const prevChildrenRef = useRef<ChildWithKey[]>([]);
	const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
	const [renderedChildren, setRenderedChildren] = useState<ChildWithKey[]>([]);

	const currentChildrenArray = useMemo(
		() => Children.toArray(children).filter(isValidElement) as ReactElement[],
		[children],
	);

	useEffect(() => {
		const prevChildren = prevChildrenRef.current;
		const nextChildren: ChildWithKey[] = [];

		prevChildren.forEach((prev) => {
			const child = currentChildrenArray.find((c) => c.key === prev.key);

			nextChildren.push({ ...prev, element: child || prev.element, leaving: !child });
		});

		currentChildrenArray.forEach((c) => {
			if (!prevChildren.some((p) => p.key === c.key)) {
				nextChildren.push({ key: String(c.key), element: c, leaving: false });
			}
		});

		prevChildrenRef.current = nextChildren;
		setRenderedChildren(nextChildren);
	}, [currentChildrenArray]);

	const removeLeavingChild = (list: typeof renderedChildren, key: string): ChildWithKey[] => {
		prevChildrenRef.current = prevChildrenRef.current.filter((child) => !child.leaving);

		return list.filter((c) => c.key !== key);
	};

	const getExitUpdater =
		(key: string) =>
		(list: typeof renderedChildren): ChildWithKey[] => {
			const isStillLeaving = list.some((c) => c.key === key && c.leaving);

			if (isStillLeaving) {
				return removeLeavingChild(list, key);
			}

			return list;
		};

	const handleExited = (key: string, duration: number): void => {
		const timer = setTimeout(() => {
			setRenderedChildren(getExitUpdater(key));
			timersRef.current.delete(key);
		}, duration);

		timersRef.current.set(key, timer);
	};

	const handleEnter = (key: string): void => {
		const timerExist = timersRef.current.get(key);

		if (timerExist) {
			clearTimeout(timerExist);
			timersRef.current.delete(key);
		}
	};

	return (
		<div className={className}>
			{renderedChildren.map(({ key, element, leaving }) =>
				cloneElement(element, {
					key,
					visible: !leaving,
					onEnter: () => handleEnter(key),
					onExited: (duration: number) => handleExited(key, duration),
				} as Partial<unknown>),
			)}
		</div>
	);
}

TransitionGroup.displayName = "TransitionGroup";
