import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { syncUserProfile } from "./syncUserProfile";

export const registerUser = async (email: string, password: string) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await syncUserProfile(credential.user);
  return credential;
};
