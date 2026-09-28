/** Плейсхолдер поля */
export const MESSAGE_INPUT_PLACEHOLDER = "Сообщение";

/** Максимальная высота textarea, px */
export const MESSAGE_INPUT_MAX_HEIGHT = 104;

/** Допустимые типы файлов */
export const MESSAGE_INPUT_ACCEPT = [
	"image/*",
	".pdf",
	".doc",
	".docx",
	".xls",
	".xlsx",
	".ppt",
	".pptx",
	".txt",
	".rtf",
	".csv",
	".zip",
	".rar",
	".7z",
	"audio/*",
].join(",");

/** Максимум вложений за раз */
export const MESSAGE_INPUT_MAX_ATTACHMENTS = 10;

/** Максимальный размер файла после сжатия, байт (как на бэкенде и в nginx) */
export const MESSAGE_INPUT_MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Картинки, которые пережимаем в JPEG перед отправкой (gif/svg не трогаем) */
export const MESSAGE_INPUT_COMPRESSIBLE_IMAGES = [
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/bmp",
	"image/heic",
	"image/heif",
];

/** Длинная сторона картинки после сжатия, px */
export const MESSAGE_INPUT_IMAGE_MAX_SIDE = 1600;

/** Качество JPEG после сжатия (0–1) */
export const MESSAGE_INPUT_IMAGE_QUALITY = 0.6;
