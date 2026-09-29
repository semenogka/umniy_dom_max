import { type FormEvent, useState } from "react";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchUserHouses } from "@/store/houses/houses.slice";
import { ensureDemoUser } from "@/store/user/user.slice";

import styles from "./EsiaAuth.module.scss";

/** Экран «Вход через ЕСИА» (демо: пароль сверяется на бэке) */
export function EsiaAuth() {
	const dispatch = useAppDispatch();
	const user = useAppSelector((state) => state.user.current);
	const serverError = useAppSelector((state) => state.user.demoError);
	const submitting = useAppSelector((state) => state.user.demoStatus === "loading");
	const [password, setPassword] = useState("");
	const [emptyError, setEmptyError] = useState(false);

	const error = emptyError ? "Введите пароль" : serverError;

	/**
	 * Вход по паролю: регистрация на бэке, затем дома
	 * @param event - submit формы
	 * @returns {Promise<void>}
	 */
	const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();

		if (!password) {
			setEmptyError(true);
			return;
		}

		const result = await dispatch(ensureDemoUser(password));
		if (ensureDemoUser.fulfilled.match(result)) dispatch(fetchUserHouses());
	};

	return (
		<section className={styles.root} aria-label="Авторизация через ЕСИА">
			<div className={styles.card}>
				<div className={styles.brands} role="group" aria-label="ЕСИА и Домовой">
					<img className={styles.esiaLogo} src="/esia-logo.png" alt="Госуслуги" />
					<div className={styles.domovoy}>
						<img src="/favicon.svg" alt="" aria-hidden />
						<strong>Домовой</strong>
					</div>
				</div>

				<div className={styles.account}>
					{user?.avatarUrl && <img className={styles.avatar} src={user.avatarUrl} alt="" />}
					<div className={styles.name}>{user?.name || "Житель"}</div>
				</div>

				<form onSubmit={handleSubmit} noValidate>
					<div className={styles.field}>
						<label htmlFor="esiaPassword">Пароль</label>
						<input
							id="esiaPassword"
							type="password"
							autoComplete="current-password"
							aria-describedby="esiaError"
							value={password}
							onChange={(event) => {
								setPassword(event.target.value);
								setEmptyError(false);
							}}
						/>
					</div>
					<div className={styles.error} id="esiaError" role="alert">
						{error}
					</div>
					<button className={styles.submit} type="submit" disabled={submitting}>
						Войти
					</button>
				</form>
			</div>
		</section>
	);
}
