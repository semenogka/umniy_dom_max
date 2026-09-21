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

/** Доставка по умолчанию (только для out) */
export const MESSAGE_DEFAULT_DELIVERY = "delivered" as const satisfies MessageDelivery;
