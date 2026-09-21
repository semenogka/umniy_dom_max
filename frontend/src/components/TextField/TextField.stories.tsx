import type { Meta, StoryObj } from "@storybook/react-vite";
import { TextField } from "./index";
import { TEXT_FIELD_SIZES } from "./TextField.config";

const meta = {
	title: "components/TextField",
	component: TextField,
	tags: ["autodocs"],
	args: {
		size: "single",
		placeholder: "Сообщение",
		disabled: false,
	},
	argTypes: {
		size: {
			control: "select",
			options: [...TEXT_FIELD_SIZES],
		},
		tag: {
			control: "select",
			options: ["input", "textarea"],
		},
		disabled: {
			control: "boolean",
		},
		placeholder: {
			control: "text",
		},
	},
	decorators: [
		(Story) => (
			<div style={{ padding: 24, maxWidth: 360, background: "var(--surface)" }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Single: Story = {
	args: {
		size: "single",
		placeholder: "Сообщение",
		"aria-label": "Сообщение",
	},
};

export const Multi: Story = {
	args: {
		size: "multi",
		placeholder: "Например: не работает лифт во втором подъезде…",
		"aria-label": "Описание проблемы",
	},
};

export const Disabled: Story = {
	args: {
		size: "multi",
		disabled: true,
		placeholder: "Сначала выберите тему",
		"aria-label": "Описание проблемы",
	},
};

export const WithValue: Story = {
	args: {
		size: "single",
		defaultValue: "В подъезде течёт труба",
		"aria-label": "Сообщение",
	},
};

export const Gallery: Story = {
	render: (args) => (
		<div style={{ display: "grid", gap: 16 }}>
			{TEXT_FIELD_SIZES.map((size) => (
				<TextField
					key={size}
					{...args}
					size={size}
					placeholder={size === "single" ? "Сообщение" : "Описание…"}
					aria-label={size}
				/>
			))}
		</div>
	),
};
