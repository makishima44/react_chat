import { Link, Route, Routes } from "react-router-dom";

import { LoginPage } from "./pages/loginPage/loginPage";
import { RegistrationPage } from "./pages/RegistrationPage/RegistrationPage";

const App = () => {
  return (
    <div>
      <nav>
        <Link to="/register">Регистрация</Link>
        <Link to="/login">Вход</Link>
      </nav>

      <Routes>
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<LoginPage />} /> {/* По умолчанию открываем вход */}
      </Routes>
    </div>
  );
};

export default App;
