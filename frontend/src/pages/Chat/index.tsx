import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Header } from "@/components/Header";
import { MessageInput } from "@/components/MessageInput";
import { Sidebar } from "@/components/Sidebar";
import { fetchHouseAppeals } from "@/store/appeals/appeals.slice";
import { fetchHouseMessages, sendHouseMessage } from "@/store/houseChat/houseChat.slice";
import { fetchUserHouses, selectHouse } from "@/store/houses/houses.slice";
import type { House } from "@/store/houses/houses.types";
import { initCurrentUser } from "@/store/user/user.slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

import styles from "./Chat.module.scss";
import {
	getChatPageClassName,
	getChatSidebarHouse,
	resolveAppealChat,
	resolveHouseChat,
	toChatSidebarAppealItem,
} from "./Chat.service";
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
	const { houseId: houseIdParam, appealId } = useParams<{
		houseId?: string;
		appealId?: string;
	}>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const messageListRef = useRef<MessageListHandle>(null);

	const houses = useAppSelector((state) => state.houses.items);
	const housesStatus = useAppSelector((state) => state.houses.status);
	const selectedHouse = useAppSelector((state) => state.houses.selectedHouse);
	const appeals = useAppSelector((state) => state.appeals.items);
	const houseMessages = useAppSelector((state) => state.houseChat.messages);
	const houseChatHouseId = useAppSelector((state) => state.houseChat.houseId);
	const currentUser = useAppSelector((state) => state.user.current);

	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [newAppealOpen, setNewAppealOpen] = useState(false);
	const [housePickerOpen, setHousePickerOpen] = useState(false);
	const [appealDetailsOpen, setAppealDetailsOpen] = useState(false);
	const [actRequestedByChat, setActRequestedByChat] = useState<Record<string, boolean>>({});

	const houseId = houseIdParam ?? (selectedHouse ? String(selectedHouse.id) : undefined);
	const isHouseChat = !appealId;
	const visibleHouseMessages =
		houseId != null && houseChatHouseId === Number(houseId) ? houseMessages : [];
	const chat = useMemo(() => {
		if (appealId) return resolveAppealChat(appealId, appeals);

		return resolveHouseChat(
			houseId ?? "house",
			visibleHouseMessages,
			selectedHouse?.address,
			currentUser?.id,
		);
	}, [appealId, appeals, currentUser?.id, houseId, selectedHouse?.address, visibleHouseMessages]);
	const sidebarHouse = selectedHouse ? getChatSidebarHouse(selectedHouse, houses.length) : null;
	const sidebarAppeals = appeals.map(toChatSidebarAppealItem);
	const newAppealHomeContext = selectedHouse?.address;
	const actRequested = Boolean(chat.actRequested || actRequestedByChat[chat.id]);

	useEffect(() => {
		dispatch(initCurrentUser());
		dispatch(fetchUserHouses());
	}, [dispatch]);

	useEffect(() => {
		if (housesStatus !== "succeeded" || houses.length === 0) return;

		const houseFromUrl = houseIdParam
			? houses.find((house) => String(house.id) === houseIdParam)
			: undefined;
		const nextHouse = houseFromUrl ?? houses[0];

		if (!houseIdParam || !houseFromUrl) {
			navigate(`/chat/${nextHouse.id}`, { replace: true });
			return;
		}

		if (selectedHouse?.id !== nextHouse.id) {
			dispatch(selectHouse(nextHouse));
		}
	}, [dispatch, houses, housesStatus, houseIdParam, navigate, selectedHouse?.id]);

	useEffect(() => {
		if (!selectedHouse) return;

		dispatch(fetchHouseAppeals(selectedHouse.id));
	}, [dispatch, selectedHouse?.id]);

	useEffect(() => {
		if (!selectedHouse || !isHouseChat) return;

		dispatch(fetchHouseMessages(selectedHouse.id));
	}, [dispatch, isHouseChat, selectedHouse?.id]);

	/**
	 * Отправка сообщения в ленту
	 * @param text - текст сообщения
	 * @returns {void}
	 */
	const handleSubmit = useCallback(
		(text: string) => {
			if (isHouseChat && selectedHouse && currentUser) {
				dispatch(
					sendHouseMessage({
						houseId: selectedHouse.id,
						text,
						clientId: crypto.randomUUID(),
						senderId: currentUser.id,
						senderName: currentUser.name,
					}),
				);
				return;
			}

			messageListRef.current?.addMessage(text);
		},
		[currentUser, dispatch, isHouseChat, selectedHouse],
	);

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
			navigate(`/chat/${house.id}`);
		},
		[dispatch, navigate],
	);

	/**
	 * Открытие чата жителей текущего дома
	 * @returns {void}
	 */
	const handleSelectResidents = useCallback(() => {
		if (!selectedHouse) return;

		setSidebarOpen(false);
		navigate(`/chat/${selectedHouse.id}`);
	}, [navigate, selectedHouse]);

	/**
	 * Открытие обращения
	 * @param nextAppealId - id обращения
	 * @returns {void}
	 */
	const handleSelectAppeal = useCallback(
		(nextAppealId: string) => {
			if (!selectedHouse) return;

			setSidebarOpen(false);
			navigate(`/chat/${selectedHouse.id}/${nextAppealId}`);
		},
		[navigate, selectedHouse],
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

	return (
		<div className={getChatPageClassName(styles)}>
			<ChatHeader
				chat={chat}
				onMenuClick={handleOpenSidebar}
				onSummaryClick={handleOpenAppealDetails}
			/>

			<MessageList key={chat.id} ref={messageListRef} chat={chat} />

			<ChatMessageInput chatId={chat.id} onSubmit={handleSubmit} />

			<Sidebar direction="left" open={sidebarOpen} onClose={handleCloseSidebar}>
				{sidebarHouse && (
					<ChatSidebar
						activeAppealId={appealId}
						houseAddress={sidebarHouse.address}
						houseMeta={sidebarHouse.meta}
						appeals={sidebarAppeals}
						onSelectResidents={handleSelectResidents}
						onSelectAppeal={handleSelectAppeal}
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
