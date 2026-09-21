import type { Meta, StoryObj } from "@storybook/react-vite";

import { ICON_NAMES, ICON_SIZES } from "./Icon.config";
import { Icon } from "./index";

const meta = {
	title: "components/Icon",
	component: Icon,
	tags: ["autodocs"],
	args: {
		name: "bell",
		size: "2xl",
	},
	argTypes: {
		name: {
			control: "select",
			options: [...ICON_NAMES],
		},
		size: {
			control: "select",
			options: [...Object.keys(ICON_SIZES), 24, 32, 48],
		},
		title: {
			control: "text",
		},
	},
	decorators: [
		(Story) => (
			<div style={{ color: "var(--fg)", display: "inline-flex", padding: 16 }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Icon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sizes: Story = {
	render: (args) => (
		<div style={{ display: "flex", alignItems: "center", gap: 16 }}>
			{(Object.keys(ICON_SIZES) as Array<keyof typeof ICON_SIZES>).map((size) => (
				<div key={size} style={{ display: "grid", gap: 8, justifyItems: "center" }}>
					<Icon {...args} size={size} />
					<span style={{ fontSize: 12, color: "var(--muted)" }}>
						{size} ({ICON_SIZES[size]})
					</span>
				</div>
			))}
		</div>
	),
};

export const AllIcons: Story = {
	render: (args) => (
		<div
			style={{
				display: "grid",
				gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
				gap: 16,
				width: 480,
			}}
		>
			{ICON_NAMES.map((name) => (
				<div
					key={name}
					style={{
						display: "grid",
						gap: 8,
						justifyItems: "center",
						padding: 12,
						borderRadius: "var(--radius-md)",
						background: "var(--surface)",
						border: "1px solid var(--border)",
					}}
				>
					<Icon {...args} name={name} />
					<span style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>{name}</span>
				</div>
			))}
		</div>
	),
};

export const Colors: Story = {
	render: (args) => (
		<div style={{ display: "flex", gap: 24, alignItems: "center" }}>
			<span style={{ color: "var(--fg)" }}>
				<Icon {...args} />
			</span>
			<span style={{ color: "var(--accent)" }}>
				<Icon {...args} />
			</span>
			<span style={{ color: "var(--danger)" }}>
				<Icon {...args} />
			</span>
			<span style={{ color: "var(--success)" }}>
				<Icon {...args} />
			</span>
		</div>
	),
};

export const OnInverse: Story = {
	globals: {
		backgrounds: { value: "inverse" },
	},
	decorators: [
		(Story) => (
			<div style={{ color: "var(--on-accent)", display: "inline-flex", padding: 16 }}>
				<Story />
			</div>
		),
	],
	args: {
		name: "send",
	},
};
