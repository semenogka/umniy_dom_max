import { type KeyboardEvent, type SubmitEvent, useState } from "react";

import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { TextField } from "@/components/TextField";

import { MESSAGE_INPUT_MAX_HEIGHT, MESSAGE_INPUT_PLACEHOLDER } from "./MessageInput.config";
import styles from "./MessageInput.module.scss";
import { getMessageInputClassName } from "./MessageInput.service";
import type { MessageInputProps } from "./MessageInput.types";

/** Поле ввода сообщения в чате */
export function MessageInput(props: MessageInputProps) {
	const {
		value,
		defaultValue = "",
		onChange,
		onSubmit,
		onAttach,
		placeholder = MESSAGE_INPUT_PLACEHOLDER,
		disabled = false,
		className,
		fileInput,
	} = props;

	const [innerValue, setInnerValue] = useState(defaultValue);
	const isControlled = value !== undefined;
	const text = isControlled ? value : innerValue;
	const canSend = Boolean(text.trim()) && !disabled;

	const handleChange = (next: string) => {
		if (!isControlled) setInnerValue(next);
		onChange?.(next);
	};

	const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!canSend) return;

		onSubmit?.(text.trim());

		if (!isControlled) setInnerValue("");
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		if (event.key !== "Enter" || event.shiftKey) return;

		event.preventDefault();
		const form = (event.currentTarget as HTMLTextAreaElement).form;
		form?.requestSubmit();
	};

	return (
		<form className={getMessageInputClassName(styles, className)} onSubmit={handleSubmit}>
			<Button
				variant="icon"
				type="button"
				aria-label="Прикрепить фото"
				disabled={disabled}
				onClick={onAttach}
			>
				<Icon name="attachment" size="xl" />
			</Button>

			<TextField
				size="single"
				tag="textarea"
				autoGrow
				autoGrowMaxHeight={MESSAGE_INPUT_MAX_HEIGHT}
				value={text}
				placeholder={placeholder}
				aria-label={placeholder}
				disabled={disabled}
				onChange={(event) => handleChange(event.target.value)}
				onKeyDown={handleKeyDown}
			/>

			<Button variant="send" type="submit" aria-label="Отправить" disabled={!canSend}>
				<Icon name="send" size="lg" />
			</Button>

			{fileInput}
		</form>
	);
}

MessageInput.displayName = "MessageInput";
