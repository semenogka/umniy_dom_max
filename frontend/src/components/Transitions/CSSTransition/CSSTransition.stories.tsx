import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button } from "@/components/Button";

import { CSSTransition } from "./index";

const meta = {
	title: "components/Transitions/CSSTransition",
	component: CSSTransition,
	tags: ["autodocs"],
	args: {
		visible: true,
		duration: 300,
		animatedStyles: ["opacity"],
		children: <div style={{ padding: 16, background: "var(--surface)" }}>Контент</div>,
	},
} satisfies Meta<typeof CSSTransition>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Opacity: Story = {
	args: {
		animatedStyles: ["opacity"],
	},
};

export const FromBottom: Story = {
	args: {
		animatedStyles: ["opacity", "transform"],
		from: "bottom",
	},
};

export const FromLeft: Story = {
	args: {
		animatedStyles: ["opacity", "transform"],
		from: "left",
	},
};

export const Height: Story = {
	args: {
		animatedStyles: ["height"],
		children: (
			<div style={{ padding: 16, background: "var(--surface)" }}>
				<p>Строка 1</p>
				<p>Строка 2</p>
				<p>Строка 3</p>
			</div>
		),
	},
};

export const Toggle: Story = {
	render: (args) => {
		const [visible, setVisible] = useState(true);

		return (
			<div style={{ display: "grid", gap: 12 }}>
				<Button variant="secondary" onClick={() => setVisible((v) => !v)}>
					{visible ? "Скрыть" : "Показать"}
				</Button>
				<CSSTransition {...args} visible={visible} animatedStyles={["opacity"]} duration={300}>
					<div style={{ padding: 16, background: "var(--surface)" }}>Контент</div>
				</CSSTransition>
			</div>
		);
	},
};
