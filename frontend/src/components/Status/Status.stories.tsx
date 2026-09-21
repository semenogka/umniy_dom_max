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
		status: "in-progress",
		children: <StatusContent status="in-progress" />,
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
		status: "in-progress",
		children: <StatusContent status="in-progress" />,
	},
};

export const Executed: Story = {
	args: {
		status: "executed",
		children: <StatusContent status="executed" />,
	},
};

export const Closed: Story = {
	args: {
		status: "closed",
		children: <StatusContent status="closed" />,
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
