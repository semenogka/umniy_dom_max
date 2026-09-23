import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";

import { HEADER_DEFAULT_TYPE } from "./Header.config";
import styles from "./Header.module.scss";
import { getHeaderClassName, getHeaderStatusClassName } from "./Header.service";
import type { HeaderProps } from "./Header.types";

/** Шапка приложения */
export function Header(props: HeaderProps) {
	const {
		type = HEADER_DEFAULT_TYPE,
		title,
		subtitle,
		status = "in-progress",
		badgeCount,
		onSummaryClick,
		onMenuClick,
		onHouseClick,
		onNotificationsClick,
		className,
		...rest
	} = props;

	const isAppeal = type === "appeal";
	const showStatusDot = isAppeal && Boolean(subtitle);

	return (
		<header className={getHeaderClassName(styles, className)} {...rest}>
			<Button
				variant="icon"
				className={styles.menu}
				aria-label="Открыть список обращений"
				onClick={onMenuClick}
			>
				<Icon name="sidebar" size="xl" />
			</Button>

			<button
				type="button"
				className={styles.summary}
				disabled={!isAppeal}
				aria-haspopup={isAppeal ? "dialog" : undefined}
				aria-label={isAppeal ? "Открыть сведения о заявке" : undefined}
				onClick={isAppeal ? onSummaryClick : undefined}
			>
				<span className={styles.titleBlock}>
					<strong className={styles.title}>{title}</strong>

					{subtitle && (
						<span className={styles.subtitle}>
							{showStatusDot && (
								<span className={getHeaderStatusClassName(styles, status)} aria-hidden />
							)}

							{subtitle}
						</span>
					)}
				</span>

				{isAppeal && <Icon name="chevron-down" size="md" className={styles.chevron} />}
			</button>

			<div className={styles.actions}>
				<Button variant="icon" aria-label="Информация о доме" onClick={onHouseClick}>
					<Icon name="building" size="xl" />
				</Button>

				<Button
					variant="icon"
					className={styles.notification}
					aria-label={badgeCount ? `Уведомления, ${badgeCount} новых` : "Уведомления"}
					onClick={onNotificationsClick}
				>
					<Icon name="bell" size="xl" />

					{Boolean(badgeCount) && <Badge className={styles.badge}>{badgeCount}</Badge>}
				</Button>
			</div>
		</header>
	);
}

Header.displayName = "Header";
