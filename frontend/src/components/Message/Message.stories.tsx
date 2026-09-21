import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "../Button";
import { Message } from "./index";
import { MESSAGE_KINDS } from "./Message.config";
import type { MessageProps } from "./Message.types";

const meta = {
	title: "components/Message",
	component: Message,
	tags: ["autodocs"],
	args: {
		kind: "bot",
		author: "Домовой",
		time: "12:24",
		children: "Заявка принята. Сообщим, когда появится исполнитель.",
	},
	argTypes: {
		kind: {
			control: "select",
			options: [...MESSAGE_KINDS],
		},
		delivery: {
			control: "select",
			options: ["sent", "delivered", "read"],
		},
		tag: {
			control: "text",
		},
		children: {
			control: "text",
		},
	},
	decorators: [
		(Story) => (
			<div
				style={{
					padding: 24,
					maxWidth: 360,
					background: "var(--bg-app, var(--bg-subtle))",
				}}
			>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Message>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Out: Story = {
	args: {
		kind: "out",
		author: undefined,
		time: "12:25",
		delivery: "read",
		children: "В подъезде течёт труба на 3 этаже.",
	},
};

export const Bot: Story = {
	args: {
		kind: "bot",
		author: "Домовой",
		time: "12:24",
		children: "Заявка принята. Сообщим, когда появится исполнитель.",
	},
};

export const Operator: Story = {
	args: {
		kind: "operator",
		author: "Елена Соколова",
		time: "13:02",
		children: "Выехал на объект, буду через 20 минут.",
	},
};

export const BotQuestion: Story = {
	args: {
		kind: "bot-question",
		author: "Домовой",
		time: "14:10",
		children: "Проблема решена?",
		actions: (
			<>
				<Button variant="secondary">Да, всё работает</Button>
				<Button variant="secondary">Нет, проблема осталась</Button>
			</>
		),
	},
};

export const OutDelivered: Story = {
	args: {
		kind: "out",
		time: "12:25",
		delivery: "delivered",
		children: "Доставлено, ещё не прочитано.",
	},
};

export const Gallery: Story = {
	render: (args) => (
		<div style={{ display: "grid", gap: 12 }}>
			<Message {...(args as MessageProps)} kind="bot" author="Домовой" time="12:20">
				Здравствуйте! Опишите проблему.
			</Message>
			<Message
				{...(args as MessageProps)}
				kind="out"
				author={undefined}
				time="12:21"
				delivery="read"
			>
				Нет горячей воды с утра.
			</Message>
			<Message {...(args as MessageProps)} kind="operator" author="Алексей Миронов" time="12:40">
				Принял в работу.
			</Message>
			<Message
				{...(args as MessageProps)}
				kind="bot-question"
				author="Домовой"
				time="15:00"
				actions={
					<>
						<Button variant="secondary">Да, всё работает</Button>
						<Button variant="secondary">Нет, проблема осталась</Button>
					</>
				}
			>
				Проблема решена?
			</Message>
		</div>
	),
};
