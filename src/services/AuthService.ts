import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
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
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const user = credential.user;
      
      await FirestoreService.saveUserProfile({
        uid: user.uid,
        displayName: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || DEFAULT_AVATAR,
      });
      
      return user;
    } catch (error: any) {
      // If popup is blocked or COOP error occurs, try redirect
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/cancelled-popup-request' || error.message?.includes('Cross-Origin-Opener-Policy')) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        throw error;
      }
    }
  }

  static async handleRedirectResult() {
    const result = await getRedirectResult(auth);
    if (result) {
      const user = result.user;
      await FirestoreService.saveUserProfile({
        uid: user.uid,
        displayName: user.displayName || "",
        email: user.email || "",
        photoURL: user.photoURL || DEFAULT_AVATAR,
      });
      return user;
    }
    return null;
  }

  static async logout() {
    await signOut(auth);
  }

  static async resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email);
  }
}
