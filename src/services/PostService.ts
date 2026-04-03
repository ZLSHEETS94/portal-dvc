import { 
  collection, 
  addDoc, 
  query, 
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  deleteDoc,
  getDocs
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { Post } from "../types";
import { handleFirestoreError, OperationType } from "../lib/firestoreErrorHandler";
import { CloudinaryService } from "./CloudinaryService";
import { FirestoreService } from "./FirestoreService";

export class PostService {
  private static getCollection(groupId: string, dayId: string) {
    return collection(db, "groups", groupId, "calendar_days", dayId, "posts");
  }

  static async uploadAudio(file: Blob): Promise<string> {
    try {
      return await CloudinaryService.uploadAudio(file, "Audios_post");
    } catch (error) {
      console.error("Erro no upload de áudio para Cloudinary:", error);
      throw error;
    }
  }

  static async uploadVideo(file: File | Blob): Promise<{ url: string; public_id: string }> {
    try {
      return await CloudinaryService.uploadVideo(file, "Videos_post");
    } catch (error) {
      console.error("Erro no upload de vídeo para Cloudinary:", error);
      throw error;
    }
  }

  static async uploadPdf(file: File | Blob): Promise<string> {
    try {
      return await CloudinaryService.uploadRaw(file, "PDFs_post");
    } catch (error) {
      console.error("Erro no upload de PDF para Cloudinary:", error);
      throw error;
    }
  }

  static async addPost(
    groupId: string, 
    dayId: string, 
    data: Partial<Post>
  ): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    try {
      const profile = await FirestoreService.getUserProfile(user.uid);
      
      const docRef = await addDoc(this.getCollection(groupId, dayId), {
        ...data,
        autor_id: user.uid,
        autor_nome: profile?.displayName || user.displayName || "Usuário",
        autor_foto: profile?.photoURL || user.photoURL || "",
        curtidas: [],
        comentarios_count: 0,
        criado_em: new Date().toISOString(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `groups/${groupId}/calendar_days/${dayId}/posts`);
      throw error;
    }
  }

  static async toggleLike(groupId: string, dayId: string, postId: string, userId: string): Promise<void> {
    const postRef = doc(db, "groups", groupId, "calendar_days", dayId, "posts", postId);
    try {
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) return;
      
      const curtidas = postSnap.data().curtidas || [];
      const isLiked = curtidas.includes(userId);

      await updateDoc(postRef, {
        curtidas: isLiked ? arrayRemove(userId) : arrayUnion(userId)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `groups/${groupId}/calendar_days/${dayId}/posts/${postId}`);
    }
  }

  static subscribeToPosts(groupId: string, dayId: string, callback: (posts: Post[]) => void) {
    const q = query(this.getCollection(groupId, dayId), orderBy("criado_em", "desc"));

    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      callback(posts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `groups/${groupId}/calendar_days/${dayId}/posts`);
    });
  }

  static async addComment(groupId: string, dayId: string, postId: string, texto: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    const commentsRef = collection(db, "groups", groupId, "calendar_days", dayId, "posts", postId, "comments");
    const postRef = doc(db, "groups", groupId, "calendar_days", dayId, "posts", postId);

    try {
      const profile = await FirestoreService.getUserProfile(user.uid);

      await addDoc(commentsRef, {
        autor_id: user.uid,
        autor_nome: profile?.displayName || user.displayName || "Usuário",
        autor_foto: profile?.photoURL || user.photoURL || "",
        texto,
        criado_em: new Date().toISOString(),
      });

      const postSnap = await getDoc(postRef);
      const currentCount = postSnap.data()?.comentarios_count || 0;
      await updateDoc(postRef, {
        comentarios_count: currentCount + 1
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `groups/${groupId}/calendar_days/${dayId}/posts/${postId}/comments`);
    }
  }

  static subscribeToComments(groupId: string, dayId: string, postId: string, callback: (comments: any[]) => void) {
    const commentsRef = collection(db, "groups", groupId, "calendar_days", dayId, "posts", postId, "comments");
    const q = query(commentsRef, orderBy("criado_em", "asc"));

    return onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(comments);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `groups/${groupId}/calendar_days/${dayId}/posts/${postId}/comments`);
    });
  }

  static async deletePost(groupId: string, dayId: string, postId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, "groups", groupId, "calendar_days", dayId, "posts", postId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `groups/${groupId}/calendar_days/${dayId}/posts/${postId}`);
    }
  }

  static async getPostById(groupId: string, dayId: string, postId: string): Promise<Post | null> {
    const postRef = doc(db, "groups", groupId, "calendar_days", dayId, "posts", postId);
    try {
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        return { id: postSnap.id, ...postSnap.data() } as Post;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `groups/${groupId}/calendar_days/${dayId}/posts/${postId}`);
      return null;
    }
  }

  static async updatePersonalNote(groupId: string, dayId: string, postId: string, userId: string, content: string): Promise<void> {
    const noteRef = doc(db, "groups", groupId, "calendar_days", dayId, "posts", postId, "personal_notes", userId);
    try {
      await updateDoc(noteRef, {
        content,
        updated_at: new Date().toISOString()
      }).catch(async (err) => {
        // If document doesn't exist, create it
        if (err.code === 'not-found') {
          const { setDoc } = await import("firebase/firestore");
          await setDoc(noteRef, {
            content,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        } else {
          throw err;
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `groups/${groupId}/calendar_days/${dayId}/posts/${postId}/personal_notes/${userId}`);
    }
  }

  static async getPersonalNote(groupId: string, dayId: string, postId: string, userId: string): Promise<string> {
    const noteRef = doc(db, "groups", groupId, "calendar_days", dayId, "posts", postId, "personal_notes", userId);
    try {
      const noteSnap = await getDoc(noteRef);
      if (noteSnap.exists()) {
        return noteSnap.data().content || "";
      }
      return "";
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `groups/${groupId}/calendar_days/${dayId}/posts/${postId}/personal_notes/${userId}`);
      return "";
    }
  }

  static async getTotalPostsInGroup(groupId: string): Promise<number> {
    try {
      // Since posts are nested in days, we need to get all days first
      const daysRef = collection(db, "groups", groupId, "calendar_days");
      const daysSnap = await getDocs(daysRef);
      
      let total = 0;
      for (const dayDoc of daysSnap.docs) {
        const postsRef = collection(db, "groups", groupId, "calendar_days", dayDoc.id, "posts");
        const postsSnap = await getDocs(postsRef);
        total += postsSnap.size;
      }
      return total;
    } catch (error) {
      console.error("Error getting total posts:", error);
      return 0;
    }
  }

  static sharePostToWhatsApp(groupName: string, authorName: string, postTitle: string, postId: string) {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const origin = window.location.origin;
    const shareUrl = `${origin}/post/${postId}`; // Note: This route might need to be created or handled
    
    const message = `*🙌 NOVO CONTEÚDO NO PORTAL*\n\n` +
                    `*🏘️ Grupo:* ${groupName}\n` +
                    `*👤 Postado por:* ${authorName}\n` +
                    `*📅 Data:* ${currentDate}\n` +
                    `*📖 Título:* ${postTitle}\n\n` +
                    `🔗 *Link:* ${shareUrl}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  }
}
