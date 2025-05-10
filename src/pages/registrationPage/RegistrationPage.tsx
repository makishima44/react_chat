import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "@/services/firebase/registerUser";
import { Input } from "@/components/UI/input";
import { Button } from "@/components/UI/button";
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
      await registerUser(email, password);
      console.log("Пользователь успешно зарегистрирован!");
      navigate("/chat");
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setEmailError("A user with this email already exists");
      } else if (err.code === "auth/invalid-email") {
        setEmailError("Please enter a valid email address");
      } else if (err.code === "auth/weak-password") {
        setPasswordError("Password must be at least 6 characters long");
      } else if (err.code === "auth/network-request-failed") {
        setEmailError("Network error. Please try again later");
      }
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
          {loading ? "Registration..." : "Sign up"}
        </Button>
      </form>
      <p>
        Already have an account? <a href="/login">Sign up</a>
      </p>
    </div>
  );
};
