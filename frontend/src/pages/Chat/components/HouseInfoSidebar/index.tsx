import { useId } from "react";

import { Button } from "@/components/Button";
import { Icon } from "@/components/Icon";

import {
	HOUSE_INFO_ADDRESS_LABEL,
	HOUSE_INFO_MAP_LABEL,
	HOUSE_INFO_TITLE,
} from "./HouseInfoSidebar.config";
import styles from "./HouseInfoSidebar.module.scss";
import {
	getHouseInfoSidebarClassName,
	getHouseMapEmbedUrl,
	getHouseMapsUrl,
} from "./HouseInfoSidebar.service";
import type { HouseInfoSidebarProps } from "./HouseInfoSidebar.types";

/** Лист «Мой дом»: адрес, ссылка на карты, карта снизу */
export function HouseInfoSidebar(props: HouseInfoSidebarProps) {
	const { address, photoUrl, apartment, onClose, className } = props;
	const titleId = useId();
	const mapsUrl = getHouseMapsUrl(address);
	const embedUrl = getHouseMapEmbedUrl(address);

	return (
		<div className={getHouseInfoSidebarClassName(styles, className)} aria-labelledby={titleId}>
			<div className={styles.head}>
				<h2 id={titleId} className={styles.title}>
					{HOUSE_INFO_TITLE}
				</h2>

				<Button variant="icon" type="button" aria-label="Закрыть" onClick={onClose}>
					<Icon name="close" size="xl" />
				</Button>
			</div>

			{photoUrl ? (
				<div className={styles.photo}>
					<img className={styles.photoImage} src={photoUrl} alt="" />
					{apartment ? <span className={styles.apartment}>кв. {apartment}</span> : null}
				</div>
			) : null}

			<section className={styles.section}>
				<p className={styles.label}>{HOUSE_INFO_ADDRESS_LABEL}</p>
				<p className={styles.address}>{address}</p>

				<div className={styles.actions}>
					<Button
						variant="outline"
						tag="a"
						href={mapsUrl}
						target="_blank"
						rel="noreferrer"
						className={styles.mapButton}
					>
						{HOUSE_INFO_MAP_LABEL}
					</Button>
				</div>
			</section>

			<div className={styles.map}>
				<iframe
					className={styles.mapFrame}
					title={`Карта: ${address}`}
					src={embedUrl}
					loading="lazy"
					referrerPolicy="no-referrer-when-downgrade"
					allowFullScreen
				/>
			</div>
		</div>
	);
}

HouseInfoSidebar.displayName = "HouseInfoSidebar";
