import { Navigate, Route, Routes } from "react-router-dom";

import { ChatPage } from "@/pages/Chat";
import { DEFAULT_CHAT_ID } from "@/pages/Chat/Chat.mock";

import styles from "./App.module.scss";

/** Корень приложения */
export function App() {
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
