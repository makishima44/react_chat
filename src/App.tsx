import { Navigate, Route, Routes } from "react-router-dom";
import { RegistrationPage } from "./pages/registrationPage/RegistrationPage";
import { LoginPage } from "./pages/loginPage/LoginPage";
import { ChatPage } from "./pages/chatPage/ChatPage";
import { PrivateRoute } from "./components/router/PrivateRoute";

import { PublicRoute } from "./components/router/PublicRoute";

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
