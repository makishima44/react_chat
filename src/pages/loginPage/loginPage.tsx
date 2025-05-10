import { useState } from "react";

import { Input } from "../../components/UI/input/Input";
import { useNavigate } from "react-router-dom";
import loginUser from "@/services/firebase/loginUser";

import s from "./loginPage.module.css";
import { Button } from "@/components/UI/button/Button";

type loginPageProps = {};

export const LoginPage = ({}: loginPageProps) => {
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
      await loginUser(email, password);
      navigate("/chat");
    } catch (err: any) {
      console.log(err.code);
      if (err.code === "auth/invalid-credential") {
        setPasswordError("Wrong password");
      } else if (err.code === "auth/invalid-email") {
        setEmailError("Please enter a valid email address");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.root}>
      <h2>Sign in</h2>
      <form onSubmit={handleSubmit}>
        <Input
          label="Login"
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
          {loading ? "Loading..." : "Sign in"}
        </Button>
      </form>
      <p>
        Don't have an account? <a href="/register">Sign up</a>
      </p>
    </div>
  );
};
