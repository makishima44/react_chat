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
import { useAppPreferences } from "@/shared/model/preferences";

export const RegistrationPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string>("");
  const [passwordError, setPasswordError] = useState<string>("");
  const [formError, setFormError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { t } = useAppPreferences();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEmailError("");
    setPasswordError("");
    setFormError("");

    const nextEmailError = getEmailError(email, t);
    const nextPasswordError = getPasswordError(password, t);
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
        setEmailError(t("registerEmailExists"));
      } else if (firebaseError.code === "auth/invalid-email") {
        setEmailError(t("firebaseInvalidEmail"));
      } else if (firebaseError.code === "auth/weak-password") {
        setPasswordError(t("registerWeakPassword"));
      } else if (firebaseError.code === "auth/network-request-failed") {
        setFormError(t("firebaseNetworkError"));
      } else {
        setFormError(t("registerGenericError"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.page}>
      <TerminalFrame
        title={t("registerTitle")}
        subtitle={t("registerSubtitle")}
        footer={
          <span className={s.hint}>
            {t("registerHaveAccess")} <Link to="/login">{t("registerBackToLogin")}</Link>
          </span>
        }
      >
        <form onSubmit={handleSubmit} className={s.form}>
          <Input
            id="register-email"
            label={t("loginEmailLabel")}
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
            label={t("loginPasswordLabel")}
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={6}
            maxLength={64}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("registerPasswordPlaceholder")}
          />

          {formError && <div className={s.formError}>{formError}</div>}

          <Button type="submit" disabled={loading}>
            {loading ? t("registerSubmitting") : t("registerSubmit")}
          </Button>
        </form>
      </TerminalFrame>
    </div>
  );
};
