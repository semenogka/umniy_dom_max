import type { Preview } from "@storybook/react-vite";

import "../src/styles/vars.scss";

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		a11y: {
			test: "todo",
		},
		backgrounds: {
			options: {
				light: { name: "Светлый", value: "#ffffff" },
				app: { name: "App", value: "#f4f7fc" },
				inverse: { name: "Инверсия", value: "#192a3f" },
			},
		},
	},
	initialGlobals: {
		backgrounds: { value: "light" },
	},
};

export default preview;
