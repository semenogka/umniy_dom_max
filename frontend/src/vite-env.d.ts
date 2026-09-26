/// <reference types="vite/client" />

declare module "*.scss" {
	const content: string;
	export default content;
}

declare module "*.module.scss" {
	const classes: { readonly [key: string]: string };
	export default classes;
}

declare module "*.css" {
	const content: string;
	export default content;
}

/** Пользователь MAX из initDataUnsafe */
interface MaxWebAppUser {
	/** Идентификатор пользователя */
	id: number;
	/** Имя */
	first_name: string;
	/** Фамилия */
	last_name: string;
	/** Никнейм */
	username: string;
	/** Язык интерфейса MAX */
	language_code: string;
	/** URL фото профиля */
	photo_url: string;
}

/** Чат, в котором открыто мини-приложение */
interface MaxWebAppChat {
	/** Идентификатор чата */
	id: number;
	/** Тип чата */
	type: "DIALOG" | "CHAT" | "CHANNEL";
}

/** Данные инициализации MAX Bridge */
interface MaxWebAppInitData {
	/** Уникальный идентификатор сессии */
	query_id?: string;
	/** IP-адрес пользователя */
	ip?: string;
	/** Время выдачи данных */
	auth_date?: number;
	/** Хеш параметров для валидации */
	hash?: string;
	/** Пользователь, открывший мини-приложение */
	user?: MaxWebAppUser;
	/** Чат, в котором открыто мини-приложение */
	chat?: MaxWebAppChat;
	/** Значение startapp из deep link */
	start_param?: string;
}

/** Глобальный объект MAX Bridge (`window.WebApp`) */
interface MaxWebApp {
	/** Стартовые параметры в URL-кодировке */
	initData: string;
	/** Те же данные в виде объекта */
	initDataUnsafe: Partial<MaxWebAppInitData>;
	/** Платформа клиента */
	platform: string;
	/** Версия приложения MAX */
	version: string;
}

interface Window {
	/** MAX Bridge API */
	WebApp?: MaxWebApp;
}
