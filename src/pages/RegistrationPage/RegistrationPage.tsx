import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "../../components/input/Input";
import { Button } from "../../components/button/Button";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";

import s from "./registrationPage.module.css";

export const RegistrationPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEmailError("");
    setPasswordError("");

    if (!email) {
      setEmailError("Email is required");
      setLoading(false);
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|net|org|io|ru)$/;
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (!password) {
      setPasswordError("Password is required");
      setLoading(false);
      return;
    }

    if (password.length < 6 || password.length > 20) {
      setPasswordError("Password must be between 6 and 20 characters long");
      setLoading(false);
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("Пользователь успешно зарегистрирован!");
      navigate("/login");
    } catch (err) {
      setEmailError("A user with this email already exists");
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.root}>
      <h2>Registration</h2>
      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          error={emailError}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />
        <Input
          error={passwordError}
          label="Password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
        />

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
