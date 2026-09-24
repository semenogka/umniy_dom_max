import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { STATUS_META } from "@/components/Status/Status.config";
import { CHAT_SIDEBAR_APPEALS, CONVERSATION_CHAT_MOCK } from "../../Chat.mock";
import {
	CHAT_SIDEBAR_RESIDENTS_META,
	CHAT_SIDEBAR_SUPPORT_META,
	CHAT_SIDEBAR_SUPPORT_TITLE,
} from "./ChatSidebar.config";
import styles from "./ChatSidebar.module.scss";
import {
	getChatSidebarClassName,
	getChatSidebarItemClassName,
	getChatSidebarStatusIconClassName,
} from "./ChatSidebar.service";
import type { ChatSidebarProps } from "./ChatSidebar.types";

/** Содержимое боковой панели чатов */
export function ChatSidebar(props: ChatSidebarProps) {
	const {
		activeChatId,
		houseAddress,
		houseMeta,
		onSelectChat,
		onNewAppeal,
		onSelectHouse,
		onClose,
		className,
	} = props;
	const residentsActive = activeChatId === CONVERSATION_CHAT_MOCK.id;

	return (
		<div className={getChatSidebarClassName(styles, className)}>
			<div className={styles.head}>
				<div className={styles.brand}>
					<img className={styles.brandMark} src="/favicon.svg" alt="" aria-hidden />
					<strong className={styles.brandName}>Домовой</strong>
				</div>

				<Button variant="icon" type="button" aria-label="Закрыть" onClick={onClose}>
					<Icon name="close" size="xl" />
				</Button>
			</div>

			<button
				type="button"
				className={styles.house}
				aria-label="Выбрать дом"
				onClick={onSelectHouse}
			>
				<span className={styles.houseIcon} aria-hidden>
					<Icon name="building" size="md" />
				</span>

				<span className={styles.houseCopy}>
					<strong className={styles.houseAddress}>{houseAddress}</strong>
					<span className={styles.houseMeta}>{houseMeta}</span>
				</span>

				<Icon name="chevron-right" size="sm" className={styles.houseChevron} />
			</button>

			<Button variant="inverse" type="button" className={styles.newAppeal} onClick={onNewAppeal}>
				<Icon name="message-plus" size="lg" />
				Новое обращение
			</Button>

			<div className={styles.residents}>
				<button
					type="button"
					className={[styles.residentsButton, residentsActive && styles.residentsButtonActive]
						.filter(Boolean)
						.join(" ")}
					aria-current={residentsActive ? "page" : undefined}
					aria-label={`Чат жителей дома, ${CHAT_SIDEBAR_RESIDENTS_META}`}
					onClick={() => onSelectChat?.(CONVERSATION_CHAT_MOCK.id)}
				>
					<span className={styles.residentsIcon} aria-hidden>
						<Icon name="residents" size="lg" />
					</span>

					<span className={styles.residentsCopy}>
						<strong className={styles.residentsTitle}>Чат жителей дома</strong>

						<span className={styles.residentsMeta}>{CHAT_SIDEBAR_RESIDENTS_META}</span>
					</span>

					<Icon name="pin" size="md" className={styles.residentsPin} />
				</button>
			</div>

			<nav className={styles.list} aria-label="Обращения">
				{CHAT_SIDEBAR_APPEALS.map((appeal) => {
					const active = appeal.id === activeChatId;
					const icon = STATUS_META[appeal.status].icon;

					return (
						<button
							key={appeal.id}
							type="button"
							className={getChatSidebarItemClassName(styles, active)}
							aria-current={active ? "page" : undefined}
							onClick={() => onSelectChat?.(appeal.id)}
						>
							<span
								className={getChatSidebarStatusIconClassName(styles, appeal.status)}
								aria-hidden
							>
								<Icon name={icon} size="md" />
							</span>

							<span className={styles.itemCopy}>
								<strong className={styles.itemTitle}>{appeal.title}</strong>

								<span className={styles.itemMeta}>{appeal.meta}</span>
							</span>
						</button>
					);
				})}
			</nav>

			<div className={styles.support}>
				<button
					type="button"
					className={styles.supportItem}
					aria-label={CHAT_SIDEBAR_SUPPORT_TITLE}
				>
					<span className={styles.supportIdentity} aria-hidden>
						<img className={styles.supportMark} src="/favicon.svg" alt="" />

						<span className={styles.supportBadge}>
							<Icon name="headset" size={11} />
						</span>
					</span>

					<span className={styles.itemCopy}>
						<strong className={styles.itemTitle}>{CHAT_SIDEBAR_SUPPORT_TITLE}</strong>

						<span className={styles.itemMeta}>{CHAT_SIDEBAR_SUPPORT_META}</span>
					</span>
				</button>
			</div>
		</div>
	);
}

ChatSidebar.displayName = "ChatSidebar";
