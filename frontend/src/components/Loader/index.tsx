import { CSSTransition, TransitionGroup } from "@/components/Transitions";
import { useAppSelector } from "@/store/hooks";

import { LOADER_DURATION } from "./Loader.config";
import styles from "./Loader.module.scss";
import { getLoaderClassName } from "./Loader.service";
import type { LoaderProps } from "./Loader.types";

/** Знак «Домовой» */
function LogoMark() {
	return (
		<svg className={styles.mark} viewBox="0 0 48 48" focusable="false" aria-hidden>
			<rect width="48" height="48" rx="13" fill="currentColor" />
			<path
				d="M24 9.5 40.5 23.5H36.2V35.6Q36.2 38 33.8 38H14.2Q11.8 38 11.8 35.6V23.5H7.5Z"
				fill="var(--surface)"
			/>
			<path d="M14.2 38V44.4L21.2 38Z" fill="var(--surface)" />
		</svg>
	);
}

/** Глобальный Loader */
export function Loader(props: LoaderProps) {
	const { label = "Загрузка Домового", className } = props;
	const isLoading = useAppSelector((state) => state.ui.isLoading);

	return (
		<TransitionGroup>
			{isLoading && (
				<CSSTransition
					key="loader"
					duration={LOADER_DURATION}
					animatedStyles={["opacity"]}
					className={getLoaderClassName(styles, className)}
					role="status"
					aria-live="polite"
					aria-label={label}
				>
					<div className={styles.brand}>
						<LogoMark />

						<strong className={styles.name}>Домовой</strong>

						<span className={styles.progress} aria-hidden>
							<span className={styles.progressBar} />
						</span>
					</div>
				</CSSTransition>
			)}
		</TransitionGroup>
	);
}

Loader.displayName = "Loader";
