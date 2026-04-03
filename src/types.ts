export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  phoneNumber: string;
  cpf: string;
  status: "Ativo" | "Inativo";
  plan: "Free" | "Premium";
  createdAt: string;
}

export interface Group {
  id: string;
  nome: string;
  descricao: string;
  fotoUrl: string;
  liderId: string;
  membros: string[];
  status: "Ativo" | "Inativo";
  createdAt: string;
}

export interface CalendarDay {
  id: string;
  titulo: string;
  data_string: string; // YYYY-MM-DD
  hora_string: string; // HH:mm
  criado_em: string;
}

export interface Post {
  id: string;
  tipo: "audio" | "pdf" | "video" | "texto";
  autor_id: string;
  autor_nome: string;
  autor_foto: string;
  texto_principal: string;
  audio_url?: string;
  duracao?: number; // em segundos
  video_url?: string;
  is_external?: boolean;
  public_id?: string;
  pdf_url?: string;
  pdf_nome?: string;
  pdf_tamanho?: string;
  livro?: string;
  capitulo?: number;
  versiculo?: number;
  curtidas: string[]; // UIDs
  comentarios_count?: number;
  criado_em: string;
}

export interface Comment {
  id: string;
  autor_id: string;
  autor_nome: string;
  autor_foto: string;
  texto: string;
  criado_em: string;
}

export const DEFAULT_AVATAR = "https://png.pngtree.com/png-vector/20250512/ourmid/pngtree-default-avatar-profile-icon-vector-png-image_16213769.png";
export const LOGO_URL = "https://res.cloudinary.com/dm45ej3sj/image/upload/q_auto/f_auto/v1775234200/favicon_ababpj.png";
export const DEFAULT_GROUP_IMAGE = "https://res.cloudinary.com/dm45ej3sj/image/upload/q_auto/f_auto/v1775168534/group_h8mcjj.png";
