import { Navigate, Route, Routes } from "react-router-dom";

import { PrivateRoute } from "./components/router/PrivateRoute";
import { PublicRoute } from "./components/router/PublicRoute";
import { RegistrationPage } from "./pages/registration/RegistrationPage";
import { LoginPage } from "./pages/login/LoginPage";
import { ChatPage } from "./pages/chatPage/ChatPage";

const App = () => {
  return (
    <div>
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
              <ChatPage />
            </PrivateRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
};

export default App;
