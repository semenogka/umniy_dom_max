import type { Meta, StoryObj } from "@storybook/react-vite";

import { Header } from "./index";

const meta = {
	title: "components/Header",
	component: Header,
	tags: ["autodocs"],
	args: {
		type: "appeal",
		title: "Протечка",
		subtitle: "В работе",
		status: "in-progress",
		badgeCount: 1,
	},
	decorators: [
		(Story) => (
			<div style={{ maxWidth: 402, background: "var(--surface)" }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Header>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Appeal: Story = {};

export const Conversation: Story = {
	args: {
		type: "conversation",
		title: "Чат жителей дома",
		subtitle: "128 участников",
		badgeCount: 0,
	},
};

export const Executed: Story = {
	args: {
		title: "Горячая вода",
		subtitle: "Исполнено",
		status: "executed",
	},
};
