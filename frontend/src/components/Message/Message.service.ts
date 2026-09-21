import type { MessageKind } from "./Message.types";

/** Имя CSS-класса вида в модуле */
const KIND_CLASS: Record<MessageKind, string> = {
	out: "out",
	bot: "bot",
	operator: "operator",
	"bot-question": "botQuestion",
};

/**
 * Собирает className Message из CSS-модуля
 * @param styles - классы из Message.module.scss
 * @param kind - вид сообщения
 * @param className - дополнительный класс
 */
export function getMessageClassName(
	styles: Record<string, string>,
	kind: MessageKind,
	className?: string,
): string {
	return [styles.root, styles[KIND_CLASS[kind]], className].filter(Boolean).join(" ");
}

/**
 * Подпись для иконки доставки
 * @param delivery - статус доставки
 */
export function getDeliveryLabel(delivery: "sent" | "delivered" | "read"): string {
	if (delivery === "read") return "Прочитано";
	if (delivery === "delivered") return "Доставлено";
	return "Отправлено";
}
