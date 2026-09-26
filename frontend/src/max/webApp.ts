/**
 * Id пользователя MAX из `window.WebApp.initDataUnsafe.user.id`.
 */
export function getMaxUserId(): number | null {
	const user = window.WebApp?.initDataUnsafe?.user;

	if (user && typeof user.id === "number" && Number.isFinite(user.id)) {
		return user.id;
	}

	if (import.meta.env.DEV) return 1;

	return null;
}
