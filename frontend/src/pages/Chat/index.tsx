import { memo, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";

import { Header } from "@/components/Header";
import { MessageInput } from "@/components/MessageInput";
import styles from "./Chat.module.scss";
import { getChatPageClassName, resolveChat } from "./Chat.service";
import type { ChatMock } from "./Chat.types";
import { MessageList, type MessageListHandle } from "./components/MessageList";

const ChatHeader = memo(function ChatHeader({ chat }: { chat: ChatMock }) {
	const handleMenuClick = useCallback(() => undefined, []);
	const handleHouseClick = useCallback(() => undefined, []);
	const handleNotificationsClick = useCallback(() => undefined, []);
	const handleSummaryClick = useCallback(() => undefined, []);

	return (
		<Header
			type={chat.headerType}
			title={chat.title}
			subtitle={chat.subtitle}
			status={chat.status}
			badgeCount={chat.badgeCount}
			onMenuClick={handleMenuClick}
			onHouseClick={handleHouseClick}
			onNotificationsClick={handleNotificationsClick}
			onSummaryClick={handleSummaryClick}
		/>
	);
});

const ChatMessageInput = memo(function ChatMessageInput({
	chatId,
	onSubmit,
}: {
	chatId: string;
	onSubmit: (text: string) => void;
}) {
	const handleAttach = useCallback(() => undefined, []);

	return <MessageInput key={chatId} onSubmit={onSubmit} onAttach={handleAttach} />;
});

/** Страница чата */
export function ChatPage() {
	const { chatId } = useParams<{ chatId: string }>();
	const chat = resolveChat(chatId);
	const messageListRef = useRef<MessageListHandle>(null);

	const handleSubmit = useCallback((text: string) => {
		messageListRef.current?.addMessage(text);
	}, []);

	return (
		<div className={getChatPageClassName(styles)}>
			<ChatHeader chat={chat} />
			<MessageList ref={messageListRef} chat={chat} />
			<ChatMessageInput chatId={chat.id} onSubmit={handleSubmit} />
		</div>
	);
}

ChatPage.displayName = "ChatPage";
