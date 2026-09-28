import {
	memo,
	type ReactNode,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { DateChip } from "@/components/DateChip";
import { Icon } from "@/components/Icon";
import { ImageLightbox } from "@/components/ImageLightbox";
import { Message } from "@/components/Message";

import type { ChatMessage } from "../../Chat.types";
import { MESSAGE_LIST_DATE_IDLE_MS, MESSAGE_LIST_READ_DEBOUNCE_MS } from "./MessageList.config";
import styles from "./MessageList.module.scss";
import {
	getMessageListSenderGroupClassName,
	groupMessagesByDate,
	groupMessagesBySender,
	isMessageListNearBottom,
	scrollMessageListToBottom,
	syncMessageListDateStuck,
} from "./MessageList.service";
import type { MessageListProps, SenderGroupProps } from "./MessageList.types";

const HTML_ENTITIES: Record<string, string> = {
	"&amp;": "&",
	"&lt;": "<",
	"&gt;": ">",
	"&quot;": '"',
	"&#x27;": "'",
};

/**
 * Текст Домового: бэкенд экранирует всё внешнее и размечает только <b>,
 * поэтому разбираем <b> и сущности сами, без innerHTML
 * @param text - текст с <b> и HTML-сущностями
 */
function renderBotText(text: string): ReactNode[] {
	const unescape = (value: string) =>
		value.replace(/&(amp|lt|gt|quot|#x27);/g, (entity) => HTML_ENTITIES[entity]);

	return text.split(/(<b>[\s\S]*?<\/b>)/).map((part, index) =>
		part.startsWith("<b>") && part.endsWith("</b>") ? (
			// biome-ignore lint/suspicious/noArrayIndexKey: части неизменяемого текста
			<strong key={index}>{unescape(part.slice(3, -4))}</strong>
		) : (
			unescape(part)
		),
	);
}

/** Группа сообщений одного отправителя */
const SenderGroup = memo(function SenderGroup({
	group,
	onOpenAttachment,
	onBubbleRef,
}: SenderGroupProps) {
	const showAvatar = !group.isOut && Boolean(group.avatarUrl);

	const bubbles = (
		<div className={styles.bubbles}>
			{group.messages.map((message, index) => {
				const isLast = index === group.messages.length - 1;

				return (
					<div
						key={message.id}
						ref={(node) => onBubbleRef?.(message, node)}
						data-server-id={message.serverId}
						data-kind={message.kind}
					>
						<Message
							kind={message.kind}
							author={index === 0 ? message.author : undefined}
							time={message.time}
							delivery={message.delivery}
							tail={isLast}
							className={styles.bubble}
						>
							{message.attachments?.map((attachment, attachmentIndex) =>
								attachment.isImage ? (
									<button
										key={`${message.id}:${attachmentIndex}`}
										type="button"
										className={styles.attachment}
										aria-label="Открыть фото"
										onClick={() => onOpenAttachment?.(attachment.url)}
									>
										<img src={attachment.url} alt={attachment.name} />
									</button>
								) : (
									<a
										key={`${message.id}:${attachmentIndex}`}
										className={styles.file}
										href={attachment.url}
										download={attachment.name}
										target="_blank"
										rel="noreferrer"
									>
										<span className={styles.fileIcon} aria-hidden>
											<Icon name="attachment" size={16} />
										</span>
										<span className={styles.fileName}>{attachment.name}</span>
									</a>
								),
							)}
							{message.html ? renderBotText(message.text) : message.text}
						</Message>
					</div>
				);
			})}
		</div>
	);

	const avatar = showAvatar && (
		<div className={styles.avatarCol}>
			<img className={styles.avatar} src={group.avatarUrl} alt="" aria-hidden />
		</div>
	);

	return (
		<div className={getMessageListSenderGroupClassName(styles, group.isOut)}>
			{group.isOut ? (
				bubbles
			) : (
				<>
					{avatar}
					{bubbles}
				</>
			)}
		</div>
	);
});

/** Лента сообщений */
export const MessageList = memo(function MessageList({
	chat,
	onIncomingVisible,
}: MessageListProps) {
	const [messages, setMessages] = useState<ChatMessage[]>(chat.messages);
	const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const dateSentinelRefs = useRef<Map<string, HTMLElement>>(new Map());
	const dateChipRefs = useRef<Map<string, HTMLElement>>(new Map());
	const stickToBottomRef = useRef(true);
	const dateIdleTimerRef = useRef<number>(0);
	const ignoreScrollRef = useRef(false);
	const reportedReadIdsRef = useRef<Set<number>>(new Set());
	const pendingReadIdsRef = useRef<Set<number>>(new Set());
	const bubbleNodesRef = useRef<Map<number, HTMLElement>>(new Map());
	const readTimerRef = useRef<number>(0);
	const observerRef = useRef<IntersectionObserver | null>(null);
	const onIncomingVisibleRef = useRef(onIncomingVisible);
	onIncomingVisibleRef.current = onIncomingVisible;

	const dateGroups = useMemo(() => {
		return groupMessagesByDate(messages).map((day) => ({
			...day,
			senderGroups: groupMessagesBySender(day.messages),
		}));
	}, [messages]);

	const syncDateChips = useCallback(() => {
		const list = listRef.current;
		if (!list) return;

		syncMessageListDateStuck(list, dateSentinelRefs.current, dateChipRefs.current);
	}, []);

	useEffect(() => {
		stickToBottomRef.current = true;
		setMessages(chat.messages);

		return () => {
			window.clearTimeout(dateIdleTimerRef.current);
		};
	}, [chat]);

	useEffect(() => {
		reportedReadIdsRef.current = new Set();
		pendingReadIdsRef.current = new Set();
		bubbleNodesRef.current = new Map();
		window.clearTimeout(readTimerRef.current);

		return () => {
			window.clearTimeout(readTimerRef.current);
		};
	}, [chat.id]);

	useEffect(() => {
		const root = listRef.current;
		if (!root) return;

		/**
		 * Flush debounce read
		 * @returns {void}
		 */
		const flushReads = () => {
			const ids = [...pendingReadIdsRef.current];
			pendingReadIdsRef.current.clear();
			if (!ids.length) return;

			for (const id of ids) reportedReadIdsRef.current.add(id);
			onIncomingVisibleRef.current?.(ids);
		};

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;

					const kind = (entry.target as HTMLElement).dataset.kind;
					const serverId = Number((entry.target as HTMLElement).dataset.serverId);

					if (kind === "out" || !Number.isFinite(serverId)) continue;
					if (reportedReadIdsRef.current.has(serverId)) continue;

					pendingReadIdsRef.current.add(serverId);
				}

				if (!pendingReadIdsRef.current.size) return;

				window.clearTimeout(readTimerRef.current);
				readTimerRef.current = window.setTimeout(flushReads, MESSAGE_LIST_READ_DEBOUNCE_MS);
			},
			{ root, threshold: 0.6 },
		);

		observerRef.current = observer;

		/** Observer создаётся после mount — догоняем уже отрисованные баблы */
		for (const node of bubbleNodesRef.current.values()) {
			observer.observe(node);
		}

		return () => {
			observer.disconnect();
			observerRef.current = null;
			window.clearTimeout(readTimerRef.current);
		};
	}, [chat.id]);

	useLayoutEffect(() => {
		const list = listRef.current;
		if (!list || !stickToBottomRef.current) return;

		void messages;
		ignoreScrollRef.current = true;
		scrollMessageListToBottom(list);
		list.removeAttribute("data-scrolling");

		requestAnimationFrame(() => {
			syncDateChips();
			ignoreScrollRef.current = false;
		});
	}, [messages, syncDateChips]);

	/**
	 * Скролл ленты
	 * @returns {void}
	 */
	const handleScroll = useCallback(() => {
		const list = listRef.current;
		if (!list) return;

		stickToBottomRef.current = isMessageListNearBottom(list);
		syncDateChips();

		if (ignoreScrollRef.current) return;

		list.dataset.scrolling = "";
		window.clearTimeout(dateIdleTimerRef.current);
		dateIdleTimerRef.current = window.setTimeout(() => {
			list.removeAttribute("data-scrolling");
		}, MESSAGE_LIST_DATE_IDLE_MS);
	}, [syncDateChips]);

	/**
	 * Открыть фото в лайтбоксе
	 * @param url - url вложения
	 * @returns {void}
	 */
	const handleOpenAttachment = useCallback((url: string) => {
		setLightboxSrc(url);
	}, []);

	/**
	 * Закрыть лайтбокс
	 * @returns {void}
	 */
	const handleCloseLightbox = useCallback(() => {
		setLightboxSrc(null);
	}, []);

	/**
	 * Наблюдать за появлением баблы для read receipts
	 * @param message - сообщение ленты
	 * @param node - DOM
	 * @returns {void}
	 */
	const handleBubbleRef = useCallback((message: ChatMessage, node: HTMLElement | null) => {
		const serverId = message.serverId;
		const prev = bubbleNodesRef.current.get(serverId);

		if (prev && prev !== node) {
			observerRef.current?.unobserve(prev);
			bubbleNodesRef.current.delete(serverId);
		}

		if (!node || message.kind === "out" || !Number.isFinite(serverId)) return;

		bubbleNodesRef.current.set(serverId, node);
		observerRef.current?.observe(node);
	}, []);

	/**
	 * Ref-колбэк для sentinel даты
	 * @param dateLabel - подпись дня
	 * @param node - DOM-узел
	 * @returns {void}
	 */
	const setDateSentinelRef = useCallback((dateLabel: string, node: HTMLDivElement | null) => {
		if (node) {
			dateSentinelRefs.current.set(dateLabel, node);
			return;
		}

		dateSentinelRefs.current.delete(dateLabel);
	}, []);

	/**
	 * Ref-колбэк для чипа даты
	 * @param dateLabel - подпись дня
	 * @param node - DOM-узел
	 * @returns {void}
	 */
	const setDateChipRef = useCallback((dateLabel: string, node: HTMLDivElement | null) => {
		if (node) {
			dateChipRefs.current.set(dateLabel, node);
			return;
		}

		dateChipRefs.current.delete(dateLabel);
	}, []);

	return (
		<>
			<div ref={listRef} className={styles.root} onScroll={handleScroll}>
				{dateGroups.map((group) => (
					<div key={group.dateLabel} className={styles.day}>
						<div
							ref={(node) => setDateSentinelRef(group.dateLabel, node)}
							className={styles.dateSentinel}
							aria-hidden
						/>

						<div ref={(node) => setDateChipRef(group.dateLabel, node)} className={styles.date}>
							<DateChip>{group.dateLabel}</DateChip>
						</div>

						{group.senderGroups.map((senderGroup) => (
							<SenderGroup
								key={`${group.dateLabel}:${senderGroup.messages[0]?.id}`}
								group={senderGroup}
								onOpenAttachment={handleOpenAttachment}
								onBubbleRef={handleBubbleRef}
							/>
						))}
					</div>
				))}
			</div>

			<ImageLightbox src={lightboxSrc} open={Boolean(lightboxSrc)} onClose={handleCloseLightbox} />
		</>
	);
});

MessageList.displayName = "MessageList";
