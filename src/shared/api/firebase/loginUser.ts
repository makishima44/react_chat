import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { syncUserProfile } from "./syncUserProfile";

const loginUser = async (email: string, password: string) => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await syncUserProfile(credential.user);
  return credential;
};

export default loginUser;
