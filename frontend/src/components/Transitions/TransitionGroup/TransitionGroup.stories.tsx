import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button } from "@/components/Button";

import { CSSTransition } from "../CSSTransition";
import { TransitionGroup } from "./index";

const meta = {
	title: "components/Transitions/TransitionGroup",
	component: TransitionGroup,
	tags: ["autodocs"],
} satisfies Meta<typeof TransitionGroup>;

export default meta;

type Story = StoryObj<typeof TransitionGroup>;

export const Default: Story = {
	render: () => {
		const [visible, setVisible] = useState(true);

		return (
			<div style={{ display: "grid", gap: 12 }}>
				<Button variant="secondary" onClick={() => setVisible((v) => !v)}>
					{visible ? "Скрыть" : "Показать"}
				</Button>
				<TransitionGroup>
					{visible && (
						<CSSTransition key="item" animatedStyles={["opacity", "height"]} duration={500}>
							<div style={{ padding: 16, background: "var(--surface)" }}>Контент</div>
						</CSSTransition>
					)}
				</TransitionGroup>
			</div>
		);
	},
};
