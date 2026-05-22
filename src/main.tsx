import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import "./shared/styles/globals.css";

import App from "./app/App.tsx";
import { UserProfileBootstrap } from "./app/providers/auth/UserProfileBootstrap";
import { AppPreferencesProvider } from "./shared/model/preferences";

registerSW({
  immediate: true,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppPreferencesProvider>
      <BrowserRouter>
        <UserProfileBootstrap />
        <App />
      </BrowserRouter>
    </AppPreferencesProvider>
  </StrictMode>,
);
