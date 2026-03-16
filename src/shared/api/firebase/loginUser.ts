import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebaseConfig";

const loginUser = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export default loginUser;
