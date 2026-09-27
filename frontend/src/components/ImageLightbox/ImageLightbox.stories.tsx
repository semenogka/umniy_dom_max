import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { Button } from "../Button";
import { ImageLightbox } from "./index";

const DEMO_IMAGE =
	"https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80";

const meta = {
	title: "components/ImageLightbox",
	component: ImageLightbox,
	tags: ["autodocs"],
	parameters: {
		layout: "fullscreen",
	},
	args: {
		src: DEMO_IMAGE,
		open: false,
	},
} satisfies Meta<typeof ImageLightbox>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: (args) => {
		const [open, setOpen] = useState(false);

		return (
			<div style={{ padding: 24, minHeight: 320, background: "var(--bg)" }}>
				<button
					type="button"
					onClick={() => setOpen(true)}
					style={{
						display: "block",
						padding: 0,
						border: "1px solid var(--border)",
						borderRadius: "var(--radius-md)",
						overflow: "hidden",
						cursor: "pointer",
						background: "none",
					}}
				>
					<img
						src={args.src ?? DEMO_IMAGE}
						alt="Превью"
						style={{ display: "block", width: 180, height: 120, objectFit: "cover" }}
					/>
				</button>

				<p style={{ margin: "12px 0 0", color: "var(--muted)", fontSize: 14 }}>
					Клик по превью открывает лайтбокс
				</p>

				<ImageLightbox src={args.src} open={open} onClose={() => setOpen(false)} />
			</div>
		);
	},
};

export const Open: Story = {
	args: {
		open: true,
	},
	render: (args) => {
		const [open, setOpen] = useState(Boolean(args.open));

		return (
			<div style={{ padding: 24, minHeight: 320, background: "var(--bg)" }}>
				<Button variant="accent" type="button" onClick={() => setOpen(true)}>
					Открыть фото
				</Button>

				<ImageLightbox src={args.src} open={open} onClose={() => setOpen(false)} />
			</div>
		);
	},
};
