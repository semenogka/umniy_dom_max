import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const config: StorybookConfig = {
	stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
	addons: [
		"@chromatic-com/storybook",
		"@storybook/addon-vitest",
		"@storybook/addon-a11y",
		"@storybook/addon-docs",
		"@storybook/addon-mcp",
	],
	framework: "@storybook/react-vite",
	async viteFinal(config) {
		const { mergeConfig } = await import("vite");
		return mergeConfig(config, {
			resolve: {
				alias: {
					"@": path.resolve(rootDir, "../src"),
				},
			},
			css: {
				modules: {
					localsConvention: "camelCaseOnly",
				},
			},
		});
	},
};

export default config;
