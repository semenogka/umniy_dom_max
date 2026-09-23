import type { MessageDelivery, MessageKind } from "./Message.types";

/** Тег корня по умолчанию */
export const MESSAGE_DEFAULT_TAG = "article" as const;

/** Вид сообщения по умолчанию */
export const MESSAGE_DEFAULT_KIND = "bot" as const satisfies MessageKind;

/** Виды сообщения */
export const MESSAGE_KINDS = [
	"out",
	"bot",
	"operator",
	"bot-question",
] as const satisfies readonly MessageKind[];

/** Доставка по умолчанию */
export const MESSAGE_DEFAULT_DELIVERY = "delivered" as const satisfies MessageDelivery;

/** Хвостик у угла по умолчанию */
export const MESSAGE_DEFAULT_TAIL = true;

/** Имя CSS-класса вида в модуле */
export const MESSAGE_KIND_CLASS: Record<MessageKind, string> = {
	out: "out",
	bot: "bot",
	operator: "operator",
	"bot-question": "botQuestion",
};
