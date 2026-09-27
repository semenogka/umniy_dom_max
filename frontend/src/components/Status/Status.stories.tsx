import type { Meta, StoryObj } from "@storybook/react-vite";

import { Icon } from "../Icon";
import { Status } from "./index";
import { STATUS_ICON_SIZE, STATUS_META, STATUS_VALUES } from "./Status.config";
import type { StatusProps, StatusValue } from "./Status.types";

function StatusContent({ status }: { status: StatusValue }) {
	const meta = STATUS_META[status];

	return (
		<>
			<Icon name={meta.icon} size={STATUS_ICON_SIZE} />
			{meta.label}
		</>
	);
}

const meta = {
	title: "components/Status",
	component: Status,
	tags: ["autodocs"],
	args: {
		status: "in_progress",
		children: <StatusContent status="in_progress" />,
	},
	argTypes: {
		status: {
			control: "select",
			options: [...STATUS_VALUES],
		},
		tag: {
			control: "text",
		},
	},
	decorators: [
		(Story) => (
			<div style={{ padding: 24, display: "flex", gap: 12, background: "var(--surface)" }}>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Status>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InProgress: Story = {
	args: {
		status: "in_progress",
		children: <StatusContent status="in_progress" />,
	},
};

export const Dop: Story = {
	args: {
		status: "dop",
		children: <StatusContent status="dop" />,
	},
};

export const Checked: Story = {
	args: {
		status: "checked",
		children: <StatusContent status="checked" />,
	},
};

export const Close: Story = {
	args: {
		status: "close",
		children: <StatusContent status="close" />,
	},
};

export const Gallery: Story = {
	render: (args) => (
		<>
			{STATUS_VALUES.map((status) => (
				<Status key={status} {...(args as StatusProps)} status={status}>
					<StatusContent status={status} />
				</Status>
			))}
		</>
	),
};
