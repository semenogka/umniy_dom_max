import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { MessageInput } from "./index";

const meta = {
	title: "components/MessageInput",
	component: MessageInput,
	tags: ["autodocs"],
	decorators: [
		(Story) => (
			<div style={{ maxWidth: 402, background: "var(--bg-subtle)" }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof MessageInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Controlled: Story = {
	render: () => {
		const [value, setValue] = useState("");

		return (
			<MessageInput
				value={value}
				onChange={setValue}
				onSubmit={(text) => {
					console.log(text);
					setValue("");
				}}
			/>
		);
	},
};
