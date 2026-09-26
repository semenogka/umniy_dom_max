import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Header } from "@/components/Header";
import { MessageInput } from "@/components/MessageInput";
import { Sidebar } from "@/components/Sidebar";
import { fetchUserHouses, selectHouse } from "@/store/houses/houses.slice";
import type { House } from "@/store/houses/houses.types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import styles from "./Chat.module.scss";
import { getChatPageClassName, getChatSidebarHouse, resolveChat } from "./Chat.service";
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
	/**
	 * Клик по иконке дома в шапке
	 * @returns {void}
	 */
	const handleHouseClick = useCallback(() => undefined, []);

	/**
	 * Клик по уведомлениям в шапке
	 * @returns {void}
	 */
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
	/**
	 * Прикрепление файла к сообщению
	 * @returns {void}
	 */
	const handleAttach = useCallback(() => undefined, []);

	return <MessageInput key={chatId} onSubmit={onSubmit} onAttach={handleAttach} />;
});

/** Страница чата */
export function ChatPage() {
	const { chatId } = useParams<{ chatId: string }>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const chat = resolveChat(chatId);
	const messageListRef = useRef<MessageListHandle>(null);

	const houses = useAppSelector((state) => state.houses.items);
	const selectedHouse = useAppSelector((state) => state.houses.selectedHouse);

	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [newAppealOpen, setNewAppealOpen] = useState(false);
	const [housePickerOpen, setHousePickerOpen] = useState(false);
	const [appealDetailsOpen, setAppealDetailsOpen] = useState(false);
	const [actRequestedByChat, setActRequestedByChat] = useState<Record<string, boolean>>({});

	const sidebarHouse = selectedHouse ? getChatSidebarHouse(selectedHouse, houses.length) : null;
	const newAppealHomeContext = selectedHouse?.address;
	const actRequested = Boolean(chat.actRequested || actRequestedByChat[chat.id]);

	useEffect(() => {
		dispatch(fetchUserHouses());
	}, [dispatch]);

	/**
	 * Отправка сообщения в ленту
	 * @param text - текст сообщения
	 * @returns {void}
	 */
	const handleSubmit = useCallback((text: string) => {
		messageListRef.current?.addMessage(text);
	}, []);

	/**
	 * Открытие боковой панели чатов
	 * @returns {void}
	 */
	const handleOpenSidebar = useCallback(() => {
		setSidebarOpen(true);
	}, []);

	/**
	 * Закрытие боковой панели чатов
	 * @returns {void}
	 */
	const handleCloseSidebar = useCallback(() => {
		setSidebarOpen(false);
	}, []);

	/**
	 * Открытие формы нового обращения
	 * @returns {void}
	 */
	const handleOpenNewAppeal = useCallback(() => {
		setSidebarOpen(false);
		setNewAppealOpen(true);
	}, []);

	/**
	 * Закрытие формы нового обращения
	 * @returns {void}
	 */
	const handleCloseNewAppeal = useCallback(() => {
		setNewAppealOpen(false);
	}, []);

	/**
	 * Открытие пикера дома
	 * @returns {void}
	 */
	const handleOpenHousePicker = useCallback(() => {
		setSidebarOpen(false);
		setHousePickerOpen(true);
	}, []);

	/**
	 * Закрытие пикера дома
	 * @returns {void}
	 */
	const handleCloseHousePicker = useCallback(() => {
		setHousePickerOpen(false);
	}, []);

	/**
	 * Выбор дома в пикере
	 * @param house - выбранный дом
	 * @returns {void}
	 */
	const handleSelectHouse = useCallback(
		(house: House) => {
			dispatch(selectHouse(house));
		},
		[dispatch],
	);

	/**
	 * Открытие деталей обращения
	 * @returns {void}
	 */
	const handleOpenAppealDetails = useCallback(() => {
		if (chat.type !== "appeal") return;

		setAppealDetailsOpen(true);
	}, [chat.type]);

	/**
	 * Закрытие деталей обращения
	 * @returns {void}
	 */
	const handleCloseAppealDetails = useCallback(() => {
		setAppealDetailsOpen(false);
	}, []);

	/**
	 * Запрос акта по обращению
	 * @returns {void}
	 */
	const handleRequestAct = useCallback(() => {
		setActRequestedByChat((prev) => ({ ...prev, [chat.id]: true }));
	}, [chat.id]);

	/**
	 * Переход к другому чату
	 * @param nextChatId - id чата
	 * @returns {void}
	 */
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
						houses={houses}
						selectedHouse={selectedHouse}
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
