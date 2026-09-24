/** Заголовок листа */
export const NEW_APPEAL_TITLE = "Что случилось?";

/** Подсказка под адресом */
export const NEW_APPEAL_HINT = "Выберите тему — адресат определится автоматически.";

/** Адрес в шапке формы */
export const NEW_APPEAL_HOME_CONTEXT = "ул. Луговая, 18 · кв. 42";

/** Плейсхолдер описания */
export const NEW_APPEAL_DESCRIPTION_PLACEHOLDER = "Например: не работает лифт во втором подъезде…";

/** Подпись кнопки отправки */
export const NEW_APPEAL_SUBMIT_LABEL = "Создать обращение";

/** Ошибка: тема не выбрана */
export const NEW_APPEAL_ERROR_TOPIC = "Сначала выберите тему обращения";

/** Ошибка: нет описания */
export const NEW_APPEAL_ERROR_DESCRIPTION = "Опишите проблему";

/** Темы обращения */
export const NEW_APPEAL_TOPICS = [
	{ id: "water-heating", label: "Вода или отопление" },
	{ id: "entrance-lift", label: "Подъезд и лифт" },
	{ id: "electricity", label: "Электричество" },
	{ id: "other", label: "Другое" },
] as const;
