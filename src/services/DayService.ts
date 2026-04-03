import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot,
  orderBy,
  doc,
  deleteDoc
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { CalendarDay } from "../types";
import { handleFirestoreError, OperationType } from "../lib/firestoreErrorHandler";

export class DayService {
  private static getCollection(groupId: string) {
    return collection(db, "groups", groupId, "calendar_days");
  }

  static async createDay(groupId: string, data: { titulo: string; data_string: string; hora_string: string }): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    try {
      await addDoc(this.getCollection(groupId), {
        ...data,
        criado_em: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `groups/${groupId}/calendar_days`);
    }
  }

  static async deleteDay(groupId: string, dayId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "groups", groupId, "calendar_days", dayId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `groups/${groupId}/calendar_days/${dayId}`);
    }
  }

  static subscribeToDays(groupId: string, callback: (days: CalendarDay[]) => void) {
    // Simplified query to avoid composite index requirement (data_string + hora_string)
    // We will sort client-side instead
    const q = query(this.getCollection(groupId), orderBy("data_string", "asc"));

    return onSnapshot(q, (snapshot) => {
      const days = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CalendarDay[];
      
      // Secondary sort by hora_string client-side
      const sortedDays = [...days].sort((a, b) => {
        if (a.data_string === b.data_string) {
          return a.hora_string.localeCompare(b.hora_string);
        }
        return 0; // Already sorted by data_string by Firestore
      });

      callback(sortedDays);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `groups/${groupId}/calendar_days`);
    });
  }
}
