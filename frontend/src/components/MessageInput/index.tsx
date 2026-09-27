import {
	type ChangeEvent,
	type KeyboardEvent,
	type SubmitEvent,
	useEffect,
	useRef,
	useState,
} from "react";

import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { TextField } from "@/components/TextField";

import {
	MESSAGE_INPUT_ACCEPT,
	MESSAGE_INPUT_MAX_ATTACHMENTS,
	MESSAGE_INPUT_MAX_HEIGHT,
	MESSAGE_INPUT_PLACEHOLDER,
} from "./MessageInput.config";
import styles from "./MessageInput.module.scss";
import {
	createAttachmentDrafts,
	getAttachmentExtLabel,
	getAttachmentShortName,
	getMessageInputClassName,
	isImageFile,
	readFileAsDataUrl,
	revokeAttachmentDraft,
	revokeAttachmentDrafts,
} from "./MessageInput.service";
import type { MessageAttachmentDraft, MessageInputProps } from "./MessageInput.types";

/** Поле ввода сообщения в чате */
export function MessageInput(props: MessageInputProps) {
	const {
		value,
		defaultValue = "",
		onChange,
		onSubmit,
		placeholder = MESSAGE_INPUT_PLACEHOLDER,
		disabled = false,
		className,
		fileInput,
	} = props;

	const [innerValue, setInnerValue] = useState(defaultValue);
	const [attachments, setAttachments] = useState<MessageAttachmentDraft[]>([]);
	const [sending, setSending] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const attachmentsRef = useRef(attachments);

	useEffect(() => {
		attachmentsRef.current = attachments;
	}, [attachments]);

	const isControlled = value !== undefined;
	const text = isControlled ? value : innerValue;
	const canSend = (Boolean(text.trim()) || attachments.length > 0) && !disabled && !sending;

	useEffect(() => {
		return () => {
			revokeAttachmentDrafts(attachmentsRef.current);
		};
	}, []);

	/**
	 * Изменение текста
	 * @param next - новое значение
	 * @returns {void}
	 */
	const handleChange = (next: string): void => {
		if (!isControlled) setInnerValue(next);
		onChange?.(next);
	};

	/**
	 * Открыть выбор файлов
	 * @returns {void}
	 */
	const handleAttachClick = (): void => {
		if (disabled || sending) return;
		fileInputRef.current?.click();
	};

	/**
	 * Выбор файлов
	 * @param event - change file input
	 * @returns {void}
	 */
	const handleFilesChange = (event: ChangeEvent<HTMLInputElement>): void => {
		const files = event.target.files;
		if (!files?.length) return;

		const drafts = createAttachmentDrafts(files, attachments.length, MESSAGE_INPUT_MAX_ATTACHMENTS);
		if (drafts.length) setAttachments((prev) => [...prev, ...drafts]);

		event.target.value = "";
	};

	/**
	 * Удалить вложение
	 * @param id - id черновика
	 * @returns {void}
	 */
	const handleRemoveAttachment = (id: string): void => {
		setAttachments((prev) => {
			const next = prev.filter((item) => item.id !== id);
			const removed = prev.find((item) => item.id === id);
			if (removed) revokeAttachmentDraft(removed);
			return next;
		});
	};

	/**
	 * Отправка формы
	 * @param event - submit
	 * @returns {void}
	 */
	const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!canSend) return;

		const trimmed = text.trim();
		const drafts = attachments;

		setSending(true);

		Promise.all(
			drafts.map(async (draft) => ({
				dataUrl: await readFileAsDataUrl(draft.file),
				name: draft.file.name,
				mime: draft.file.type || "application/octet-stream",
			})),
		)
			.then((payloadAttachments) => {
				onSubmit?.({ text: trimmed, attachments: payloadAttachments });

				if (!isControlled) setInnerValue("");
				revokeAttachmentDrafts(drafts);
				setAttachments([]);
			})
			.catch(() => undefined)
			.finally(() => {
				setSending(false);
			});
	};

	/**
	 * Enter без Shift — отправка
	 * @param event - keydown
	 * @returns {void}
	 */
	const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
		if (event.key !== "Enter" || event.shiftKey) return;

		event.preventDefault();
		const form = (event.currentTarget as HTMLTextAreaElement).form;
		form?.requestSubmit();
	};

	return (
		<form className={getMessageInputClassName(styles, className)} onSubmit={handleSubmit}>
			{attachments.length > 0 && (
				<div className={styles.attachments} aria-label="Вложения">
					{attachments.map((draft) => {
						const isImage = isImageFile(draft.file) && draft.previewUrl;

						return (
							<div key={draft.id} className={isImage ? styles.thumb : styles.fileCard}>
								{isImage ? (
									<img
										className={styles.thumbImage}
										src={draft.previewUrl ?? undefined}
										alt={draft.file.name}
									/>
								) : (
									<>
										<span className={styles.fileExt}>
											{getAttachmentExtLabel(draft.file.type, draft.file.name)}
										</span>
										<span className={styles.fileName} title={draft.file.name}>
											{getAttachmentShortName(draft.file.name)}
										</span>
									</>
								)}

								<button
									type="button"
									className={styles.thumbRemove}
									aria-label={`Удалить ${draft.file.name}`}
									disabled={disabled || sending}
									onClick={() => handleRemoveAttachment(draft.id)}
								>
									<Icon name="close" size={12} />
								</button>
							</div>
						);
					})}
				</div>
			)}

			<div className={styles.composer}>
				<Button
					variant="icon"
					type="button"
					aria-label="Прикрепить файл"
					disabled={disabled || sending || attachments.length >= MESSAGE_INPUT_MAX_ATTACHMENTS}
					onClick={handleAttachClick}
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
					disabled={disabled || sending}
					className={styles.field}
					onChange={(event) => handleChange(event.target.value)}
					onKeyDown={handleKeyDown}
				/>

				<Button variant="send" type="submit" aria-label="Отправить" disabled={!canSend}>
					<Icon name="send" size="lg" />
				</Button>
			</div>

			<input
				ref={fileInputRef}
				className={styles.fileInput}
				type="file"
				accept={MESSAGE_INPUT_ACCEPT}
				multiple
				tabIndex={-1}
				aria-hidden
				disabled={disabled || sending}
				onChange={handleFilesChange}
			/>

			{fileInput}
		</form>
	);
}

MessageInput.displayName = "MessageInput";
