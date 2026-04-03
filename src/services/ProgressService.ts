import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  getDocs,
  Timestamp
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { handleFirestoreError, OperationType } from "../lib/firestoreErrorHandler";

export interface UserProgress {
  id?: string;
  userId: string;
  groupId: string;
  postId: string;
  completedAt: Timestamp;
}

export class ProgressService {
  private static COLLECTION = "user_progress";

  static async toggleCompletion(groupId: string, postId: string): Promise<boolean> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("Usuário não autenticado");

    const progressId = `${userId}_${postId}`;
    const docRef = doc(db, this.COLLECTION, progressId);

    try {
      const q = query(
        collection(db, this.COLLECTION),
        where("userId", "==", userId),
        where("postId", "==", postId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Already completed, so remove it (toggle off)
        await deleteDoc(docRef);
        return false;
      } else {
        // Not completed, so add it (toggle on)
        await setDoc(docRef, {
          userId,
          groupId,
          postId,
          completedAt: Timestamp.now()
        });
        return true;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${this.COLLECTION}/${progressId}`);
      throw error;
    }
  }

  static subscribeToUserProgress(groupId: string, callback: (completedPostIds: string[]) => void) {
    const userId = auth.currentUser?.uid;
    if (!userId) return () => {};

    const q = query(
      collection(db, this.COLLECTION),
      where("userId", "==", userId),
      where("groupId", "==", groupId)
    );

    return onSnapshot(q, (snapshot) => {
      const completedPostIds = snapshot.docs.map(doc => doc.data().postId);
      callback(completedPostIds);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, this.COLLECTION);
    });
  }

  static subscribeToPostCompletion(postId: string, callback: (isCompleted: boolean) => void) {
    const userId = auth.currentUser?.uid;
    if (!userId) return () => {};

    const q = query(
      collection(db, this.COLLECTION),
      where("userId", "==", userId),
      where("postId", "==", postId)
    );

    return onSnapshot(q, (snapshot) => {
      callback(!snapshot.empty);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, this.COLLECTION);
    });
  }
}
