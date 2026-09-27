import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

import { STATUS_META } from "@/components/Status/Status.config";
import { isImageFile } from "@/components/MessageInput/MessageInput.service";
import type { Appeal } from "@/store/appeals/appeals.types";
import type { House, HouseMessage } from "@/store/houses/houses.types";
import { pluralizeRu } from "@/utils/pluralizeRu";

import { CHAT_TODAY_LABEL, HOUSE_CHAT_TITLE } from "./Chat.config";
import type {
	Chat,
	ChatAttachment,
	ChatMessage,
	ChatSidebarAppealItem,
	ChatSidebarHouse,
} from "./Chat.types";

/**
 * Собирает className страницы чата
 * @param styles - классы из модуля
 * @param className - дополнительный класс
 */
export function getChatPageClassName(styles: Record<string, string>, className?: string): string {
	return [styles.root, className].filter(Boolean).join(" ");
}

/**
 * Время сообщения
 * @param iso - ISO-дата с бэка
 */
function formatMessageTime(iso: string): string {
	return format(parseISO(iso), "HH:mm");
}

/**
 * Подпись дня для ленты
 * @param iso - ISO-дата с бэка
 */
function formatMessageDateLabel(iso: string): string {
	const date = parseISO(iso);

	if (isToday(date)) return CHAT_TODAY_LABEL;
	if (isYesterday(date)) return "Вчера";

	return format(date, "d MMMM", { locale: ru });
}

/**
 * Имя файла из url / data URL
 * @param url - url вложения
 * @param fallbackName - локальное имя
 */
function getAttachmentName(url: string, fallbackName?: string): string {
	if (fallbackName) return fallbackName;

	if (url.startsWith("data:")) {
		const mime = url.slice(5).split(";")[0] ?? "file";
		const subtype = mime.split("/")[1] ?? "bin";
		return `file.${subtype}`;
	}

	try {
		const path = new URL(url).pathname;
		const name = path.split("/").pop();
		if (name) return decodeURIComponent(name);
	} catch {
		/* ignore */
	}

	return "Файл";
}

/**
 * Вложение API → вложение ленты
 * @param url - url
 * @param name - имя
 */
function toChatAttachment(url: string, name?: string): ChatAttachment {
	return {
		url,
		name: getAttachmentName(url, name),
		isImage: isImageFile(url),
	};
}

/**
 * Сообщение API → сообщение ленты
 * @param message - сообщение с бэка
 * @param currentUserId - id текущего пользователя MAX
 */
export function toChatMessage(message: HouseMessage, currentUserId?: number | null): ChatMessage {
	const isOut = currentUserId != null && message.sender_id === currentUserId;
	const attachments = [...(message.attachments ?? [])]
		.sort((a, b) => a.ord - b.ord)
		.filter((item) => Boolean(item.url))
		.map((item) => toChatAttachment(item.url, item.name));

	return {
		id: message.clientId ?? String(message.id),
		kind: isOut ? "out" : "bot",
		author: isOut ? undefined : message.sender,
		text: message.text,
		time: formatMessageTime(message.created_at),
		dateLabel: formatMessageDateLabel(message.created_at),
		delivery: isOut ? (message.delivery ?? "sent") : undefined,
		attachments: attachments.length ? attachments : undefined,
	};
}

/**
 * Чат жителей для выбранного дома
 * @param houseId - id дома из URL
 * @param messages - сообщения с бэка
 * @param subtitle - подзаголовок (адрес)
 * @param currentUserId - id текущего пользователя MAX
 */
export function resolveHouseChat(
	houseId: string,
	messages: HouseMessage[],
	subtitle?: string,
	currentUserId?: number | null,
): Chat {
	return {
		id: houseId,
		type: "conversation",
		headerType: "conversation",
		title: HOUSE_CHAT_TITLE,
		subtitle: subtitle ?? "",
		messages: messages.map((message) => toChatMessage(message, currentUserId)),
	};
}

/**
 * Чат обращения: шапка из списка + сообщения из стора
 * @param appealId - id обращения из URL
 * @param appeals - список обращений дома
 * @param messages - сообщения чата обращения
 * @param currentUserId - id текущего пользователя MAX
 */
export function resolveAppealChat(
	appealId: string,
	appeals: Appeal[],
	messages: HouseMessage[] = [],
	currentUserId?: number | null,
): Chat {
	const appeal = appeals.find((item) => String(item.id) === appealId);
	const chatMessages = messages.map((message) => toChatMessage(message, currentUserId));

	if (!appeal) {
		return {
			id: appealId,
			type: "appeal",
			headerType: "appeal",
			title: `Обращение №${appealId}`,
			subtitle: "В работе",
			status: "in_progress",
			number: appealId,
			messages: chatMessages,
		};
	}

	const title = appeal.problem_type?.trim() || appeal.text.trim() || `Обращение №${appeal.id}`;

	return {
		id: String(appeal.id),
		type: "appeal",
		headerType: "appeal",
		title,
		subtitle: STATUS_META[appeal.status].label,
		status: appeal.status,
		number: String(appeal.id),
		messages: chatMessages,
	};
}

/**
 * Данные дома для кнопки в сайдбаре
 * @param house - выбранный дом
 * @param housesCount - всего домов у пользователя
 */
export function getChatSidebarHouse(house: House, housesCount: number): ChatSidebarHouse {
	return {
		address: house.address,
		meta: pluralizeRu(housesCount, ["дом", "дома", "домов"], true),
	};
}

/**
 * Пункт сайдбара из обращения API
 * @param appeal - обращение
 */
export function toChatSidebarAppealItem(appeal: Appeal): ChatSidebarAppealItem {
	const title = appeal.problem_type?.trim() || appeal.text.trim() || `Обращение №${appeal.id}`;

	return {
		id: String(appeal.id),
		title,
		meta: STATUS_META[appeal.status].label,
		status: appeal.status,
	};
}
