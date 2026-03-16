import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import loginUser from "@/shared/api/firebase/loginUser";
import { getEmailError, getPasswordError } from "@/shared/lib/validation";

import s from "./loginPage.module.css";

import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { TerminalFrame } from "@/shared/ui/terminal-frame/TerminalFrame";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEmailError("");
    setPasswordError("");
    setFormError("");

    const nextEmailError = getEmailError(email);
    const nextPasswordError = getPasswordError(password);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) {
      setLoading(false);
      return;
    }

    try {
      await loginUser(email, password);
      sessionStorage.setItem("challengeRequired", "1");
      navigate("/chat");
    } catch (err) {
      const firebaseError = err as FirebaseError;
      if (firebaseError.code === "auth/invalid-credential") {
        setPasswordError("Invalid email or password");
      } else if (firebaseError.code === "auth/invalid-email") {
        setEmailError("Please enter a valid email address");
      } else if (firebaseError.code === "auth/too-many-requests") {
        setFormError("Too many attempts. Please wait a minute and try again.");
      } else if (firebaseError.code === "auth/network-request-failed") {
        setFormError("Network error. Please try again.");
      } else {
        setFormError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.page}>
      <TerminalFrame
        title="Access Node"
        subtitle="Identify yourself to enter the secure channel."
        footer={
          <span className={s.hint}>
            No clearance yet? <Link to="/register">Request access</Link>
          </span>
        }
      >
        <form onSubmit={handleSubmit} className={s.form}>
          <Input
            id="login-email"
            label="Operator Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            maxLength={254}
            error={emailError}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="operator@node.net"
          />
          <Input
            id="login-password"
            error={passwordError}
            label="Passcode"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            minLength={6}
            maxLength={64}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter passcode"
          />

          {formError && <div className={s.formError}>{formError}</div>}

          <Button type="submit" disabled={loading}>
            {loading ? "Connecting..." : "Enter Channel"}
          </Button>
        </form>
      </TerminalFrame>
    </div>
  );
};
