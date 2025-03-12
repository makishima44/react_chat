import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../../components/input/Input";
import { Button } from "../../components/button/Button";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import validator from "validator";

export const RegistrationPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email || !password) {
      setError("Please fill out all fields");
      setLoading(false);
      return;
    }

    if (!validator.isEmail(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("Пользователь успешно зарегистрирован!");
      navigate("/login");
    } catch (err) {
      setError("Error" + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Registration</h2>
      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />
        <Input
          label="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
        />
        {error && <p className="error-message">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Registration..." : "Register"}
        </Button>
      </form>
      <p>
        Already have an account? <a href="/login">Enter</a>
      </p>
    </div>
  );
};
