import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Group, Post, CalendarDay, DEFAULT_GROUP_IMAGE } from '../types';
import { GroupService } from '../services/GroupService';
import { DayService } from '../services/DayService';
import { PostService } from '../services/PostService';
import { auth } from '../firebase';
import MainLayout from '../components/MainLayout';
import { 
  Users, Calendar, Plus, Edit2, Trash2, Share2, 
  ChevronRight, ArrowLeft, Loader2, Play, FileText, 
  Headphones, MoreVertical, LogOut, UserMinus, 
  Settings, Sparkles, MessageSquare, Shield,
  CheckCircle2, XCircle, Copy, Check, Clock, Save,
  Heart, MessageCircle, Send, BookOpen, Mic, Video, Link as LinkIcon, Upload, List,
  Trophy, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { FirestoreService } from '../services/FirestoreService';
import { UserProfile, DEFAULT_AVATAR } from '../types';
import { BIBLE_BOOKS } from '../constants/BibleConstants';
import AudioPlayerWidget from '../components/AudioPlayerWidget';
import AudioRecordingWidget from '../components/AudioRecordingWidget';
import VideoPlayerWidget from '../components/VideoPlayerWidget';
import PdfViewerWidget from '../components/PdfViewerWidget';
import { ProgressService } from '../services/ProgressService';
import { GroupDetailsSkeleton } from '../components/Skeleton';
import { Onboarding } from '../components/Onboarding';

export default function GroupDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalGroupPosts, setTotalGroupPosts] = useState(0);
  const [completedPostIds, setCompletedPostIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'estudos' | 'membros'>('estudos');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAddDayModalOpen, setIsAddDayModalOpen] = useState(false);
  const [isAddPostModalOpen, setIsAddPostModalOpen] = useState(false);
  const [filter, setFilter] = useState<'todos' | 'texto' | 'audio' | 'video' | 'pdf'>('todos');
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Statistics Calculation
  const stats = React.useMemo(() => {
    if (!group) return { totalMembros: 0, totalEstudos: 0, totalMidia: 0 };
    const totalMembros = group.membros?.length || 0;
    const totalEstudos = posts.length;
    const totalMidia = posts.filter(p => ['audio', 'video', 'pdf'].includes(p.tipo)).length;
    return { totalMembros, totalEstudos, totalMidia };
  }, [group, posts]);

  // Filtered Posts
  const filteredPosts = React.useMemo(() => {
    if (filter === 'todos') return posts;
    return posts.filter(p => p.tipo === filter);
  }, [posts, filter]);

  // Pinned Post Logic
  const pinnedPostId = React.useMemo(() => {
    const mediaPosts = posts.filter(p => ['video', 'pdf'].includes(p.tipo));
    if (mediaPosts.length === 0) return null;
    return mediaPosts[0].id; // Most recent due to Firestore ordering
  }, [posts]);

  useEffect(() => {
    if (!id) return;

    // Check onboarding
    const hasSeenOnboarding = localStorage.getItem(`hasSeenOnboarding_${id}`);
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }

    const unsubGroup = GroupService.subscribeToGroup(id, (data) => {
      if (!data) {
        navigate('/groups');
        return;
      }
      setGroup(data);
      setLoading(false);
    });

    const unsubDays = DayService.subscribeToDays(id, (data) => {
      setDays(data);
      if (data.length > 0 && !selectedDayId) {
        setSelectedDayId(data[0].id);
      }
    });

    const unsubProgress = ProgressService.subscribeToUserProgress(id, (completedIds) => {
      setCompletedPostIds(completedIds);
    });

    PostService.getTotalPostsInGroup(id).then(total => {
      setTotalGroupPosts(total);
    });

    return () => {
      unsubGroup();
      unsubDays();
      unsubProgress();
    };
  }, [id, navigate]);

  useEffect(() => {
    if (!id || !selectedDayId) {
      setPosts([]);
      return;
    }

    const unsubPosts = PostService.subscribeToPosts(id, selectedDayId, (data) => {
      setPosts(data);
    });

    return () => unsubPosts();
  }, [id, selectedDayId]);

  const handleCloseOnboarding = () => {
    if (id) {
      localStorage.setItem(`hasSeenOnboarding_${id}`, 'true');
    }
    setShowOnboarding(false);
  };

  if (loading || !group) {
    return (
      <MainLayout>
        <GroupDetailsSkeleton />
      </MainLayout>
    );
  }

  const isLider = auth.currentUser?.uid === group.liderId;
  const selectedDay = days.find(d => d.id === selectedDayId);

  const handleToggleStatus = async () => {
    if (!isLider) return;
    await GroupService.toggleGroupStatus(group.id, group.status);
  };

  const handleLeaveGroup = async () => {
    await GroupService.leaveGroup(group.id);
    navigate('/groups');
  };

  const handleDeleteDay = async (dayId: string) => {
    if (!isLider) return;
    await DayService.deleteDay(group.id, dayId);
    if (selectedDayId === dayId) {
      setSelectedDayId(days.find(d => d.id !== dayId)?.id || null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00'); // Use noon to avoid timezone issues
    return new Intl.DateTimeFormat('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    }).format(date);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/groups')}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Voltar para Meus Grupos
        </button>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar / Left Column (4/12) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Group Info Card */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-48 relative">
                <img src={group.fotoUrl} alt={group.nome} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 inline-block",
                    group.status === 'Ativo' ? "bg-cyan-400 text-white" : "bg-slate-400 text-white"
                  )}>
                    {group.status}
                  </span>
                  <h1 className="text-2xl font-bold text-white">{group.nome}</h1>
                </div>
              </div>
              <div className="p-6">
                <p className="text-slate-500 text-sm leading-relaxed">
                  {group.descricao || 'Este grupo ainda não possui uma descrição.'}
                </p>
              </div>
            </div>

            {/* Calendar Days List */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Cronograma de Estudos
                </h3>
                {isLider && (
                  <button 
                    onClick={() => setIsAddDayModalOpen(true)}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {days.length > 0 ? (
                  days.map((day, index) => (
                    <div 
                      key={day.id}
                      onClick={() => {
                        setSelectedDayId(day.id);
                        setActiveTab('estudos');
                      }}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer group border-2",
                        selectedDayId === day.id 
                          ? "bg-indigo-50 border-indigo-100 shadow-sm" 
                          : "bg-slate-50 border-transparent hover:bg-slate-100"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-black shadow-sm transition-colors",
                          selectedDayId === day.id ? "bg-indigo-600 text-white" : "bg-white text-indigo-600"
                        )}>
                          {index + 1}
                        </div>
                        <div>
                          <p className={cn(
                            "text-sm font-bold transition-colors",
                            selectedDayId === day.id ? "text-indigo-600" : "text-slate-800"
                          )}>{day.titulo}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            {day.data_string.split('-').reverse().join('/')} • {day.hora_string}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isLider && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDay(day.id);
                            }}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                            title="Excluir Dia"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <ChevronRight className={cn(
                          "w-4 h-4 transition-all",
                          selectedDayId === day.id ? "text-indigo-600 translate-x-1" : "text-slate-300 group-hover:text-indigo-600"
                        )} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 space-y-2">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                      <Sparkles className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum dia cadastrado</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content / Right Column (8/12) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Personal Progress Card */}
            <div className="bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy className="w-24 h-24 text-cyan-400" />
              </div>
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-white font-black text-lg sm:text-xl flex items-center gap-2">
                      Seu Progresso
                      {completedPostIds.length === totalGroupPosts && totalGroupPosts > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="bg-cyan-500 text-white text-[10px] px-2 py-0.5 rounded-full"
                        >
                          MISSÃO CUMPRIDA
                        </motion.span>
                      )}
                    </h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                      {completedPostIds.length} de {totalGroupPosts} estudos concluídos
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-cyan-400 shadow-inner">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="h-3 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${totalGroupPosts > 0 ? (completedPostIds.length / totalGroupPosts) * 100 : 0}%` }}
                      className="h-full bg-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.5)]"
                    />
                  </div>
                  
                  <p className="text-slate-400 text-xs font-medium italic">
                    {totalGroupPosts === 0 ? "Aguardando novos estudos... 📖" :
                     completedPostIds.length === 0 ? "Comece seu estudo de hoje! 📖" :
                     completedPostIds.length === totalGroupPosts ? "Parabéns! Você está em dia com o grupo! 🔥" :
                     "Mantenha a constância! Você está indo bem! 🚀"}
                  </p>
                </div>
              </div>
            </div>

            {/* Group Stats Header */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-1 group hover:border-cyan-200 transition-all">
                <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-xl font-black text-cyan-500">{stats.totalMembros}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Membros</p>
              </div>
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-1 group hover:border-cyan-200 transition-all">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <p className="text-xl font-black text-cyan-500">{stats.totalEstudos}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estudos</p>
              </div>
              <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-1 group hover:border-cyan-200 transition-all">
                <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xl font-black text-cyan-500">{stats.totalMidia}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mídia</p>
              </div>
            </div>

            {/* Management Header */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => setActiveTab('estudos')}
                    className={cn(
                      "flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2",
                      activeTab === 'estudos' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" /> Estudos
                  </button>
                  <button 
                    onClick={() => setActiveTab('membros')}
                    className={cn(
                      "flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2",
                      activeTab === 'membros' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" /> Membros
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button 
                    onClick={() => setIsInviteModalOpen(true)}
                    className="p-2 sm:p-2.5 bg-cyan-50 text-cyan-600 rounded-xl sm:rounded-2xl hover:bg-cyan-100 transition-colors flex items-center gap-2 font-bold text-xs sm:text-sm"
                    title="Ver Código de Convite"
                  >
                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5" /> 
                    <span className="hidden sm:inline">Convidar</span>
                  </button>
                  
                  {isLider ? (
                    <>
                      <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                        <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">Ativo</span>
                        <button 
                          onClick={handleToggleStatus}
                          className={cn(
                            "w-10 h-5 sm:w-12 sm:h-6 rounded-full p-1 transition-all duration-300 relative",
                            group.status === 'Ativo' ? "bg-cyan-400" : "bg-slate-300"
                          )}
                        >
                          <div className={cn(
                            "w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full shadow-sm transition-all duration-300",
                            group.status === 'Ativo' ? "translate-x-5 sm:translate-x-6" : "translate-x-0"
                          )} />
                        </button>
                      </div>
                      <button 
                        onClick={() => alert('Excluir grupo em breve!')}
                        className="p-2 sm:p-2.5 bg-red-50 text-red-500 rounded-xl sm:rounded-2xl hover:bg-red-100 transition-colors"
                        title="Excluir Grupo"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={handleLeaveGroup}
                      className="p-2 sm:p-2.5 bg-red-50 text-red-500 rounded-xl sm:rounded-2xl hover:bg-red-100 transition-colors flex items-center gap-2 font-bold text-xs sm:text-sm"
                    >
                      <LogOut className="w-4 h-4 sm:w-5 sm:h-5" /> Sair
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'estudos' ? (
                <motion.div
                  key="estudos"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Category Filter Bar */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {[
                      { id: 'todos', label: 'Todos', icon: List },
                      { id: 'texto', label: 'Textos', icon: MessageSquare },
                      { id: 'audio', label: 'Áudios', icon: Headphones },
                      { id: 'video', label: 'Vídeos', icon: Video },
                      { id: 'pdf', label: 'PDFs', icon: FileText },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setFilter(opt.id as any);
                          if (navigator.vibrate) navigator.vibrate(10);
                        }}
                        className={cn(
                          "flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all border-2",
                          filter === opt.id 
                            ? "bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-100" 
                            : "bg-white border-slate-100 text-slate-500 hover:border-cyan-200"
                        )}
                      >
                        <opt.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {selectedDay ? (
                    <>
                      {/* Day Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 sm:p-6 rounded-[2rem] border border-slate-100 shadow-sm gap-4">
                        <div>
                          <h2 className="text-lg sm:text-xl font-bold text-slate-800 capitalize">{formatDate(selectedDay.data_string)}</h2>
                          <p className="text-xs sm:text-sm text-slate-500 font-medium">{selectedDay.titulo} • {selectedDay.hora_string}</p>
                        </div>
                        <button 
                          onClick={() => setIsAddPostModalOpen(true)}
                          className="w-full sm:w-auto bg-cyan-400 text-white px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base hover:bg-cyan-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-100"
                        >
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Adicionar Post
                        </button>
                      </div>

                      {/* Posts Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AnimatePresence mode="popLayout">
                          {filteredPosts.length > 0 ? (
                            filteredPosts.map((post) => (
                              <PostCard 
                                key={post.id} 
                                post={post} 
                                groupId={group.id} 
                                dayId={selectedDayId!} 
                                groupName={group.nome}
                                isLider={isLider}
                                isPinned={post.id === pinnedPostId}
                              />
                            ))
                          ) : (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="col-span-full bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center space-y-4 shadow-sm"
                            >
                              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                                <Sparkles className="w-8 h-8 text-slate-300" />
                              </div>
                              <h3 className="text-xl font-bold text-slate-800">
                                {filter === 'todos' 
                                  ? "Ainda não há conteúdo para este dia" 
                                  : `Nenhum ${filter} postado neste grupo ainda.`}
                              </h3>
                              <p className="text-slate-500 max-w-xs mx-auto">
                                {filter === 'todos' 
                                  ? "Seja o primeiro a postar e compartilhe algo com o grupo!" 
                                  : "Tente mudar o filtro ou adicione um novo conteúdo."}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </>
                  ) : (
                    <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center space-y-4 shadow-sm">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto">
                        <Calendar className="w-8 h-8 text-slate-300" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Selecione um dia</h3>
                      <p className="text-slate-500 max-w-xs mx-auto">
                        Escolha um dia no cronograma ao lado para ver os estudos e postagens.
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="membros"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"
                >
                  <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" />
                      Integrantes do Grupo ({group.membros.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {group.membros.map((uid) => (
                      <MemberListItem 
                        key={uid} 
                        uid={uid} 
                        groupId={group.id} 
                        isLider={isLider} 
                        liderId={group.liderId}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showOnboarding && <Onboarding onClose={handleCloseOnboarding} />}
        {isInviteModalOpen && (
          <InviteModal 
            groupId={group.id} 
            groupName={group.nome}
            onClose={() => setIsInviteModalOpen(false)} 
          />
        )}
        {isAddDayModalOpen && (
          <AddDayModal 
            groupId={group.id} 
            onClose={() => setIsAddDayModalOpen(false)} 
          />
        )}
        {isAddPostModalOpen && selectedDayId && (
          <AddPostModal 
            groupId={group.id} 
            dayId={selectedDayId}
            groupName={group.nome}
            onClose={() => setIsAddPostModalOpen(false)} 
          />
        )}
      </AnimatePresence>
    </MainLayout>
  );
}

function AddDayModal({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const [titulo, setTitulo] = useState('');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [hora, setHora] = useState('08:00');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await DayService.createDay(groupId, {
        titulo,
        data_string: data,
        hora_string: hora
      });
      onClose();
    } catch (err) {
      alert('Erro ao criar dia.');
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
            <h2 className="text-2xl font-bold text-slate-800">Adicionar Dia</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <XCircle className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 px-1">Título do Dia</label>
              <input
                type="text"
                required
                placeholder="Ex: Dia 1 - O Começo"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-medium"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 px-1">Data</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="date"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-medium"
                    value={data}
                    onChange={(e) => setData(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 px-1">Hora</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="time"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-medium"
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-indigo-100 text-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Salvar Dia</>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

function AddPostModal({ groupId, dayId, groupName, onClose }: { groupId: string; dayId: string; groupName: string; onClose: () => void }) {
  const [step, setStep] = useState<'select' | 'form'>('select');
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdPostId, setCreatedPostId] = useState<string | null>(null);
  const [type, setType] = useState<"audio" | "pdf" | "video" | "texto">('texto');
  const [texto, setTexto] = useState('');
  const [livro, setLivro] = useState('');
  const [capitulo, setCapitulo] = useState('');
  const [versiculo, setVersiculo] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [externalVideoUrl, setExternalVideoUrl] = useState('');
  const [videoSource, setVideoSource] = useState<'local' | 'external'>('local');
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const options = [
    { id: 'audio', label: 'Áudio', icon: Headphones, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'video', label: 'Vídeo', icon: Video, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { id: 'pdf', label: 'PDF', icon: FileText, color: 'text-rose-600', bg: 'bg-rose-50' },
    { id: 'texto', label: 'Texto', icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ] as const;

  const handleSelect = (selectedType: typeof type) => {
    setType(selectedType);
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Iniciando submissão do post...");
    setLoading(true);
    try {
      let audioUrl = '';
      if (type === 'audio' && audioBlob) {
        console.log("Fazendo upload do áudio para Cloudinary...");
        audioUrl = await PostService.uploadAudio(audioBlob);
        console.log("Upload concluído. URL:", audioUrl);
      }

      let videoUrl = externalVideoUrl;
      let publicId = '';
      let isExternal = videoSource === 'external';

      if (type === 'video' && videoSource === 'local' && videoFile) {
        console.log("Fazendo upload do vídeo para Cloudinary...");
        const uploadResult = await PostService.uploadVideo(videoFile);
        videoUrl = uploadResult.url;
        publicId = uploadResult.public_id;
        isExternal = false;
        console.log("Upload de vídeo concluído. URL:", videoUrl);
      }

      let pdfUrl = '';
      let pdfName = '';
      let pdfSize = '';

      if (type === 'pdf' && pdfFile) {
        console.log("Fazendo upload do PDF para Cloudinary...");
        pdfUrl = await PostService.uploadPdf(pdfFile);
        pdfName = pdfFile.name;
        pdfSize = (pdfFile.size / (1024 * 1024)).toFixed(2) + " MB";
        console.log("Upload de PDF concluído. URL:", pdfUrl);
      }

      console.log("Criando documento no Firestore...");
      const postData: any = {
        tipo: type,
        texto_principal: texto,
        is_external: isExternal,
      };

      if (audioUrl) postData.audio_url = audioUrl;
      if (audioDuration) postData.duracao = audioDuration;
      if (videoUrl) postData.video_url = videoUrl;
      if (publicId) postData.public_id = publicId;
      if (pdfUrl) postData.pdf_url = pdfUrl;
      if (pdfName) postData.pdf_nome = pdfName;
      if (pdfSize) postData.pdf_tamanho = pdfSize;
      if (livro) postData.livro = livro;
      if (capitulo.trim() !== '') postData.capitulo = parseInt(capitulo);
      if (versiculo.trim() !== '') postData.versiculo = parseInt(versiculo);

      const newPostId = await PostService.addPost(groupId, dayId, postData);
      console.log("Post criado com sucesso!", newPostId);
      setCreatedPostId(newPostId);
      setShowSuccess(true);
    } catch (err) {
      console.error("Erro detalhado na submissão:", err);
      alert('Erro ao criar post. Verifique o console para mais detalhes.');
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
        <div className="p-8 space-y-6">
          <AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[110] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center space-y-6"
              >
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Postando sua reflexão</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Aguarde um momento...</p>
                </div>
                
                {/* Progress indicator simulation */}
                <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3, ease: "easeInOut" }}
                    className="h-full bg-indigo-600"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">
              {step === 'select' ? 'Adicionar Post' : 'Nova Reflexão'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <XCircle className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          {showSuccess ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 text-center space-y-6"
            >
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                >
                  <Check className="w-10 h-10 text-emerald-500" />
                </motion.div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-800">Publicado!</h2>
                <p className="text-slate-500 text-sm">Sua reflexão foi compartilhada com o grupo com sucesso.</p>
              </div>
              
              <div className="space-y-3 pt-4">
                <button
                  onClick={() => {
                    if (createdPostId) {
                      const authorName = auth.currentUser?.displayName || "Membro";
                      let postTitle = texto.substring(0, 30) + (texto.length > 30 ? "..." : "");
                      if (!postTitle) {
                        if (type === 'audio') postTitle = "Novo Áudio";
                        else if (type === 'video') postTitle = "Novo Vídeo";
                        else if (type === 'pdf') postTitle = "Novo PDF";
                        else postTitle = "Nova Reflexão";
                      }
                      PostService.sharePostToWhatsApp(groupName, authorName, postTitle, createdPostId);
                    }
                  }}
                  className="w-full bg-[#25D366] text-white font-bold py-3 rounded-2xl hover:bg-[#128C7E] transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-100 text-sm"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.393 0 12.03c0 2.123.554 4.197 1.608 6.06L0 24l6.117-1.605a11.79 11.79 0 005.925 1.588h.005c6.631 0 12.026-5.39 12.03-12.03a11.85 11.85 0 00-3.534-8.514z"/>
                  </svg>
                  Avisar Grupo no WhatsApp
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          ) : step === 'select' ? (
            <>
              <p className="text-slate-500 text-sm">Escolha o tipo de conteúdo que deseja compartilhar com o grupo.</p>
              <div className="grid grid-cols-2 gap-4">
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSelect(opt.id)}
                    className="flex flex-col items-center gap-3 p-6 bg-white border border-slate-100 rounded-3xl hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all group"
                  >
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110", opt.bg)}>
                      <opt.icon className={cn("w-6 h-6", opt.color)} />
                    </div>
                    <span className="font-bold text-slate-700">{opt.label}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-6">
              {type === 'audio' && !audioBlob ? (
                <AudioRecordingWidget 
                  onAudioReady={(blob, duration) => {
                    setAudioBlob(blob);
                    setAudioDuration(duration);
                  }}
                  onCancel={() => setStep('select')}
                />
              ) : type === 'video' && !videoFile && !externalVideoUrl ? (
                <div className="space-y-6">
                  <div className="flex p-1 bg-slate-100 rounded-2xl">
                    <button
                      onClick={() => setVideoSource('local')}
                      className={cn(
                        "flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                        videoSource === 'local' ? "bg-white text-cyan-600 shadow-sm" : "text-slate-500"
                      )}
                    >
                      <Upload className="w-4 h-4" /> Local
                    </button>
                    <button
                      onClick={() => setVideoSource('external')}
                      className={cn(
                        "flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2",
                        videoSource === 'external' ? "bg-white text-cyan-600 shadow-sm" : "text-slate-500"
                      )}
                    >
                      <LinkIcon className="w-4 h-4" /> Link Externo
                    </button>
                  </div>

                  {videoSource === 'local' ? (
                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50 space-y-4">
                      <div className="w-16 h-16 bg-cyan-100 text-cyan-600 rounded-3xl flex items-center justify-center">
                        <Video className="w-8 h-8" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-700">Selecione um vídeo</p>
                        <p className="text-xs text-slate-400 font-medium">MP4, MOV ou WebM</p>
                      </div>
                      <label className="px-6 py-3 bg-cyan-500 text-white rounded-full text-sm font-bold cursor-pointer hover:bg-cyan-600 transition-all shadow-lg shadow-cyan-100">
                        Escolher Arquivo
                        <input 
                          type="file" 
                          accept="video/*" 
                          className="hidden" 
                          onChange={(e) => setVideoFile(e.target.files?.[0] || null)} 
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600 px-1">URL do Vídeo (YouTube/Vimeo)</label>
                        <input
                          type="url"
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-600 outline-none transition-all font-medium"
                          value={externalVideoUrl}
                          onChange={(e) => setExternalVideoUrl(e.target.value)}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                        Insira o link direto do YouTube ou Vimeo
                      </p>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => setStep('select')}
                    className="w-full py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all text-sm"
                  >
                    Voltar
                  </button>
                </div>
              ) : type === 'pdf' && !pdfFile ? (
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50 space-y-4">
                    <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-slate-700">Selecione um documento PDF</p>
                      <p className="text-xs text-slate-400 font-medium">Tamanho máximo recomendado: 10MB</p>
                    </div>
                    <label className="px-6 py-3 bg-rose-500 text-white rounded-full text-sm font-bold cursor-pointer hover:bg-rose-600 transition-all shadow-lg shadow-rose-100">
                      Escolher PDF
                      <input 
                        type="file" 
                        accept="application/pdf" 
                        className="hidden" 
                        onChange={(e) => setPdfFile(e.target.files?.[0] || null)} 
                      />
                    </label>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setStep('select')}
                    className="w-full py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all text-sm"
                  >
                    Voltar
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {type === 'audio' && audioBlob && (
                    <div className="p-4 bg-cyan-50 rounded-3xl border border-cyan-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-500 text-white rounded-full flex items-center justify-center">
                          <Mic className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-cyan-700">Áudio Gravado</p>
                          <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">Pronto para postar</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setAudioBlob(null)}
                        className="p-2 text-cyan-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {type === 'video' && (videoFile || externalVideoUrl) && (
                    <div className="p-4 bg-cyan-50 rounded-3xl border border-cyan-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-500 text-white rounded-full flex items-center justify-center">
                          <Video className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-cyan-700">
                            {videoSource === 'local' ? 'Vídeo Selecionado' : 'Link Externo'}
                          </p>
                          <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest truncate max-w-[150px]">
                            {videoSource === 'local' ? videoFile?.name : externalVideoUrl}
                          </p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setVideoFile(null);
                          setExternalVideoUrl('');
                        }}
                        className="p-2 text-cyan-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {type === 'pdf' && pdfFile && (
                    <div className="p-4 bg-rose-50 rounded-3xl border border-rose-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-rose-700">PDF Selecionado</p>
                          <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest truncate max-w-[150px]">
                            {pdfFile.name}
                          </p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setPdfFile(null)}
                        className="p-2 text-rose-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 px-1">
                      {type === 'audio' ? 'Comentário (Opcional)' : 'Sua Reflexão'}
                    </label>
                    <textarea
                      required={type === 'texto'}
                      rows={4}
                      placeholder={type === 'audio' ? "Adicione uma legenda..." : "O que você aprendeu hoje?"}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-medium resize-none"
                      value={texto}
                      onChange={(e) => setTexto(e.target.value)}
                    />
                  </div>

                  <div className="space-y-4 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> Referência Bíblica (Opcional)
                    </h3>
                    
                    <div className="space-y-3">
                      <select
                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-medium"
                        value={livro}
                        onChange={(e) => setLivro(e.target.value)}
                      >
                        <option value="">Selecione o Livro</option>
                        {BIBLE_BOOKS.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          placeholder="Capítulo"
                          className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-medium"
                          value={capitulo}
                          onChange={(e) => setCapitulo(e.target.value)}
                        />
                        <input
                          type="number"
                          placeholder="Versículo"
                          className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-medium"
                          value={versiculo}
                          onChange={(e) => setVersiculo(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep('select')}
                      className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all text-sm"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-[2] bg-indigo-600 text-white font-bold py-3 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-indigo-100 text-sm"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Publicar</>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function InviteModal({ groupId, groupName, onClose }: { groupId: string; groupName: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(groupId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        <div className="p-8 space-y-6 text-center">
          <div className="w-20 h-20 bg-cyan-50 rounded-3xl flex items-center justify-center mx-auto">
            <Share2 className="w-10 h-10 text-cyan-600" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">Convidar para o Grupo</h2>
            <p className="text-slate-500 text-sm">
              Compartilhe este código com as pessoas que você deseja convidar para o grupo <span className="font-bold text-indigo-600">{groupName}</span>.
            </p>
          </div>

          <div className="space-y-4">
            <div className="w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 font-mono text-lg font-bold text-slate-700 tracking-wider">
              {groupId}
            </div>
            <button
              onClick={handleCopy}
              className={cn(
                "w-full py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 font-bold text-sm",
                copied ? "bg-emerald-500 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"
              )}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado!' : 'Copiar Código'}
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function PostCard({ post, groupId, dayId, groupName, isLider, isPinned }: { post: Post; groupId: string; dayId: string; groupName: string; isLider: boolean; isPinned?: boolean; key?: string }) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const userId = auth.currentUser?.uid;
  const isLiked = userId ? post.curtidas?.includes(userId) : false;
  const isAuthor = userId === post.autor_id;

  const handleLike = async () => {
    if (!userId) return;
    await PostService.toggleLike(groupId, dayId, post.id, userId);
  };

  const handleDelete = async () => {
    console.log("Tentando excluir post:", post.id, "isAuthor:", isAuthor, "isLider:", isLider);
    if (!isAuthor && !isLider) {
      console.warn("Sem permissão para excluir post");
      return;
    }
    try {
      await PostService.deletePost(groupId, dayId, post.id);
      console.log("Post excluído com sucesso");
    } catch (err) {
      console.error("Erro ao excluir post:", err);
    }
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'agora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `há ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `há ${hours}h`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <>
      <motion.div 
        layout
        className={cn(
          "bg-white rounded-[2.5rem] border shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 overflow-hidden relative",
          isPinned ? "border-cyan-400 ring-4 ring-cyan-500/5" : "border-slate-100"
        )}
      >
        {isPinned && (
          <div className="absolute top-4 right-14 z-10">
            <div className="bg-cyan-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-cyan-200 flex items-center gap-1 animate-pulse">
              <Sparkles className="w-3 h-3" /> DESTAQUE
            </div>
          </div>
        )}
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-indigo-50">
              <img src={post.autor_foto || DEFAULT_AVATAR} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">{post.autor_nome}</h4>
              <p className="text-[10px] text-slate-400 font-medium">{timeAgo(post.criado_em)}</p>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-slate-300 hover:text-slate-600 transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 py-2"
                  >
                    {(isAuthor || isLider) && (
                      <button
                        onClick={() => {
                          handleDelete();
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir Post
                      </button>
                    )}
                    <button
                      className="w-full px-4 py-3 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      Denunciar
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Body */}
        <div 
          className="px-6 pb-4 space-y-4 cursor-pointer"
          onClick={() => navigate(`/groups/${groupId}/days/${dayId}/posts/${post.id}`)}
        >
          {post.tipo === 'audio' && post.audio_url && (
            <AudioPlayerWidget 
              url={post.audio_url} 
              duration={post.duracao} 
              className="mt-2"
            />
          )}

          {post.tipo === 'video' && post.video_url && (
            <VideoPlayerWidget 
              url={post.video_url} 
              isExternal={post.is_external}
              className="mt-2"
            />
          )}

          {post.tipo === 'pdf' && post.pdf_url && (
            <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between group hover:border-cyan-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white text-cyan-500 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 line-clamp-1">{post.pdf_nome || 'Documento PDF'}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{post.pdf_tamanho || 'Visualizar'}</p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          )}

          {post.texto_principal && (
            <div className="relative">
              <p className={cn(
                "text-slate-700 leading-relaxed whitespace-pre-wrap",
                !isExpanded && post.texto_principal.length > 150 && "line-clamp-3"
              )}>
                {post.texto_principal}
              </p>
              {!isExpanded && post.texto_principal.length > 150 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(true);
                  }}
                  className="text-indigo-600 font-bold text-xs mt-1 hover:underline"
                >
                  mais...
                </button>
              )}
            </div>
          )}

          {post.livro && post.capitulo !== undefined && post.versiculo !== undefined && (
            <div className="space-y-3">
              <p className="text-cyan-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> Referência Bíblica
              </p>
              
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-inner relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <BookOpen className="w-16 h-16 text-indigo-600" />
                </div>
                
                <div className="space-y-1 relative z-10">
                  <h5 className="text-indigo-600 font-black text-sm">
                    {post.livro} {post.capitulo}:{post.versiculo}
                  </h5>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    Referência de Estudo
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={handleLike}
              className="flex items-center gap-2 group"
            >
              <Heart className={cn(
                "w-6 h-6 transition-all group-active:scale-125",
                isLiked ? "fill-cyan-400 text-cyan-400" : "text-slate-300 hover:text-slate-400"
              )} />
              <span className="text-xs font-bold text-slate-500">{post.curtidas?.length || 0}</span>
            </button>
            <button 
              onClick={() => navigate(`/groups/${groupId}/days/${dayId}/posts/${post.id}`)}
              className="flex items-center gap-2 group"
            >
              <MessageCircle className="w-6 h-6 text-slate-300 group-hover:text-slate-400 transition-colors" />
              <span className="text-xs font-bold text-slate-500">{post.comentarios_count || 0}</span>
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                const authorName = post.autor_nome || "Membro";
                let postTitle = post.texto_principal?.substring(0, 30) + (post.texto_principal && post.texto_principal.length > 30 ? "..." : "");
                if (!postTitle) {
                  if (post.tipo === 'audio') postTitle = "Novo Áudio";
                  else if (post.tipo === 'video') postTitle = "Novo Vídeo";
                  else if (post.tipo === 'pdf') postTitle = "Novo PDF";
                  else postTitle = "Nova Reflexão";
                }
                PostService.sharePostToWhatsApp(groupName, authorName, postTitle, post.id);
              }}
              className="flex items-center gap-2 group"
              title="Compartilhar no WhatsApp"
            >
              <svg className="w-6 h-6 text-[#25D366] fill-current group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.393 0 12.03c0 2.123.554 4.197 1.608 6.06L0 24l6.117-1.605a11.79 11.79 0 005.925 1.588h.005c6.631 0 12.026-5.39 12.03-12.03a11.85 11.85 0 00-3.534-8.514z"/>
              </svg>
            </button>
          </div>
          <button 
            onClick={() => navigate(`/groups/${groupId}/days/${dayId}/posts/${post.id}`)}
            className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </>
  );
}

