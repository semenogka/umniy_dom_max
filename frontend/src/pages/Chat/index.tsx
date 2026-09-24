import { memo, useCallback, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Header } from "@/components/Header";
import { MessageInput } from "@/components/MessageInput";
import { Sidebar } from "@/components/Sidebar";
import {
	CHAT_HOUSES,
	DEFAULT_CHAT_HOUSE_ID,
	getChatSidebarHouse,
	getNewAppealHomeContext,
} from "./Chat.mock";
import styles from "./Chat.module.scss";
import { getChatPageClassName, resolveChat } from "./Chat.service";
import type { ChatHeaderProps, ChatMessageInputProps } from "./Chat.types";
import { AppealDetailsSidebar } from "./components/AppealDetailsSidebar";
import { ChatSidebar } from "./components/ChatSidebar";
import { HousePickerSidebar } from "./components/HousePickerSidebar";
import { MessageList, type MessageListHandle } from "./components/MessageList";
import { NewAppealSidebar } from "./components/NewAppealSidebar";

const ChatHeader = memo(function ChatHeader({
	chat,
	onMenuClick,
	onSummaryClick,
}: ChatHeaderProps) {
	const handleHouseClick = useCallback(() => undefined, []);
	const handleNotificationsClick = useCallback(() => undefined, []);

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
			onSummaryClick={onSummaryClick}
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
	const [newAppealOpen, setNewAppealOpen] = useState(false);
	const [housePickerOpen, setHousePickerOpen] = useState(false);
	const [appealDetailsOpen, setAppealDetailsOpen] = useState(false);
	const [actRequestedByChat, setActRequestedByChat] = useState<Record<string, boolean>>({});
	const [selectedHouseId, setSelectedHouseId] = useState(DEFAULT_CHAT_HOUSE_ID);

	const selectedHouse = CHAT_HOUSES.find((house) => house.id === selectedHouseId) ?? CHAT_HOUSES[0];
	const sidebarHouse = selectedHouse ? getChatSidebarHouse(selectedHouse) : null;
	const newAppealHomeContext = selectedHouse ? getNewAppealHomeContext(selectedHouse) : undefined;
	const actRequested = Boolean(chat.actRequested || actRequestedByChat[chat.id]);

	const handleSubmit = useCallback((text: string) => {
		messageListRef.current?.addMessage(text);
	}, []);

	const handleOpenSidebar = useCallback(() => {
		setSidebarOpen(true);
	}, []);

	const handleCloseSidebar = useCallback(() => {
		setSidebarOpen(false);
	}, []);

	const handleOpenNewAppeal = useCallback(() => {
		setSidebarOpen(false);
		setNewAppealOpen(true);
	}, []);

	const handleCloseNewAppeal = useCallback(() => {
		setNewAppealOpen(false);
	}, []);

	const handleOpenHousePicker = useCallback(() => {
		setSidebarOpen(false);
		setHousePickerOpen(true);
	}, []);

	const handleCloseHousePicker = useCallback(() => {
		setHousePickerOpen(false);
	}, []);

	const handleSelectHouse = useCallback((houseId: string) => {
		setSelectedHouseId(houseId);
	}, []);

	const handleOpenAppealDetails = useCallback(() => {
		if (chat.type !== "appeal") return;

		setAppealDetailsOpen(true);
	}, [chat.type]);

	const handleCloseAppealDetails = useCallback(() => {
		setAppealDetailsOpen(false);
	}, []);

	const handleRequestAct = useCallback(() => {
		setActRequestedByChat((prev) => ({ ...prev, [chat.id]: true }));
	}, [chat.id]);

	const handleSelectChat = useCallback(
		(nextChatId: string) => {
			setSidebarOpen(false);
			navigate(`/chat/${nextChatId}`);
		},
		[navigate],
	);

	return (
		<div className={getChatPageClassName(styles)}>
			<ChatHeader
				chat={chat}
				onMenuClick={handleOpenSidebar}
				onSummaryClick={handleOpenAppealDetails}
			/>

			<MessageList ref={messageListRef} chat={chat} />

			<ChatMessageInput chatId={chat.id} onSubmit={handleSubmit} />

			<Sidebar direction="left" open={sidebarOpen} onClose={handleCloseSidebar}>
				{sidebarHouse && (
					<ChatSidebar
						activeChatId={chat.id}
						houseAddress={sidebarHouse.address}
						houseMeta={sidebarHouse.meta}
						onSelectChat={handleSelectChat}
						onNewAppeal={handleOpenNewAppeal}
						onSelectHouse={handleOpenHousePicker}
						onClose={handleCloseSidebar}
					/>
				)}
			</Sidebar>

			<Sidebar direction="bottom" open={newAppealOpen} onClose={handleCloseNewAppeal}>
				{newAppealOpen && (
					<NewAppealSidebar
						key="new-appeal"
						homeContext={newAppealHomeContext}
						onClose={handleCloseNewAppeal}
					/>
				)}
			</Sidebar>

			<Sidebar direction="bottom" open={housePickerOpen} onClose={handleCloseHousePicker}>
				{housePickerOpen && (
					<HousePickerSidebar
						key="house-picker"
						houses={CHAT_HOUSES}
						selectedHouseId={selectedHouseId}
						onSelectHouse={handleSelectHouse}
						onClose={handleCloseHousePicker}
					/>
				)}
			</Sidebar>

			<Sidebar direction="bottom" open={appealDetailsOpen} onClose={handleCloseAppealDetails}>
				{appealDetailsOpen && chat.type === "appeal" && (
					<AppealDetailsSidebar
						key={`appeal-details:${chat.id}`}
						chat={chat}
						actRequested={actRequested}
						onRequestAct={handleRequestAct}
						onClose={handleCloseAppealDetails}
					/>
				)}
			</Sidebar>
		</div>
	);
}

ChatPage.displayName = "ChatPage";
