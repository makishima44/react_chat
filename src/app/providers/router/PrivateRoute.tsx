import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/shared/api/firebase/firebaseConfig";
import { useAppPreferences } from "@/shared/model/preferences";

type Props = {
  children: ReactNode;
};

export const PrivateRoute = ({ children }: Props) => {
  const [user, loading] = useAuthState(auth);
  const { t } = useAppPreferences();

  if (loading) {
    return <div>{t("commonLoading")}</div>;
  }

  return user ? children : <Navigate to="/login" replace />;
};
