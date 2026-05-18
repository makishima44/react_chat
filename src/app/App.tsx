import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { PrivateRoute } from "./providers/router/PrivateRoute";
import { PublicRoute } from "./providers/router/PublicRoute";
import { RegistrationPage } from "@/pages/registration/ui/RegistrationPage";
import { LoginPage } from "@/pages/login/ui/LoginPage";
import { RoomsPage } from "@/pages/rooms/ui/RoomsPage";
import { ChatPage } from "@/pages/chat/ui/ChatPage";
import { DirectMessagesPage } from "@/pages/direct-messages/ui/DirectMessagesPage";
import { DirectChatPage } from "@/pages/direct-chat/ui/DirectChatPage";
import { MatrixSplash } from "@/widgets/splash/ui/MatrixSplash";
import s from "./App.module.css";

const App = () => {
  const [splashState, setSplashState] = useState<"visible" | "fading" | "hidden">("visible");

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setSplashState("fading"), 2200);
    const hideTimer = window.setTimeout(() => setSplashState("hidden"), 3000);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div className={s.app}>
      {splashState !== "hidden" && (
        <MatrixSplash
          state={splashState}
          onSkip={() => setSplashState("hidden")}
        />
      )}
      <Routes>
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegistrationPage />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <Navigate to="/rooms" replace />
            </PrivateRoute>
          }
        />
        <Route
          path="/dm"
          element={
            <PrivateRoute>
              <DirectMessagesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/dm/:chatId"
          element={
            <PrivateRoute>
              <DirectChatPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/chat/:roomId"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/rooms"
          element={
            <PrivateRoute>
              <RoomsPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
};

export default App;
