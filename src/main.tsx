import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./shared/styles/globals.css";

import App from "./app/App.tsx";
import { AppPreferencesProvider } from "./shared/model/preferences";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppPreferencesProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppPreferencesProvider>
  </StrictMode>,
);
