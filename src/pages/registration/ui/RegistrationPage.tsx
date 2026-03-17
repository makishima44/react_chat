import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { registerUser } from "@/shared/api/firebase/registerUser";
import { auth } from "@/shared/api/firebase/firebaseConfig";
import { signOut } from "firebase/auth";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import s from "./registrationPage.module.css";
import { TerminalFrame } from "@/shared/ui/terminal-frame/TerminalFrame";
import { getEmailError, getPasswordError } from "@/shared/lib/validation";

export const RegistrationPage = () => {
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
      await registerUser(email, password);
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      const firebaseError = err as FirebaseError;
      if (firebaseError.code === "auth/email-already-in-use") {
        setEmailError("A user with this email already exists");
      } else if (firebaseError.code === "auth/invalid-email") {
        setEmailError("Please enter a valid email address");
      } else if (firebaseError.code === "auth/weak-password") {
        setPasswordError("Password must be at least 6 characters long");
      } else if (firebaseError.code === "auth/network-request-failed") {
        setFormError("Network error. Please try again.");
      } else {
        setFormError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.page}>
      <TerminalFrame
        title="Request Access"
        subtitle="Register your operator ID to join the network."
        footer={
          <span className={s.hint}>
            Already cleared? <Link to="/login">Return to login</Link>
          </span>
        }
      >
        <form onSubmit={handleSubmit} className={s.form}>
          <Input
            id="register-email"
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
            id="register-password"
            error={passwordError}
            label="Passcode"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={6}
            maxLength={64}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Choose passcode"
          />

          {formError && <div className={s.formError}>{formError}</div>}

          <Button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Authorize Access"}
          </Button>
        </form>
      </TerminalFrame>
    </div>
  );
};
