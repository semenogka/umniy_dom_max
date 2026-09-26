import { useId } from "react";

import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";
import { HOUSE_PICKER_TITLE } from "./HousePickerSidebar.config";
import styles from "./HousePickerSidebar.module.scss";
import {
	getHousePickerOptionClassName,
	getHousePickerSidebarClassName,
} from "./HousePickerSidebar.service";
import type { HousePickerSidebarProps } from "./HousePickerSidebar.types";

/** Лист выбора дома */
export function HousePickerSidebar(props: HousePickerSidebarProps) {
	const { houses, selectedHouse, onSelectHouse, onClose, className } = props;
	const titleId = useId();

	return (
		<div className={getHousePickerSidebarClassName(styles, className)} aria-labelledby={titleId}>
			<div className={styles.head}>
				<h2 id={titleId} className={styles.title}>
					{HOUSE_PICKER_TITLE}
				</h2>

				<Button variant="icon" type="button" aria-label="Закрыть" onClick={onClose}>
					<Icon name="close" size="xl" />
				</Button>
			</div>

			<div className={styles.options} role="radiogroup" aria-label="Доступные дома">
				{houses.map((house) => {
					const selected = house.id === selectedHouse?.id;

					return (
						<button
							key={house.id}
							type="button"
							role="radio"
							aria-checked={selected}
							className={getHousePickerOptionClassName(styles, selected)}
							onClick={() => {
								onSelectHouse?.(house);
								onClose?.();
							}}
						>
							<span className={styles.optionIcon} aria-hidden>
								<Icon name="building" size="lg" />
							</span>

							<span className={styles.optionCopy}>
								<strong className={styles.optionAddress}>{house.address}</strong>
							</span>

							<Icon name="check" size="lg" className={styles.optionCheck} />
						</button>
					);
				})}
			</div>
		</div>
	);
}

HousePickerSidebar.displayName = "HousePickerSidebar";
