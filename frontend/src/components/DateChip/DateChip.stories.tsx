import type { Meta, StoryObj } from "@storybook/react-vite";

import { DateChip } from "./index";

const meta = {
	title: "components/DateChip",
	component: DateChip,
	tags: ["autodocs"],
	args: {
		children: "Сегодня",
	},
	argTypes: {
		tag: {
			control: "text",
		},
		children: {
			control: "text",
		},
	},
	decorators: [
		(Story) => (
			<div
				style={{
					padding: 24,
					display: "flex",
					justifyContent: "center",
					background: "var(--bg)",
				}}
			>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof DateChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Yesterday: Story = {
	args: {
		children: "Вчера",
	},
};

export const FullDate: Story = {
	args: {
		children: "12 сентября",
	},
};
