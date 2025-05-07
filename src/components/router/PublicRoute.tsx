import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/services/firebase/firebaseConfig";

type Props = {
  children: ReactNode;
};

export const PublicRoute = ({ children }: Props) => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? <Navigate to="/chat" replace /> : children;
};
