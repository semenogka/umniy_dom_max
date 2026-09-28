import {
	MESSAGE_INPUT_IMAGE_MAX_SIDE,
	MESSAGE_INPUT_IMAGE_QUALITY,
	MESSAGE_INPUT_MAX_FILE_BYTES,
	MESSAGE_INPUT_PHOTO_TYPES,
} from "./MessageInput.config";
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
 * Картинка → HTMLImageElement (fallback, если нет createImageBitmap)
 * @param file - файл
 */
function loadImageElement(file: File): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const img = new Image();

		img.onload = () => {
			URL.revokeObjectURL(url);
			resolve(img);
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error("Не удалось открыть картинку"));
		};
		img.src = url;
	});
}

/**
 * Фото ли это (по MIME, а если браузер его не знает — по расширению, как у HEIC)
 * @param file - файл
 */
export function isPhotoFile(file: File): boolean {
	if (file.type) return MESSAGE_INPUT_PHOTO_TYPES.includes(file.type);
	return /\.(heic|heif)$/i.test(file.name);
}

/**
 * Сжимает фото: длинная сторона до MESSAGE_INPUT_IMAGE_MAX_SIDE, JPEG.
 * Если не вышло или стало больше — возвращает исходный файл.
 * @param file - файл
 */
export async function compressImageFile(file: File): Promise<File> {
	try {
		const source: ImageBitmap | HTMLImageElement =
			typeof createImageBitmap === "function"
				? await createImageBitmap(file, { imageOrientation: "from-image" })
				: await loadImageElement(file);

		const scale = Math.min(1, MESSAGE_INPUT_IMAGE_MAX_SIDE / Math.max(source.width, source.height));
		const width = Math.max(1, Math.round(source.width * scale));
		const height = Math.max(1, Math.round(source.height * scale));

		const canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;

		const ctx = canvas.getContext("2d");
		if (!ctx) return file;

		// JPEG без прозрачности — подкладываем белый фон
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, width, height);
		ctx.drawImage(source, 0, 0, width, height);
		if ("close" in source) source.close();

		const blob = await new Promise<Blob | null>((resolve) =>
			canvas.toBlob(resolve, "image/jpeg", MESSAGE_INPUT_IMAGE_QUALITY),
		);
		if (!blob || blob.size >= file.size) return file;

		const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
		return new File([blob], `${baseName}.jpg`, { type: "image/jpeg", lastModified: file.lastModified });
	} catch {
		return file;
	}
}

/**
 * Отсеивает не-фото, сжимает фото и отсеивает те, что больше лимита
 * @param files - выбранные файлы
 * @returns сжатые фото и отклонённые файлы
 */
export async function prepareAttachmentFiles(
	files: File[],
): Promise<{ accepted: File[]; notPhoto: string[]; tooBig: string[] }> {
	const photos = files.filter(isPhotoFile);
	const notPhoto = files.filter((file) => !isPhotoFile(file)).map((file) => file.name);

	const compressed = await Promise.all(photos.map(compressImageFile));
	const accepted: File[] = [];
	const tooBig: string[] = [];

	compressed.forEach((file, index) => {
		if (file.size > MESSAGE_INPUT_MAX_FILE_BYTES) tooBig.push(photos[index].name);
		else accepted.push(file);
	});

	return { accepted, notPhoto, tooBig };
}

/**
 * Текст ошибки для отклонённых файлов
 * @param notPhoto - не фото
 * @param tooBig - фото больше лимита
 */
export function getRejectedFilesMessage(notPhoto: string[], tooBig: string[]): string | null {
	const limitMb = Math.round(MESSAGE_INPUT_MAX_FILE_BYTES / 1024 / 1024);
	const parts: string[] = [];

	if (notPhoto.length) parts.push("Можно прикреплять только фото");
	if (tooBig.length === 1) parts.push(`Фото «${getAttachmentShortName(tooBig[0])}» больше ${limitMb} МБ`);
	else if (tooBig.length) parts.push(`Не прикреплены фото больше ${limitMb} МБ: ${tooBig.length}`);

	return parts.length ? parts.join(". ") : null;
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
