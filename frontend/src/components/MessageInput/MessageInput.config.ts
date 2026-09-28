/** Плейсхолдер поля */
export const MESSAGE_INPUT_PLACEHOLDER = "Сообщение";

/** Максимальная высота textarea, px */
export const MESSAGE_INPUT_MAX_HEIGHT = 104;

/** Можно прикреплять только фото */
export const MESSAGE_INPUT_PHOTO_TYPES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/heic",
	"image/heif",
	"image/bmp",
	"image/tiff",
];

/** Допустимые типы файлов для file input */
export const MESSAGE_INPUT_ACCEPT = [...MESSAGE_INPUT_PHOTO_TYPES, ".heic", ".heif"].join(",");

/** Максимум вложений за раз */
export const MESSAGE_INPUT_MAX_ATTACHMENTS = 10;

/** Максимальный размер фото после сжатия, байт (как на бэкенде) */
export const MESSAGE_INPUT_MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Длинная сторона картинки после сжатия, px */
export const MESSAGE_INPUT_IMAGE_MAX_SIDE = 1200;

/** Качество JPEG после сжатия (0–1) */
export const MESSAGE_INPUT_IMAGE_QUALITY = 0.45;
