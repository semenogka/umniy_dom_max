import {
	memo,
	useCallback,
	useEffect,
	useImperativeHandle,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";

import { DateChip } from "@/components/DateChip";
import { Message } from "@/components/Message";

import { CHAT_TODAY_LABEL } from "../../Chat.mock";
import type { ChatMessage } from "../../Chat.types";
import { MESSAGE_LIST_DATE_IDLE_MS } from "./MessageList.config";
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

/** Группа сообщений одного отправителя */
const SenderGroup = memo(function SenderGroup({ group }: SenderGroupProps) {
	const showAvatar = !group.isOut && Boolean(group.avatarUrl);

	const bubbles = (
		<div className={styles.bubbles}>
			{group.messages.map((message, index) => {
				const isLast = index === group.messages.length - 1;

				return (
					<Message
						key={message.id}
						kind={message.kind}
						author={index === 0 ? message.author : undefined}
						time={message.time}
						delivery={message.delivery}
						tail={isLast}
						className={styles.bubble}
					>
						{message.text}
					</Message>
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
export const MessageList = memo(function MessageList({ chat, ref }: MessageListProps) {
	const [messages, setMessages] = useState<ChatMessage[]>(chat.messages);
	const listRef = useRef<HTMLDivElement>(null);
	const dateSentinelRefs = useRef<Map<string, HTMLElement>>(new Map());
	const dateChipRefs = useRef<Map<string, HTMLElement>>(new Map());
	const stickToBottomRef = useRef(true);
	const dateIdleTimerRef = useRef<number>(0);
	const ignoreScrollRef = useRef(false);

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

	useImperativeHandle(
		ref,
		() => ({
			addMessage: (text: string) => {
				const next: ChatMessage = {
					id: String(Date.now()),
					kind: "out",
					dateLabel: CHAT_TODAY_LABEL,
					text,
					time: new Date().toLocaleTimeString("ru-RU", {
						hour: "2-digit",
						minute: "2-digit",
					}),
					delivery: "sent",
				};

				stickToBottomRef.current = true;
				setMessages((prev) => [...prev, next]);
			},
		}),
		[],
	);

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

	const setDateSentinelRef = useCallback((dateLabel: string, node: HTMLDivElement | null) => {
		if (node) {
			dateSentinelRefs.current.set(dateLabel, node);
			return;
		}

		dateSentinelRefs.current.delete(dateLabel);
	}, []);

	const setDateChipRef = useCallback((dateLabel: string, node: HTMLDivElement | null) => {
		if (node) {
			dateChipRefs.current.set(dateLabel, node);
			return;
		}

		dateChipRefs.current.delete(dateLabel);
	}, []);

	return (
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
						/>
					))}
				</div>
			))}
		</div>
	);
});

MessageList.displayName = "MessageList";

export type { MessageListHandle, MessageListProps } from "./MessageList.types";
