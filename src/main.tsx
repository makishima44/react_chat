import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import "./shared/styles/globals.css";

import App from "./app/App.tsx";
import { UserProfileBootstrap } from "./app/providers/auth/UserProfileBootstrap";
import { AppPreferencesProvider } from "./shared/model/preferences";

const isLocalHost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || window.location.hostname === "::1");

const unregisterLocalServiceWorkers = async () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if (!("caches" in window)) {
    return;
  }

  const cacheKeys = await window.caches.keys();
  await Promise.all(
    cacheKeys
      .filter((key) => key.includes("workbox") || key.includes("react-chat") || key.includes("google-fonts"))
      .map((key) => window.caches.delete(key)),
  );
};

if (import.meta.env.PROD && !isLocalHost) {
  registerSW({
    immediate: true,
  });
} else {
  void unregisterLocalServiceWorkers();
}

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
