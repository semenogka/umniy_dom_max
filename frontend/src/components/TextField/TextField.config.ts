import type { TextFieldSize } from "./TextField.types";

/** Размер по умолчанию */
export const TEXT_FIELD_DEFAULT_SIZE = "single" as const satisfies TextFieldSize;

/** Размеры поля */
export const TEXT_FIELD_SIZES = ["single", "multi"] as const satisfies readonly TextFieldSize[];

/** Максимальная высота autoGrow по умолчанию, px */
export const TEXT_FIELD_AUTO_GROW_MAX_HEIGHT = 104;
