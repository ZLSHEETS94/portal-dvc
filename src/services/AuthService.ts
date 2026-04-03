import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  signInWithPopup,
  User
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { FirestoreService } from "./FirestoreService";
import { DEFAULT_AVATAR } from "../types";

export class AuthService {
  static async login(email: string, pass: string) {
    const credential = await signInWithEmailAndPassword(auth, email, pass);
    return credential.user;
  }

  static async signUp(email: string, pass: string, name: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    const user = credential.user;
    
    await FirestoreService.saveUserProfile({
      uid: user.uid,
      displayName: name,
      email: user.email || "",
      photoURL: DEFAULT_AVATAR,
    });
    
    return user;
  }

  static async loginWithGoogle() {
    const credential = await signInWithPopup(auth, googleProvider);
    const user = credential.user;
    
    await FirestoreService.saveUserProfile({
      uid: user.uid,
      displayName: user.displayName || "",
      email: user.email || "",
      photoURL: user.photoURL || DEFAULT_AVATAR,
    });
    
    return user;
  }

  static async logout() {
    await signOut(auth);
  }

  static async resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }
}
