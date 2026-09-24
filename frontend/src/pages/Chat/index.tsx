import { memo, useCallback, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Header } from "@/components/Header";
import { MessageInput } from "@/components/MessageInput";
import { Sidebar } from "@/components/Sidebar";
import styles from "./Chat.module.scss";
import { getChatPageClassName, resolveChat } from "./Chat.service";
import type { ChatHeaderProps, ChatMessageInputProps } from "./Chat.types";
import { ChatSidebar } from "./components/ChatSidebar";
import { MessageList, type MessageListHandle } from "./components/MessageList";

const ChatHeader = memo(function ChatHeader({ chat, onMenuClick }: ChatHeaderProps) {
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
			onMenuClick={onMenuClick}
			onHouseClick={handleHouseClick}
			onNotificationsClick={handleNotificationsClick}
			onSummaryClick={handleSummaryClick}
		/>
	);
});

const ChatMessageInput = memo(function ChatMessageInput({
	chatId,
	onSubmit,
}: ChatMessageInputProps) {
	const handleAttach = useCallback(() => undefined, []);

	return <MessageInput key={chatId} onSubmit={onSubmit} onAttach={handleAttach} />;
});

/** Страница чата */
export function ChatPage() {
	const { chatId } = useParams<{ chatId: string }>();
	const navigate = useNavigate();
	const chat = resolveChat(chatId);
	const messageListRef = useRef<MessageListHandle>(null);
	const [sidebarOpen, setSidebarOpen] = useState(false);

	const handleSubmit = useCallback((text: string) => {
		messageListRef.current?.addMessage(text);
	}, []);

	const handleOpenSidebar = useCallback(() => {
		setSidebarOpen(true);
	}, []);

	const handleCloseSidebar = useCallback(() => {
		setSidebarOpen(false);
	}, []);

	const handleSelectChat = useCallback(
		(nextChatId: string) => {
			setSidebarOpen(false);
			navigate(`/chat/${nextChatId}`);
		},
		[navigate],
	);

	return (
		<div className={getChatPageClassName(styles)}>
			<ChatHeader chat={chat} onMenuClick={handleOpenSidebar} />

			<MessageList ref={messageListRef} chat={chat} />

			<ChatMessageInput chatId={chat.id} onSubmit={handleSubmit} />

			<Sidebar direction="left" open={sidebarOpen} onClose={handleCloseSidebar}>
				<ChatSidebar
					activeChatId={chat.id}
					onSelectChat={handleSelectChat}
					onClose={handleCloseSidebar}
				/>
			</Sidebar>
		</div>
	);
}

ChatPage.displayName = "ChatPage";
