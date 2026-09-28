import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Header } from "@/components/Header";
import { MessageInput } from "@/components/MessageInput";
import { Sidebar } from "@/components/Sidebar";
import { useAppealSocket } from "@/hooks/useAppealSocket";
import { useHouseSocket } from "@/hooks/useHouseSocket";
import { fetchHouseAppeals, createAppeal } from "@/store/appeals/appeals.slice";
import { fetchAppealMessages, sendAppealMessage } from "@/store/appealChat/appealChat.slice";
import { fetchHouseMessages, sendHouseMessage } from "@/store/houseChat/houseChat.slice";
import { fetchUserHouses, selectHouse } from "@/store/houses/houses.slice";
import type { House } from "@/store/houses/houses.types";
import { ensureDemoUser, initCurrentUser } from "@/store/user/user.slice";
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
import { HouseInfoSidebar } from "./components/HouseInfoSidebar";
import { HousePickerSidebar } from "./components/HousePickerSidebar";
import { MessageList } from "./components/MessageList";
import { NewAppealSidebar } from "./components/NewAppealSidebar";
import { buildAppealText } from "./components/NewAppealSidebar/NewAppealSidebar.service";
import type { NewAppealFormValues } from "./components/NewAppealSidebar/NewAppealSidebar.types";

const ChatHeader = memo(function ChatHeader({
	chat,
	onMenuClick,
	onHouseClick,
	onSummaryClick,
}: ChatHeaderProps) {
	return (
		<Header
			type={chat.headerType}
			title={chat.title}
			subtitle={chat.subtitle}
			status={chat.status}
			onMenuClick={onMenuClick}
			onHouseClick={onHouseClick}
			onSummaryClick={onSummaryClick}
		/>
	);
});

const ChatMessageInput = memo(function ChatMessageInput({
	chatId,
	onSubmit,
}: ChatMessageInputProps) {
	return <MessageInput key={chatId} onSubmit={onSubmit} />;
});