function MemberListItem({ uid, groupId, isLider, liderId }: { uid: string; groupId: string; isLider: boolean; liderId: string; key?: string }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isSelf = auth.currentUser?.uid === uid;
  const isMemberLider = uid === liderId;

  useEffect(() => {
    FirestoreService.getUserProfile(uid).then(p => {
      setProfile(p);
      setLoading(false);
    });
  }, [uid]);

  const handleRemove = async () => {
    await GroupService.removeMember(groupId, uid);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-between p-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100" />
          <div className="space-y-2">
            <div className="w-24 h-4 bg-slate-100 rounded" />
            <div className="w-16 h-3 bg-slate-50 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-indigo-50 border-2 border-white shadow-sm">
          <img 
            src={profile?.photoURL || DEFAULT_AVATAR} 
            alt={profile?.displayName} 
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <p className="font-bold text-slate-800 flex items-center gap-2">
            {profile?.displayName || 'Usuário sem nome'}
            {isMemberLider && (
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full text-[8px] font-black uppercase tracking-widest">Líder</span>
            )}
            {isSelf && (
              <span className="px-2 py-0.5 bg-cyan-100 text-cyan-600 rounded-full text-[8px] font-black uppercase tracking-widest">Você</span>
            )}
          </p>
          <p className="text-xs text-slate-400">
            {isMemberLider ? 'Fundador do grupo' : 'Integrante do círculo'}
          </p>
        </div>
      </div>

      {isLider && !isMemberLider && (
        <button 
          onClick={handleRemove}
          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          title="Remover do Grupo"
        >
          <UserMinus className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

