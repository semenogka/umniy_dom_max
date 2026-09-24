import { useId, useState, type SubmitEvent } from "react";

import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { TextField } from "@/components/TextField";
import {
	NEW_APPEAL_DESCRIPTION_PLACEHOLDER,
	NEW_APPEAL_HINT,
	NEW_APPEAL_HOME_CONTEXT,
	NEW_APPEAL_SUBMIT_LABEL,
	NEW_APPEAL_TITLE,
	NEW_APPEAL_TOPICS,
} from "./NewAppealSidebar.config";
import styles from "./NewAppealSidebar.module.scss";
import {
	canSubmitNewAppeal,
	getNewAppealSidebarClassName,
	getNewAppealTopicClassName,
	getNewAppealValidationError,
} from "./NewAppealSidebar.service";
import type { NewAppealSidebarProps, NewAppealTopicId } from "./NewAppealSidebar.types";

/** Форма нового обращения в нижнем листе */
export function NewAppealSidebar(props: NewAppealSidebarProps) {
	const { homeContext = NEW_APPEAL_HOME_CONTEXT, onClose, onSubmit, className } = props;
	const titleId = useId();
	const descriptionId = useId();
	const [topicId, setTopicId] = useState<NewAppealTopicId | null>(null);
	const [description, setDescription] = useState("");
	const [error, setError] = useState<string | null>(null);

	const descriptionEnabled = Boolean(topicId);
	const canSubmit = canSubmitNewAppeal(topicId, description);

	const handleSelectTopic = (nextTopicId: NewAppealTopicId) => {
		setTopicId(nextTopicId);
		setError(null);
	};

	const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();

		const validationError = getNewAppealValidationError(topicId, description);
		if (validationError || !topicId) {
			setError(validationError);
			return;
		}

		onSubmit?.({
			topicId,
			description: description.trim(),
		});
		onClose?.();
	};

	return (
		<form
			className={getNewAppealSidebarClassName(styles, className)}
			aria-labelledby={titleId}
			onSubmit={handleSubmit}
		>
			<div className={styles.head}>
				<h2 id={titleId} className={styles.title}>
					{NEW_APPEAL_TITLE}
				</h2>

				<Button variant="icon" type="button" aria-label="Закрыть" onClick={onClose}>
					<Icon name="close" size="xl" />
				</Button>
			</div>

			<p className={styles.home}>{homeContext}</p>
			<p className={styles.hint}>{NEW_APPEAL_HINT}</p>

			<div className={styles.topics} role="radiogroup" aria-label="Тема обращения">
				{NEW_APPEAL_TOPICS.map((topic) => {
					const selected = topic.id === topicId;

					return (
						<button
							key={topic.id}
							type="button"
							role="radio"
							aria-checked={selected}
							className={getNewAppealTopicClassName(styles, selected)}
							onClick={() => handleSelectTopic(topic.id)}
						>
							{topic.label}
						</button>
					);
				})}
			</div>

			<div
				className={[styles.details, !descriptionEnabled && styles.detailsDisabled]
					.filter(Boolean)
					.join(" ")}
				aria-disabled={!descriptionEnabled}
			>
				<label className={styles.label} htmlFor={descriptionId}>
					Опишите проблему
				</label>

				<TextField
					id={descriptionId}
					size="multi"
					tag="textarea"
					name="description"
					value={description}
					disabled={!descriptionEnabled}
					placeholder={NEW_APPEAL_DESCRIPTION_PLACEHOLDER}
					autoComplete="off"
					required
					onChange={(event) => {
						setDescription(event.target.value);
						setError(null);
					}}
				/>
			</div>

			<p className={styles.error} role="alert" aria-live="polite">
				{error}
			</p>

			<Button variant="accent" type="submit" className={styles.submit} disabled={!canSubmit}>
				{NEW_APPEAL_SUBMIT_LABEL}
			</Button>
		</form>
	);
}

NewAppealSidebar.displayName = "NewAppealSidebar";
