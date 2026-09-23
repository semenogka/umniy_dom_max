import { MESSAGE_KIND_CLASS } from "./Message.config";
import type { MessageKind } from "./Message.types";

/**
 * Собирает className Message из CSS-модуля
 * @param styles - классы из Message.module.scss
 * @param kind - вид сообщения
 * @param tail - хвостик у нижнего угла
 * @param className - дополнительный класс
 */
export function getMessageClassName(
	styles: Record<string, string>,
	kind: MessageKind,
	tail = true,
	className?: string,
): string {
	return [styles.root, styles[MESSAGE_KIND_CLASS[kind]], tail && styles.tail, className]
		.filter(Boolean)
		.join(" ");
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
