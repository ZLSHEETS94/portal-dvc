import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp,
  getDoc,
  or,
  arrayUnion,
  arrayRemove,
  orderBy
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { Group, DEFAULT_GROUP_IMAGE, Post } from "../types";
import { handleFirestoreError, OperationType } from "../lib/firestoreErrorHandler";
import { CloudinaryService } from "./CloudinaryService";

export class GroupService {
  private static COLLECTION = "groups";

  static async createGroup(data: { nome: string; descricao: string; fotoFile?: File }): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    try {
      let fotoUrl = DEFAULT_GROUP_IMAGE;
      if (data.fotoFile) {
        fotoUrl = await CloudinaryService.uploadImage(data.fotoFile, "Grupos_fotos");
      }

      const newGroup = {
        nome: data.nome,
        descricao: data.descricao,
        fotoUrl: fotoUrl,
        liderId: user.uid,
        membros: [user.uid],
        status: "Ativo",
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, this.COLLECTION), newGroup);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, this.COLLECTION);
    }
  }

  static async updateGroup(groupId: string, data: { nome: string; descricao: string; status: "Ativo" | "Inativo"; fotoFile?: File }): Promise<void> {
    const path = `${this.COLLECTION}/${groupId}`;
    try {
      let updateData: any = {
        nome: data.nome,
        descricao: data.descricao,
        status: data.status,
        updatedAt: serverTimestamp()
      };

      if (data.fotoFile) {
        updateData.fotoUrl = await CloudinaryService.uploadImage(data.fotoFile, "Grupos_fotos");
      }

      await updateDoc(doc(db, this.COLLECTION, groupId), updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  }

  static async deleteGroup(groupId: string): Promise<void> {
    const path = `${this.COLLECTION}/${groupId}`;
    try {
      await deleteDoc(doc(db, this.COLLECTION, groupId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  static async joinGroup(groupId: string): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuário não autenticado");

    try {
      const groupDoc = await getDoc(doc(db, this.COLLECTION, groupId));
      if (!groupDoc.exists()) throw new Error("Grupo não encontrado");
      
      const groupData = groupDoc.data() as Group;
      if (groupData.status !== "Ativo") throw new Error("Este grupo está inativo");
      if (groupData.membros.includes(user.uid)) throw new Error("Você já faz parte deste grupo");

      // Adiciona o usuário diretamente aos membros e remove de solicitações caso existisse
      await updateDoc(doc(db, this.COLLECTION, groupId), {
        membros: arrayUnion(user.uid),
        solicitacoes: arrayRemove(user.uid)
      });

      return groupData.nome;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${this.COLLECTION}/${groupId}`);
      throw error;
    }
  }

  static async approveRequest(groupId: string, userUid: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION, groupId), {
        membros: arrayUnion(userUid),
        solicitacoes: arrayRemove(userUid)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${this.COLLECTION}/${groupId}`);
    }
  }

  static async rejectRequest(groupId: string, userUid: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION, groupId), {
        solicitacoes: arrayRemove(userUid)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${this.COLLECTION}/${groupId}`);
    }
  }

  static async toggleGroupStatus(groupId: string, currentStatus: "Ativo" | "Inativo"): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION, groupId), {
        status: currentStatus === "Ativo" ? "Inativo" : "Ativo"
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${this.COLLECTION}/${groupId}`);
    }
  }

  static async removeMember(groupId: string, memberUid: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.COLLECTION, groupId), {
        membros: arrayRemove(memberUid)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${this.COLLECTION}/${groupId}`);
    }
  }

  static async leaveGroup(groupId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;
    try {
      await updateDoc(doc(db, this.COLLECTION, groupId), {
        membros: arrayRemove(user.uid)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${this.COLLECTION}/${groupId}`);
    }
  }

  static subscribeToGroupsAsLeader(callback: (groups: Group[]) => void) {
    const user = auth.currentUser;
    if (!user) return () => {};

    const q = query(
      collection(db, this.COLLECTION),
      where("liderId", "==", user.uid)
    );

    return onSnapshot(q, (snapshot) => {
      const groups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Group[];
      callback(groups);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, this.COLLECTION);
    });
  }

  static subscribeToGroupsAsMember(callback: (groups: Group[]) => void) {
    const user = auth.currentUser;
    if (!user) return () => {};

    const q = query(
      collection(db, this.COLLECTION),
      where("membros", "array-contains", user.uid)
    );

    return onSnapshot(q, (snapshot) => {
      const groups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Group[];
      // Filter out groups where the user is the leader if we want strictly "member" view, 
      // but usually "member" includes leader too. The prompt says "Meus Grupos (Membro): ID do usuário está na lista de membros".
      callback(groups);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, this.COLLECTION);
    });
  }

  static subscribeToUserGroups(callback: (groups: Group[]) => void) {
    const user = auth.currentUser;
    if (!user) return () => {};

    const q = query(
      collection(db, this.COLLECTION),
      or(
        where("liderId", "==", user.uid),
        where("membros", "array-contains", user.uid)
      )
    );

    return onSnapshot(q, (snapshot) => {
      const groups = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Group[];
      callback(groups);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, this.COLLECTION);
    });
  }

  static subscribeToGroup(groupId: string, callback: (group: Group | null) => void) {
    return onSnapshot(doc(db, this.COLLECTION, groupId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as Group);
      } else {
        callback(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `${this.COLLECTION}/${groupId}`);
    });
  }

  static subscribeToDevocionais(groupId: string, callback: (posts: Post[]) => void) {
    const q = query(
      collection(db, this.COLLECTION, groupId, "devocionais"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      callback(posts);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `${this.COLLECTION}/${groupId}/devocionais`);
    });
  }

  static async addDevocionalDay(groupId: string, data: { titulo: string; conteudo: string }): Promise<void> {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await addDoc(collection(db, this.COLLECTION, groupId, "devocionais"), {
        ...data,
        autorId: user.uid,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${this.COLLECTION}/${groupId}/devocionais`);
    }
  }
}
