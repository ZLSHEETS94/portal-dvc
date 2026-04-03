import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAA8SE86S2CaJWgiNVVl1V0LEBdKW4SOfo",
  authDomain: "portal-dvc.firebaseapp.com",
  projectId: "portal-dvc",
  storageBucket: "portal-dvc.firebasestorage.app",
  messagingSenderId: "617603457744",
  appId: "1:617603457744:web:514d7b740f39a2cb48f4d5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
