import { Navigate, Route, Routes } from "react-router-dom";

import { PrivateRoute } from "./providers/router/PrivateRoute";
import { PublicRoute } from "./providers/router/PublicRoute";
import { RegistrationPage } from "@/pages/registration/ui/RegistrationPage";
import { LoginPage } from "@/pages/login/ui/LoginPage";
import { ChatPage } from "@/pages/chat/ui/ChatPage";
import { DirectMessagesPage } from "@/pages/direct-messages/ui/DirectMessagesPage";
import { DirectChatPage } from "@/pages/direct-chat/ui/DirectChatPage";
import { ChatPreviewPage } from "@/pages/chat/ui/ChatPreviewPage";
import { RoomsPage } from "@/pages/rooms/ui/RoomsPage";
import { PwaInstallPrompt } from "@/widgets/pwa-install/ui/PwaInstallPrompt";
import { useViewportHeight } from "./model/useViewportHeight";
import s from "./App.module.css";

const App = () => {
  useViewportHeight();

  return (
    <div className={s.app}>
      <PwaInstallPrompt />
      <Routes>
        {import.meta.env.DEV && <Route path="/_dev/chat-preview" element={<ChatPreviewPage />} />}
        {import.meta.env.DEV && <Route path="/_dev/rooms-preview" element={<RoomsPage />} />}
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
