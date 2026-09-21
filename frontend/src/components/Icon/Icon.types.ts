import type { CSSProperties, HTMLAttributes } from "react";

import type { ICON_SIZES } from "./Icon.config";

/** Имя иконки */
export type IconName = string;

/** Токен размера иконки */
export type IconSizeToken = keyof typeof ICON_SIZES;

/** Стили иконки */
export type IconStyle = CSSProperties & {
	/** Маска иконки */
	"--icon-mask"?: string;
};

export type IconProps = {
	/** Имя иконки */
	name: IconName;
	/** Размер в px или токен: sm=14, md=18, lg=20, xl=22, 2xl=24 */
	size?: number | IconSizeToken;
	/** Заголовок иконки */
	title?: string;
	/** Класс иконки */
	className?: string;
	/** Стили иконки */
	style?: IconStyle;
} & Omit<HTMLAttributes<HTMLSpanElement>, "children" | "color" | "style">;
