import { JSX } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../../firebase/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";

type Props = {
  children: JSX.Element;
};

export const PrivateRoute = ({ children }: Props) => {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div>Loading...</div>; // или спиннер
  }

  return user ? children : <Navigate to="/login" replace />;
};
