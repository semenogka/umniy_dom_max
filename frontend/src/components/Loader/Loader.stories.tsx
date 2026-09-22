import { configureStore } from "@reduxjs/toolkit";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Provider } from "react-redux";

import { hideLoader, showLoader, uiReducer } from "@/store/ui/ui.slice";

import { Loader } from "./index";

function createLoaderStore(isLoading: boolean) {
	return configureStore({
		reducer: { ui: uiReducer },
		preloadedState: { ui: { isLoading } },
	});
}

const meta = {
	title: "components/Loader",
	component: Loader,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
} satisfies Meta<typeof Loader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {
	decorators: [
		(Story) => {
			const storyStore = createLoaderStore(true);

			return (
				<Provider store={storyStore}>
					<div
						style={{
							position: "relative",
							minHeight: 320,
							background: "var(--bg)",
							overflow: "hidden",
						}}
					>
						<p style={{ padding: 24, margin: 0, color: "var(--fg)" }}>
							Контент страницы под оверлеем
						</p>
						<Story />
					</div>
				</Provider>
			);
		},
	],
};

export const Closed: Story = {
	decorators: [
		(Story) => {
			const storyStore = createLoaderStore(false);

			return (
				<Provider store={storyStore}>
					<div
						style={{
							position: "relative",
							minHeight: 320,
							background: "var(--bg)",
							overflow: "hidden",
						}}
					>
						<p style={{ padding: 24, margin: 0, color: "var(--fg)" }}>Loader скрыт</p>
						<Story />
					</div>
				</Provider>
			);
		},
	],
};

export const Toggle: Story = {
	decorators: [
		(Story) => {
			const storyStore = createLoaderStore(false);

			const handleClick = () => {
				storyStore.dispatch(showLoader());
				window.setTimeout(() => {
					storyStore.dispatch(hideLoader());
				}, 3000);
			};

			return (
				<Provider store={storyStore}>
					<div
						style={{
							position: "relative",
							minHeight: 320,
							background: "var(--bg)",
							overflow: "hidden",
						}}
					>
						<div style={{ padding: 24 }}>
							<button type="button" onClick={handleClick}>
								Загрузить
							</button>
						</div>
						<Story />
					</div>
				</Provider>
			);
		},
	],
};
