import type { ReactNode, SubmitEvent } from "react";

export type MessageInputProps = {
	/** Значение поля */
	value?: string;
	/** Значение по умолчанию */
	defaultValue?: string;
	/** Изменение текста */
	onChange?: (value: string) => void;
	/** Отправка */
	onSubmit?: (value: string) => void;
	/** Прикрепить файл */
	onAttach?: () => void;
	/** Плейсхолдер */
	placeholder?: string;
	/** Отключить поле */
	disabled?: boolean;
	/** Дополнительный класс */
	className?: string;
	/** Скрытый input для файлов */
	fileInput?: ReactNode;
};

export type MessageInputSubmitEvent = SubmitEvent<HTMLFormElement>;
