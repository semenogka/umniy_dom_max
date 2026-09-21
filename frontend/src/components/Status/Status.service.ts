import type { StatusValue } from "./Status.types";

/** Имя CSS-класса статуса в модуле */
const STATUS_CLASS: Record<StatusValue, string> = {
	"in-progress": "inProgress",
	executed: "executed",
	closed: "closed",
};

/**
 * Собирает className Status из CSS-модуля
 * @param styles - классы из Status.module.scss
 * @param status - статус заявки
 * @param className - дополнительный класс
 */
export function getStatusClassName(
	styles: Record<string, string>,
	status: StatusValue,
	className?: string,
): string {
	return [styles.root, styles[STATUS_CLASS[status]], className].filter(Boolean).join(" ");
}
