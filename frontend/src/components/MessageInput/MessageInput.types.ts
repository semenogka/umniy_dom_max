import type { ReactNode, SubmitEvent } from "react";

/** Черновик вложения в поле ввода */
export type MessageAttachmentDraft = {
	/** Локальный id */
	id: string;
	/** Исходный файл */
	file: File;
	/** Object URL для превью (только картинки) */
	previewUrl: string | null;
};

/** Вложение при отправке */
export type MessageInputAttachment = {
	/** Data URL (base64) */
	dataUrl: string;
	/** Имя файла */
	name: string;
	/** MIME-тип */
	mime: string;
};

/** Полезная нагрузка отправки */
export type MessageInputSubmitPayload = {
	/** Текст сообщения */
	text: string;
	/** Вложения */
	attachments: MessageInputAttachment[];
};

export type MessageInputProps = {
	/** Значение поля */
	value?: string;
	/** Значение по умолчанию */
	defaultValue?: string;
	/** Изменение текста */
	onChange?: (value: string) => void;
	/** Отправка текста и вложений */
	onSubmit?: (payload: MessageInputSubmitPayload) => void;
	/** Плейсхолдер */
	placeholder?: string;
	/** Отключить поле */
	disabled?: boolean;
	/** Дополнительный класс */
	className?: string;
	/** Слот под кастомный file input */
	fileInput?: ReactNode;
};

export type MessageInputSubmitEvent = SubmitEvent<HTMLFormElement>;
