import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import { Loader } from "@/components/Loader";
import { store } from "@/store";

import App from "./App.tsx";
import "./styles/vars.scss";
import "./index.css";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Provider store={store}>
			<BrowserRouter>
				<App />
				<Loader />
			</BrowserRouter>
		</Provider>
	</StrictMode>,
);
