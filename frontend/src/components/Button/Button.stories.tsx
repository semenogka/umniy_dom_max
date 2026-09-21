import type { Meta, StoryObj } from "@storybook/react-vite";

import { Icon } from "../Icon";
import { BUTTON_VARIANTS } from "./Button.config";
import type { ButtonProps } from "./Button.types";
import { Button } from "./index";

const meta = {
	title: "components/Button",
	component: Button,
	tags: ["autodocs"],
	args: {
		children: "Кнопка",
		variant: "accent",
		disabled: false,
	},
	argTypes: {
		variant: {
			control: "select",
			options: [...BUTTON_VARIANTS],
		},
		tag: {
			control: "text",
		},
		children: {
			control: "text",
		},
		disabled: {
			control: "boolean",
		},
	},
	decorators: [
		(Story) => (
			<div style={{ maxWidth: 360, padding: 16 }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Inverse: Story = {
	args: {
		variant: "inverse",
		children: (
			<>
				<Icon name="message-plus" size="lg" />
				Новое обращение
			</>
		),
	},
};

export const Accent: Story = {
	args: {
		children: "Создать обращение",
		variant: "accent",
	},
};

export const Outline: Story = {
	args: {
		children: "Собрать акт",
		variant: "outline",
	},
};

export const Secondary: Story = {
	args: {
		children: "Да, всё работает",
		variant: "secondary",
	},
};

export const AsLink: Story = {
	args: {
		children: "Перейти",
		tag: "a",
		href: "#",
		variant: "accent",
	},
};

export const AsDiv: Story = {
	args: {
		children: "Как div",
		tag: "div",
		variant: "outline",
	},
};

export const Disabled: Story = {
	args: {
		children: "Отправить",
		variant: "accent",
		disabled: true,
	},
};

export const IconOnly: Story = {
	args: {
		variant: "icon",
		"aria-label": "Меню",
		children: <Icon name="sidebar" size="xl" />,
	},
	decorators: [
		(Story) => (
			<div style={{ padding: 16 }}>
				<Story />
			</div>
		),
	],
};

export const AllVariants: Story = {
	render: (args) => (
		<div style={{ display: "grid", gap: 12, justifyItems: "start" }}>
			{BUTTON_VARIANTS.map((variant) => (
				<Button
					key={variant}
					{...(args as ButtonProps)}
					variant={variant}
					aria-label={variant === "icon" ? "Меню" : undefined}
				>
					{variant === "inverse" ? (
						<>
							<Icon name="message-plus" size="lg" />
							{variant}
						</>
					) : variant === "icon" ? (
						<Icon name="sidebar" size="xl" />
					) : (
						variant
					)}
				</Button>
			))}
		</div>
	),
};
