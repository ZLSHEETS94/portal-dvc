import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  collection as firestoreCollection
} from "firebase/firestore";
import { db } from "../firebase";
import { UserProfile } from "../types";
import { handleFirestoreError, OperationType } from "../lib/firestoreErrorHandler";

export class FirestoreService {
  private static COLLECTION = "users";

  static async getUserProfile(uid: string): Promise<UserProfile | null> {
    const path = `${this.COLLECTION}/${uid}`;
    try {
      const docRef = doc(db, this.COLLECTION, uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  }

  static async saveUserProfile(profile: Partial<UserProfile> & { uid: string }): Promise<void> {
    const path = `${this.COLLECTION}/${profile.uid}`;
    try {
      const docRef = doc(db, this.COLLECTION, profile.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const newProfile: UserProfile = {
          uid: profile.uid,
          displayName: profile.displayName || "",
          email: profile.email || "",
          photoURL: profile.photoURL || "",
          phoneNumber: profile.phoneNumber || "",
          cpf: profile.cpf || "",
          status: "Ativo",
          plan: "Free",
          createdAt: new Date().toISOString(),
          ...profile
        };
        await setDoc(docRef, newProfile);
      } else {
        await updateDoc(docRef, {
          ...profile,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  static async updateProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    const path = `${this.COLLECTION}/${uid}`;
    try {
      const docRef = doc(db, this.COLLECTION, uid);
      await updateDoc(docRef, data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  static async getUsersProfiles(uids: string[]): Promise<UserProfile[]> {
    if (!uids || uids.length === 0) return [];
    
    try {
      // Firestore 'in' query is limited to 10-30 items depending on version, 
      // but for avatars we usually only show a few.
      // We'll take the first 10 to be safe and efficient.
      const limitedUids = uids.slice(0, 10);
      const q = query(
        firestoreCollection(db, this.COLLECTION),
        where("uid", "in", limitedUids)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (error) {
      console.error("Error fetching user profiles:", error);
      return [];
    }
  }
}
