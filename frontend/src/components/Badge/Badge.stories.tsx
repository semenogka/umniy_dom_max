import type { Meta, StoryObj } from "@storybook/react-vite";

import { Icon } from "../Icon";
import { Badge } from "./index";

const meta = {
	title: "components/Badge",
	component: Badge,
	tags: ["autodocs"],
	args: {
		children: "1",
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
					alignItems: "center",
					gap: 16,
					background: "var(--surface)",
				}}
			>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DoubleDigit: Story = {
	args: {
		children: "12",
	},
};

export const Large: Story = {
	args: {
		children: "99+",
	},
};

export const OnButton: Story = {
	render: () => (
		<button
			type="button"
			style={{
				position: "relative",
				width: 44,
				height: 44,
				border: 0,
				borderRadius: 14,
				background: "transparent",
				color: "var(--fg)",
				cursor: "pointer",
			}}
			aria-label="Уведомления, одно новое"
		>
			<Icon name="bell" size="xl" />
			<Badge
				style={{
					position: "absolute",
					top: 5,
					right: 4,
				}}
			>
				1
			</Badge>
		</button>
	),
};

export const Gallery: Story = {
	render: () => (
		<>
			{["1", "2", "9", "12", "99+"].map((count) => (
				<Badge key={count}>{count}</Badge>
			))}
		</>
	),
};
