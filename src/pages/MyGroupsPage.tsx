import React, { useState, useEffect, useRef } from 'react';
import { Group, DEFAULT_GROUP_IMAGE, UserProfile, DEFAULT_AVATAR } from '../types';
import { GroupService } from '../services/GroupService';
import { FirestoreService } from '../services/FirestoreService';
import { auth } from '../firebase';
import MainLayout from '../components/MainLayout';
import { 
  Plus, Search, Filter, MoreVertical, Edit2, Trash2, 
  Users, Shield, Loader2, Camera, X, AlertCircle, Save, Key,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function MyGroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Inativo'>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = GroupService.subscribeToUserGroups((data) => {
      setGroups(data);
      setLoading(false);
    }, (error) => {
      console.error("Error subscribing to user groups:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredGroups = groups.filter(g => {
    const matchesSearch = g.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Todos' || g.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(id);
      await GroupService.deleteGroup(id);
    } catch (err) {
      alert('Erro ao excluir grupo.');
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Meus Devocionais</h1>
            <p className="text-slate-500">Gerencie seus círculos de estudo e devocionais</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="flex-1 md:flex-none bg-white text-indigo-600 border-2 border-indigo-100 px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm hover:bg-indigo-50 transition-all flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap shadow-sm"
            >
              <Key className="w-4 h-4 sm:w-5 sm:h-5" /> Entrar com Código
            </button>
            <button
              onClick={() => {
                setEditingGroup(null);
                setIsModalOpen(true);
              }}
              className="bg-indigo-600 text-white flex-1 md:flex-none px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-lg shadow-indigo-100 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Novo Grupo
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-bold text-xs sm:text-sm text-slate-700 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1.5 rounded-xl sm:rounded-2xl shadow-sm w-full">
            <div className="flex items-center gap-2 px-2 text-slate-400">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="flex-1 flex gap-1">
              {(['Todos', 'Ativo', 'Inativo'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "flex-1 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all",
                    statusFilter === status 
                      ? "bg-indigo-50 text-indigo-600" 
                      : "text-slate-400 hover:bg-slate-50"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white h-64 rounded-[2rem] animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredGroups.map((group) => (
                <GroupCard 
                  key={group.id} 
                  group={group} 
                  onEdit={() => {
                    setEditingGroup(group);
                    setIsModalOpen(true);
                  }}
                  onDelete={() => handleDelete(group.id)}
                  isDeleting={isDeleting === group.id}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Nenhum grupo encontrado</h3>
            <p className="text-slate-500 max-w-xs mx-auto">
              Você ainda não participa de nenhum grupo. Que tal criar um agora?
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isModalOpen && (
          <GroupModal 
            group={editingGroup} 
            onClose={() => setIsModalOpen(false)} 
          />
        )}
        {isJoinModalOpen && (
          <JoinModal 
            onClose={() => setIsJoinModalOpen(false)} 
          />
        )}
      </AnimatePresence>
    </MainLayout>
  );
}

function GroupCard({ group, onEdit, onDelete, isDeleting }: { group: Group; onEdit: () => void; onDelete: () => void | Promise<void>; isDeleting: boolean; key?: string }) {
  const navigate = useNavigate();
  const isLider = auth.currentUser?.uid === group.liderId;
  const [memberProfiles, setMemberProfiles] = useState<UserProfile[]>([]);

  useEffect(() => {
    const fetchProfiles = async () => {
      if (group.membros.length > 0) {
        const profiles = await FirestoreService.getUsersProfiles(group.membros);
        setMemberProfiles(profiles);
      }
    };
    fetchProfiles();
  }, [group.membros]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={() => navigate(`/groups/${group.id}`)}
      className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group overflow-hidden cursor-pointer"
    >
      <div className="h-32 bg-slate-100 relative overflow-hidden">
        <img 
          src={group.fotoUrl} 
          alt={group.nome} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4 flex gap-2">
          <span className={cn(
            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
            group.status === 'Ativo' ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"
          )}>
            {group.status}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-800 line-clamp-1">{group.nome}</h3>
            <p className="text-slate-500 text-sm line-clamp-2 mt-1 min-h-[2.5rem]">
              {group.descricao || 'Sem descrição definida.'}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {memberProfiles.slice(0, 3).map((profile, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                  <img 
                    src={profile.photoURL || DEFAULT_AVATAR} 
                    alt={profile.displayName} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
              {group.membros.length > 3 && (
                <div className="w-7 h-7 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-bold text-indigo-600 shadow-sm">
                  +{group.membros.length - 3}
                </div>
              )}
            </div>
            <span className="text-xs font-bold text-slate-400">{group.membros.length} membros</span>
          </div>

          {isLider && (
            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <button 
                onClick={onEdit}
                className="p-2 hover:bg-indigo-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors"
                title="Editar"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button 
                onClick={onDelete}
                disabled={isDeleting}
                className="p-2 hover:bg-red-50 rounded-xl text-slate-400 hover:text-red-600 transition-colors"
                title="Excluir"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function JoinModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const groupName = await GroupService.joinGroup(code.trim());
      alert(`Bem-vindo ao grupo ${groupName}!`);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao entrar no grupo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Entrar em Grupo</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <p className="text-slate-500 text-sm">
            Insira o código de convite (ID do grupo) para participar de um círculo de estudo.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 px-1">Código de Convite</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Cole o código aqui..."
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-mono text-sm"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-medium">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-indigo-100"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar no Grupo'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function GroupModal({ group, onClose }: { group: Group | null; onClose: () => void }) {
  const [nome, setNome] = useState(group?.nome || '');
  const [descricao, setDescricao] = useState(group?.descricao || '');
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>(group?.status || 'Ativo');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(group?.fotoUrl || DEFAULT_GROUP_IMAGE);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (group) {
        await GroupService.updateGroup(group.id, { nome, descricao, status, fotoFile: fotoFile || undefined });
      } else {
        await GroupService.createGroup({ nome, descricao, fotoFile: fotoFile || undefined });
      }
      onClose();
    } catch (err) {
      alert('Erro ao salvar grupo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">
              {group ? 'Editar Grupo' : 'Novo Grupo'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-3xl overflow-hidden bg-slate-100 border-4 border-white shadow-lg">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-indigo-600 p-3 rounded-2xl text-white shadow-lg hover:bg-indigo-700 transition-all"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*" 
                />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Foto do Grupo</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 px-1">Nome do Grupo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Devocional de Segunda"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-medium"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 px-1">Descrição (Opcional)</label>
                <textarea
                  rows={3}
                  placeholder="Sobre o que é este grupo?"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-medium resize-none"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>

              {group && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 px-1">Status</label>
                  <div className="flex gap-2">
                    {(['Ativo', 'Inativo'] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={cn(
                          "flex-1 py-3 rounded-xl font-bold transition-all border",
                          status === s 
                            ? "bg-indigo-50 border-indigo-200 text-indigo-600" 
                            : "bg-white border-slate-200 text-slate-400"
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-indigo-100"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> {group ? 'Salvar Alterações' : 'Criar Grupo'}</>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
