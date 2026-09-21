import { buildIconsMap, listIconNames } from "./Icon.service";

/** Подхватываем все SVG-иконки из assets */
const modules = import.meta.glob("../../assets/icons/*.svg", {
	eager: true,
	query: "?url",
	import: "default",
}) as Record<string, string>;

/** Карта имён иконок и их URL */
export const ICONS = buildIconsMap(modules);

/** Список имён иконок */
export const ICON_NAMES = listIconNames(ICONS);

/** Размеры в интерфейсе */
export const ICON_SIZES = {
	sm: 14,
	md: 18,
	lg: 20,
	xl: 22,
	"2xl": 24,
} as const;
