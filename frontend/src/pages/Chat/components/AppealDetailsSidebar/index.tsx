import { useId } from "react";

import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { Status } from "@/components/Status";
import { STATUS_ICON_SIZE, STATUS_META } from "@/components/Status/Status.config";
import {
	APPEAL_DETAILS_ACT_LABEL,
	APPEAL_DETAILS_ACT_REQUESTED_LABEL,
	APPEAL_DETAILS_OPERATOR_LABEL,
	APPEAL_DETAILS_TITLE,
} from "./AppealDetailsSidebar.config";
import styles from "./AppealDetailsSidebar.module.scss";
import {
	getAppealDetailsNumberLabel,
	getAppealDetailsSidebarClassName,
} from "./AppealDetailsSidebar.service";
import type { AppealDetailsSidebarProps } from "./AppealDetailsSidebar.types";

/** Лист сведений о заявке */
export function AppealDetailsSidebar(props: AppealDetailsSidebarProps) {
	const { chat, actRequested = false, onRequestAct, onClose, className } = props;
	const titleId = useId();
	const status = chat.status ?? "in-progress";
	const statusMeta = STATUS_META[status];
	const showActAction = status === "in-progress";

	return (
		<div className={getAppealDetailsSidebarClassName(styles, className)} aria-labelledby={titleId}>
			<div className={styles.head}>
				<h2 id={titleId} className={styles.title}>
					{APPEAL_DETAILS_TITLE}
				</h2>

				<Button variant="icon" type="button" aria-label="Закрыть" onClick={onClose}>
					<Icon name="close" size="xl" />
				</Button>
			</div>

			<article className={styles.card}>
				<div className={styles.top}>
					<Status status={status}>
						<Icon name={statusMeta.icon} size={STATUS_ICON_SIZE} />
						{statusMeta.label}
					</Status>

					<span className={styles.number}>{getAppealDetailsNumberLabel(chat.number)}</span>
				</div>

				{chat.operator && (
					<section className={styles.operator}>
						<p className={styles.operatorLabel}>{APPEAL_DETAILS_OPERATOR_LABEL}</p>

						<div className={styles.operatorRow}>
							<div className={styles.operatorAvatar} aria-hidden>
								{chat.operator.avatarUrl ? (
									<img
										className={styles.operatorAvatarImage}
										src={chat.operator.avatarUrl}
										alt=""
									/>
								) : (
									chat.operator.initials
								)}
							</div>

							<div className={styles.operatorCopy}>
								<strong className={styles.operatorName}>{chat.operator.name}</strong>
								<small className={styles.operatorRole}>{chat.operator.role}</small>
							</div>
						</div>
					</section>
				)}
			</article>

			{showActAction && (
				<div className={styles.actions}>
					<Button
						variant="outline"
						type="button"
						className={styles.actButton}
						disabled={actRequested}
						onClick={onRequestAct}
					>
						{actRequested ? APPEAL_DETAILS_ACT_REQUESTED_LABEL : APPEAL_DETAILS_ACT_LABEL}
					</Button>
				</div>
			)}
		</div>
	);
}

AppealDetailsSidebar.displayName = "AppealDetailsSidebar";
