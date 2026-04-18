import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import loginUser from "@/shared/api/firebase/loginUser";
import { getEmailError, getPasswordError } from "@/shared/lib/validation";

import s from "./loginPage.module.css";

import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { TerminalFrame } from "@/shared/ui/terminal-frame/TerminalFrame";
import { useAppPreferences } from "@/shared/model/preferences";

export const LoginPage = () => {
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
      await loginUser(email, password);
      sessionStorage.setItem("challengeRequired", "1");
      navigate("/rooms");
    } catch (err) {
      const firebaseError = err as FirebaseError;
      if (firebaseError.code === "auth/invalid-credential") {
        setPasswordError(t("firebaseInvalidCredential"));
      } else if (firebaseError.code === "auth/invalid-email") {
        setEmailError(t("firebaseInvalidEmail"));
      } else if (firebaseError.code === "auth/too-many-requests") {
        setFormError(t("firebaseTooManyRequests"));
      } else if (firebaseError.code === "auth/network-request-failed") {
        setFormError(t("firebaseNetworkError"));
      } else {
        setFormError(t("loginGenericError"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.page}>
      <TerminalFrame
        title={t("loginTitle")}
        subtitle={t("loginSubtitle")}
        footer={
          <span className={s.hint}>
            {t("loginNoAccess")} <Link to="/register">{t("loginRequestAccess")}</Link>
          </span>
        }
      >
        <form onSubmit={handleSubmit} className={s.form}>
          <Input
            id="login-email"
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
            id="login-password"
            error={passwordError}
            label={t("loginPasswordLabel")}
            type="password"
            name="password"
            autoComplete="current-password"
            required
            minLength={6}
            maxLength={64}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("loginPasswordPlaceholder")}
          />

          {formError && <div className={s.formError}>{formError}</div>}

          <Button type="submit" disabled={loading}>
            {loading ? t("loginSubmitting") : t("loginSubmit")}
          </Button>
        </form>
      </TerminalFrame>
    </div>
  );
};
