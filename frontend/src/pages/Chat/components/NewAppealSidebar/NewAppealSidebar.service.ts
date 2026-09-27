import {
	NEW_APPEAL_ERROR_DESCRIPTION,
	NEW_APPEAL_ERROR_TOPIC,
	NEW_APPEAL_TOPICS,
} from "./NewAppealSidebar.config";
import type { NewAppealFormValues, NewAppealTopicId } from "./NewAppealSidebar.types";

/**
 * Собирает className корня формы
 * @param styles - классы из модуля
 * @param className - дополнительный класс
 */
export function getNewAppealSidebarClassName(
	styles: Record<string, string>,
	className?: string,
): string {
	return [styles.root, className].filter(Boolean).join(" ");
}

/**
 * ClassName пункта темы
 * @param styles - классы из модуля
 * @param selected - тема выбрана
 */
export function getNewAppealTopicClassName(
	styles: Record<string, string>,
	selected: boolean,
): string {
	return [styles.topic, selected && styles.topicSelected].filter(Boolean).join(" ");
}

/**
 * Текст ошибки валидации формы
 * @param topicId - выбранная тема
 * @param description - описание
 */
export function getNewAppealValidationError(
	topicId: NewAppealTopicId | null,
	description: string,
): string | null {
	if (!topicId) return NEW_APPEAL_ERROR_TOPIC;

	if (!description.trim()) return NEW_APPEAL_ERROR_DESCRIPTION;

	return null;
}

/**
 * Можно ли отправить форму
 * @param topicId - выбранная тема
 * @param description - описание
 */
export function canSubmitNewAppeal(topicId: NewAppealTopicId | null, description: string): boolean {
	return Boolean(topicId) && Boolean(description.trim());
}

/**
 * Текст обращения для API (тема + описание)
 * @param values - данные формы
 */
export function buildAppealText(values: NewAppealFormValues): string {
	const topic = NEW_APPEAL_TOPICS.find((item) => item.id === values.topicId);
	const description = values.description.trim();

	if (!topic) return description;

	return `${topic.label}. ${description}`;
}