/** Страница чата */
export function ChatPage() {
	const { houseId: houseIdParam, appealId } = useParams<{
		houseId?: string;
		appealId?: string;
	}>();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const houses = useAppSelector((state) => state.houses.items);
	const housesStatus = useAppSelector((state) => state.houses.status);
	const selectedHouse = useAppSelector((state) => state.houses.selectedHouse);
	const appeals = useAppSelector((state) => state.appeals.items);
	const houseMessages = useAppSelector((state) => state.houseChat.messages);
	const houseChatHouseId = useAppSelector((state) => state.houseChat.houseId);
	const appealMessages = useAppSelector((state) => state.appealChat.messages);
	const appealChatAppealId = useAppSelector((state) => state.appealChat.appealId);
	const currentUser = useAppSelector((state) => state.user.current);

	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [newAppealOpen, setNewAppealOpen] = useState(false);
	const [housePickerOpen, setHousePickerOpen] = useState(false);
	const [houseInfoOpen, setHouseInfoOpen] = useState(false);
	const [appealDetailsOpen, setAppealDetailsOpen] = useState(false);
	const [actRequestedByChat, setActRequestedByChat] = useState<Record<string, boolean>>({});
	/** WS дома после appeals (messages не блокируют) */
	const [houseSocketReady, setHouseSocketReady] = useState(false);
	/** WS заявки после попытки загрузить messages */
	const [appealSocketReady, setAppealSocketReady] = useState(false);

	const houseId = houseIdParam ?? (selectedHouse ? String(selectedHouse.id) : undefined);
	const isHouseChat = !appealId;
	const appealChatId = appealId && Number.isFinite(Number(appealId)) ? Number(appealId) : null;
	const { sendRead: sendHouseRead } = useHouseSocket({
		houseId: houseSocketReady ? (selectedHouse?.id ?? null) : null,
		userId: currentUser?.id ?? null,
		listenChat: isHouseChat,
	});
	const { sendRead: sendAppealRead } = useAppealSocket({
		appealId: appealSocketReady && !isHouseChat ? appealChatId : null,
		userId: currentUser?.id ?? null,
	});
	const sendRead = isHouseChat ? sendHouseRead : sendAppealRead;
	const visibleHouseMessages =
		isHouseChat && houseId != null && houseChatHouseId === Number(houseId) ? houseMessages : [];
	const visibleAppealMessages =
		appealId != null && appealChatAppealId === Number(appealId) ? appealMessages : [];
	const chat = useMemo(() => {
		if (appealId) {
			return resolveAppealChat(appealId, appeals, visibleAppealMessages, currentUser?.id);
		}

		return resolveHouseChat(
			houseId ?? "house",
			visibleHouseMessages,
			selectedHouse?.address,
			currentUser?.id,
		);
	}, [
		appealId,
		appeals,
		currentUser?.id,
		houseId,
		selectedHouse?.address,
		visibleAppealMessages,
		visibleHouseMessages,
	]);
	const sidebarHouse = selectedHouse ? getChatSidebarHouse(selectedHouse, houses.length) : null;
	const sidebarAppeals = appeals.map(toChatSidebarAppealItem);
	const newAppealHomeContext = selectedHouse?.address;
	const actRequested = Boolean(chat.actRequested || actRequestedByChat[chat.id]);

	useEffect(() => {
		dispatch(initCurrentUser());

		/**
		 * Сначала /users/demo, потом дома
		 * @returns {Promise<void>}
		 */
		const bootstrap = async (): Promise<void> => {
			const demo = await dispatch(ensureDemoUser());
			if (ensureDemoUser.fulfilled.match(demo)) {
				dispatch(fetchUserHouses());
			}
		};

		void bootstrap();
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
		if (!selectedHouse) {
			setHouseSocketReady(false);
			return;
		}

		let cancelled = false;

		setHouseSocketReady(false);

		/**
		 * Appeals → затем messages (последовательно, без гонки fetch в MAX)
		 * @returns {Promise<void>}
		 */
		const load = async (): Promise<void> => {
			try {
				await dispatch(fetchHouseAppeals(selectedHouse.id)).unwrap();
			} catch {
				console.error("Не удалось загрузить обращения дома");
			}

			if (cancelled) return;
			setHouseSocketReady(true);

			if (!isHouseChat) return;

			try {
				await dispatch(fetchHouseMessages(selectedHouse.id)).unwrap();
			} catch {
				console.error("Не удалось загрузить сообщения дома");
			}
		};

		load();

		return () => {
			cancelled = true;
		};
	}, [dispatch, isHouseChat, selectedHouse?.id]);

	useEffect(() => {
		if (!appealId) {
			setAppealSocketReady(false);
			return;
		}

		const id = Number(appealId);
		if (!Number.isFinite(id)) return;

		let cancelled = false;
		setAppealSocketReady(false);

		/**
		 * Сообщения заявки, затем WS
		 * @returns {Promise<void>}
		 */
		const load = async (): Promise<void> => {
			try {
				await dispatch(fetchAppealMessages(id)).unwrap();
			} catch {
				console.error("Не удалось загрузить сообщения заявки");
			}

			if (!cancelled) setAppealSocketReady(true);
		};

		load();

		return () => {
			cancelled = true;
		};
	}, [appealId, dispatch]);

	/**
	 * Отправка сообщения в ленту
	 * @param payload - текст и вложения
	 * @returns {void}
	 */
	const handleSubmit = useCallback(
		(payload: {
			text: string;
			attachments: Array<{ dataUrl: string; name: string; mime: string }>;
		}) => {
			if (!currentUser) return;

			const { text, attachments } = payload;
			const attachmentUrls = attachments.map((item) => item.dataUrl);

			if (isHouseChat && selectedHouse) {
				dispatch(
					sendHouseMessage({
						houseId: selectedHouse.id,
						text,
						attachments: attachmentUrls,
						attachmentMeta: attachments,
						clientId: crypto.randomUUID(),
						senderId: currentUser.id,
						senderName: currentUser.name,
					}),
				);
				return;
			}

			if (appealId) {
				dispatch(
					sendAppealMessage({
						appealId: Number(appealId),
						text,
						attachments: attachmentUrls,
						attachmentMeta: attachments,
						clientId: crypto.randomUUID(),
						senderId: currentUser.id,
						senderName: currentUser.name,
					}),
				);
			}
		},
		[appealId, currentUser, dispatch, isHouseChat, selectedHouse],
	);

	/**
	 * Чужие сообщения в viewport — read via WS
	 * @param messageIds - id сообщений
	 * @returns {void}
	 */
	const handleIncomingVisible = useCallback(
		(messageIds: number[]) => {
			sendRead(messageIds);
		},
		[sendRead],
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
	 * Создание обращения и переход в его чат
	 * @param values - данные формы
	 * @returns {void}
	 */
	const handleCreateAppeal = useCallback(
		(values: NewAppealFormValues) => {
			if (!selectedHouse) return;

			dispatch(
				createAppeal({
					houseId: selectedHouse.id,
					text: buildAppealText(values),
				}),
			)
				.unwrap()
				.then((appeal) => {
					setNewAppealOpen(false);
					navigate(`/chat/${selectedHouse.id}/${appeal.id}`);
				})
				.catch(() => undefined);
		},
		[dispatch, navigate, selectedHouse],
	);

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
	 * Открытие сведений о доме
	 * @returns {void}
	 */
	const handleOpenHouseInfo = useCallback(() => {
		if (!selectedHouse) return;
		setHouseInfoOpen(true);
	}, [selectedHouse]);

	/**
	 * Закрытие сведений о доме
	 * @returns {void}
	 */
	const handleCloseHouseInfo = useCallback(() => {
		setHouseInfoOpen(false);
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
				onHouseClick={handleOpenHouseInfo}
				onSummaryClick={handleOpenAppealDetails}
			/>

			<MessageList key={chat.id} chat={chat} onIncomingVisible={handleIncomingVisible} />

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
						onSubmit={handleCreateAppeal}
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

			<Sidebar direction="bottom" open={houseInfoOpen} onClose={handleCloseHouseInfo}>
				{houseInfoOpen && selectedHouse && (
					<HouseInfoSidebar
						key={`house-info:${selectedHouse.id}`}
						address={selectedHouse.address}
						onClose={handleCloseHouseInfo}
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
