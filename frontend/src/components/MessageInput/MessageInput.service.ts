import type { MessageAttachmentDraft } from "./MessageInput.types";

/**
 * Собирает className MessageInput
 * @param styles - классы из модуля
 * @param className - дополнительный класс
 */
export function getMessageInputClassName(
	styles: Record<string, string>,
	className?: string,
): string {
	return [styles.root, className].filter(Boolean).join(" ");
}

/**
 * Картинка ли это
 * @param file - файл или mime/url
 */
export function isImageFile(file: Pick<File, "type"> | string): boolean {
	if (typeof file === "string") {
		if (file.startsWith("data:image/")) return true;
		return /\.(jpe?g|png|gif|webp|bmp|svg|heic|heif)(\?|#|$)/i.test(file);
	}

	return file.type.startsWith("image/");
}

/**
 * Короткое имя файла для превью
 * @param name - полное имя
 */
export function getAttachmentShortName(name: string): string {
	if (name.length <= 18) return name;

	const extIndex = name.lastIndexOf(".");
	if (extIndex <= 0) return `${name.slice(0, 15)}…`;

	const ext = name.slice(extIndex);
	const base = name.slice(0, extIndex);
	const keep = Math.max(6, 15 - ext.length);

	return `${base.slice(0, keep)}…${ext}`;
}

/**
 * Расширение / подпись из MIME или имени
 * @param mime - mime
 * @param name - имя файла
 */
export function getAttachmentExtLabel(mime: string, name: string): string {
	const fromName = name.includes(".") ? name.split(".").pop() : "";
	if (fromName) return fromName.toUpperCase();

	const fromMime = mime.split("/")[1];
	return (fromMime || "FILE").toUpperCase();
}

/**
 * Файл → data URL (base64)
 * @param file - файл
 */
export function readFileAsDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = () => {
			if (typeof reader.result === "string") {
				resolve(reader.result);
				return;
			}

			reject(new Error("Не удалось прочитать файл"));
		};

		reader.onerror = () => reject(reader.error ?? new Error("Не удалось прочитать файл"));
		reader.readAsDataURL(file);
	});
}

/**
 * Создаёт черновики вложений из FileList
 * @param files - выбранные файлы
 * @param existingCount - сколько уже прикреплено
 * @param maxCount - лимит
 */
export function createAttachmentDrafts(
	files: FileList | File[],
	existingCount: number,
	maxCount: number,
): MessageAttachmentDraft[] {
	const remaining = Math.max(0, maxCount - existingCount);
	const list = Array.from(files).slice(0, remaining);

	return list.map((file) => ({
		id: crypto.randomUUID(),
		file,
		previewUrl: isImageFile(file) ? URL.createObjectURL(file) : null,
	}));
}

/**
 * Освобождает object URL черновика
 * @param draft - черновик вложения
 * @returns {void}
 */
export function revokeAttachmentDraft(draft: MessageAttachmentDraft): void {
	if (draft.previewUrl) URL.revokeObjectURL(draft.previewUrl);
}

/**
 * Освобождает object URL всех черновиков
 * @param drafts - черновики
 * @returns {void}
 */
export function revokeAttachmentDrafts(drafts: MessageAttachmentDraft[]): void {
	for (const draft of drafts) revokeAttachmentDraft(draft);
}
