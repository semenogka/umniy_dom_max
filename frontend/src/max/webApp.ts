/**
 * Id пользователя MAX из `window.WebApp.initDataUnsafe.user.id`.
 */
export function getMaxUserId(): number | null {
	const user = window.WebApp?.initDataUnsafe?.user;

	if (user && typeof user.id === "number" && Number.isFinite(user.id)) {
		return user.id;
	}

	if (import.meta.env.DEV) return 1;

	// Локальный Docker вне MAX: демо-пользователь из сида
	const demoId = Number(import.meta.env.VITE_DEMO_USER_ID);
	if (demoId) return demoId;

	return null;
}

/**
 * Id чата MAX из `window.WebApp.initDataUnsafe.chat.id`
 */
export function getMaxChatId(): number | null {
	const chat = window.WebApp?.initDataUnsafe?.chat;

	if (chat && typeof chat.id === "number" && Number.isFinite(chat.id)) {
		return chat.id;
	}

	if (import.meta.env.DEV) return 1;

	const demoChatId = Number(import.meta.env.VITE_DEMO_CHAT_ID);
	if (demoChatId) return demoChatId;

	return null;
}

/**
 * Имя пользователя MAX
 *
 * @returns {string | null} Имя пользователя MAX
 */
export function getMaxUserName(): string | null {
	const user = window.WebApp?.initDataUnsafe?.user;

	if (user?.first_name) return user.first_name;

	return null;
}

/**
 * URL фото профиля MAX
 */
export function getMaxUserPhoto(): string | null {
	return window.WebApp?.initDataUnsafe?.user?.photo_url || null;
}
