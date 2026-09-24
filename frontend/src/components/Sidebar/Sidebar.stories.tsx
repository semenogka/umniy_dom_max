import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button } from "../Button";
import { SIDEBAR_DIRECTIONS } from "./Sidebar.config";
import { Sidebar } from "./index";

const meta = {
	title: "components/Sidebar",
	component: Sidebar,
	tags: ["autodocs"],
	argTypes: {
		direction: {
			control: "radio",
			options: SIDEBAR_DIRECTIONS,
		},
		open: {
			control: "boolean",
		},
	},
} satisfies Meta<typeof Sidebar>;

export default meta;

type Story = StoryObj<typeof meta>;

function SidebarDemo(props: { direction: "left" | "right" | "bottom"; label: string }) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button variant="accent" type="button" onClick={() => setOpen(true)}>
				{props.label}
			</Button>

			<Sidebar direction={props.direction} open={open} onClose={() => setOpen(false)}>
				<div style={{ padding: "18px 18px 8px" }}>
					<strong style={{ display: "block", fontSize: 18, marginBottom: 8 }}>{props.label}</strong>
					<p style={{ margin: 0, color: "var(--muted)", fontSize: 14, lineHeight: 1.45 }}>
						Контент передаётся через children.
					</p>
				</div>
			</Sidebar>
		</>
	);
}

export const Left: Story = {
	render: () => <SidebarDemo direction="left" label="Слева" />,
};

export const Right: Story = {
	render: () => <SidebarDemo direction="right" label="Справа" />,
};

export const Bottom: Story = {
	render: () => <SidebarDemo direction="bottom" label="Снизу" />,
};

export const Gallery: Story = {
	render: () => (
		<div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
			<SidebarDemo direction="left" label="Слева" />
			<SidebarDemo direction="right" label="Справа" />
			<SidebarDemo direction="bottom" label="Снизу" />
		</div>
	),
};
