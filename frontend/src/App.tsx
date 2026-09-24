import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { ChatPage } from "@/pages/Chat";
import { DEFAULT_CHAT_ID } from "@/pages/Chat/Chat.mock";

import styles from "./App.module.scss";

/** Сброс скролла после клавиатуры / zoom на iOS */
function useIOSViewportLock() {
	useEffect(() => {
		const resetScroll = () => {
			window.scrollTo(0, 0);
			document.documentElement.scrollTop = 0;
			document.body.scrollTop = 0;
		};

		resetScroll();
		window.addEventListener("orientationchange", resetScroll);
		window.visualViewport?.addEventListener("resize", resetScroll);
		window.visualViewport?.addEventListener("scroll", resetScroll);

		return () => {
			window.removeEventListener("orientationchange", resetScroll);
			window.visualViewport?.removeEventListener("resize", resetScroll);
			window.visualViewport?.removeEventListener("scroll", resetScroll);
		};
	}, []);
}

/** Корень приложения */
export function App() {
	useIOSViewportLock();

	return (
		<div className={styles.root}>
			<Routes>
				<Route path="/" element={<Navigate to={`/chat/${DEFAULT_CHAT_ID}`} replace />} />
				<Route path="/chat/:chatId" element={<ChatPage />} />
				<Route path="*" element={<Navigate to={`/chat/${DEFAULT_CHAT_ID}`} replace />} />
			</Routes>
		</div>
	);
}

export default App;
