import type { StatusValue } from "./Status.types";

/** Тег корня по умолчанию */
export const STATUS_DEFAULT_TAG = "span" as const;

/** Статус по умолчанию */
export const STATUS_DEFAULT_VALUE = "in_progress" as const satisfies StatusValue;

/** Варианты статуса заявки */
export const STATUS_VALUES = [
	"in_progress",
	"dop",
	"checked",
	"close",
] as const satisfies readonly StatusValue[];

/** Подписи и иконки по статусу */
export const STATUS_META = {
	in_progress: {
		label: "В работе",
		icon: "status-progress",
	},
	dop: {
		label: "Дополните",
		icon: "status-progress",
	},
	checked: {
		label: "Проверено",
		icon: "status-executed",
	},
	close: {
		label: "Закрыто",
		icon: "status-closed",
	},
} as const satisfies Record<StatusValue, { label: string; icon: string }>;

/** Размер иконки в Status Pill (DESIGN.md: 14) */
export const STATUS_ICON_SIZE = "sm" as const;
