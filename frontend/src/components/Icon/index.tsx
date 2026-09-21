import { ICON_SIZES, ICONS } from "./Icon.config";
import styles from "./Icon.module.scss";
import { getIconUrl, resolveIconSize } from "./Icon.service";
import type { IconProps } from "./Icon.types";

/** Компонент иконки */
export function Icon(props: IconProps) {
	const { name, size, title, className, style, ...rest } = props;

	const url = getIconUrl(ICONS, name);

	if (!url) {
		if (import.meta.env.DEV) {
			console.warn(`[Icon] нет файла src/assets/icons/${name}.svg`);
		}

		return null;
	}

	/** Рассчитываем размер иконки в пикселях */
	const pixelSize = resolveIconSize(size, ICON_SIZES);

	/** Проверяем, является ли иконка широкой */
	const isWide = name === "delivery-read";

	/** Собираем классы иконки */
	const classNames = [styles.root, isWide ? styles.wide : null, className]
		.filter(Boolean)
		.join(" ");

	/** Собираем пропсы для доступности */
	const a11yProps = title
		? { role: "img" as const, "aria-label": title }
		: { "aria-hidden": true as const };

	return (
		<span
			className={classNames}
			style={{
				"--icon-mask": `url("${url}")`,
				width: pixelSize,
				height: isWide ? undefined : pixelSize,
				...style,
			}}
			{...a11yProps}
			{...rest}
		/>
	);
}

Icon.displayName = "Icon";
