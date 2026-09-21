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

interface MaxWebApp {
	initData: string;
	initDataUnsafe: Record<string, unknown>;
	platform: string;
	version: string;
}

interface Window {
	WebApp?: MaxWebApp;
}
