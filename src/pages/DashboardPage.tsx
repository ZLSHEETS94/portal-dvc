import React, { useState, useEffect } from 'react';
import MainLayout from '../components/MainLayout';
import { 
  Construction, Sparkles, ArrowRight, BookOpen, Star, 
  Users, LayoutDashboard, Settings, Plus, LogOut, 
  ChevronRight, CheckCircle2, Clock, Trophy, TrendingUp,
  UserPlus, MessageSquare, Edit3, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../firebase';
import { GroupService } from '../services/GroupService';
import { PostService } from '../services/PostService';
import { ProgressService } from '../services/ProgressService';
import { UserProfile, Group, Post } from '../types';
import { cn } from '../lib/utils';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface MemberWithProgress {
  profile: UserProfile;
  progress: number;
}

export default function DashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'estudos' | 'gestao') || 'estudos';
  
  const setActiveTab = (tab: 'estudos' | 'gestao') => {
    setSearchParams({ tab });
  };

  const [memberGroups, setMemberGroups] = useState<Group[]>([]);
  const [leaderGroups, setLeaderGroups] = useState<Group[]>([]);
  const [selectedLeaderGroupId, setSelectedLeaderGroupId] = useState<string | null>(null);
  const [uncompletedPosts, setUncompletedPosts] = useState<any[]>([]);
  const [groupProgress, setGroupProgress] = useState<Record<string, number>>({});
  const [groupTotalPosts, setGroupTotalPosts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [pendingRequests, setPendingRequests] = useState<UserProfile[]>([]);
  const [groupMembers, setGroupMembers] = useState<MemberWithProgress[]>([]);
  const [loadingGestao, setLoadingGestao] = useState(false);
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const navigate = useNavigate();

  const [user, setUser] = useState<any>(auth.currentUser);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user || authLoading) {
      if (!authLoading) setLoading(false);
      return;
    }

    const unsubMember = GroupService.subscribeToGroupsAsMember((groups) => {
      setMemberGroups(groups);
      setLoading(false);
    });

    const unsubLeader = GroupService.subscribeToGroupsAsLeader((groups) => {
      setLeaderGroups(groups);
      if (groups.length > 0 && !selectedLeaderGroupId) {
        setSelectedLeaderGroupId(groups[0].id);
      }
    });

    // Fetch uncompleted posts
    PostService.getUncompletedPosts(user.uid).then(setUncompletedPosts);

    return () => {
      unsubMember();
      unsubLeader();
    };
  }, [user]);

  // Fetch progress for each member group
  useEffect(() => {
    if (memberGroups.length === 0 || !user) return;

    memberGroups.forEach(async (group) => {
      // Get total posts in group
      const total = await PostService.getTotalPostsInGroup(group.id);
      setGroupTotalPosts(prev => ({ ...prev, [group.id]: total }));

      // Get user progress in group
      const q = query(
        collection(db, "user_progress"),
        where("userId", "==", user.uid),
        where("groupId", "==", group.id)
      );
      const snap = await getDocs(q);
      const completedCount = snap.size;
      
      const percentage = total > 0 ? (completedCount / total) * 100 : 0;
      setGroupProgress(prev => ({ ...prev, [group.id]: percentage }));
    });
  }, [memberGroups, user]);

  // Fetch data for Gestão tab
  useEffect(() => {
    if (activeTab !== 'gestao' || !selectedLeaderGroupId || !user) return;

    const fetchGestaoData = async () => {
      setLoadingGestao(true);
      try {
        const groupDoc = await getDoc(doc(db, "groups", selectedLeaderGroupId));
        if (!groupDoc.exists()) return;
        const groupData = groupDoc.data() as Group;

        // Fetch pending requests profiles
        if (groupData.solicitacoes && groupData.solicitacoes.length > 0) {
          const profiles = await Promise.all(
            groupData.solicitacoes.map(async (uid) => {
              const uDoc = await getDoc(doc(db, "users", uid));
              return uDoc.exists() ? (uDoc.data() as UserProfile) : null;
            })
          );
          setPendingRequests(profiles.filter(p => p !== null) as UserProfile[]);
        } else {
          setPendingRequests([]);
        }

        // Fetch members profiles and progress
        const totalPosts = await PostService.getTotalPostsInGroup(selectedLeaderGroupId);
        const membersData = await Promise.all(
          groupData.membros.map(async (uid) => {
            const uDoc = await getDoc(doc(db, "users", uid));
            if (!uDoc.exists()) return null;
            const profile = uDoc.data() as UserProfile;

            const q = query(
              collection(db, "user_progress"),
              where("userId", "==", uid),
              where("groupId", "==", selectedLeaderGroupId)
            );
            const snap = await getDocs(q);
            const progress = totalPosts > 0 ? (snap.size / totalPosts) * 100 : 0;

            return { profile, progress };
          })
        );
        setGroupMembers(membersData.filter(m => m !== null) as MemberWithProgress[]);
      } catch (error) {
        console.error("Error fetching gestao data:", error);
      } finally {
        setLoadingGestao(false);
      }
    };

    fetchGestaoData();
  }, [activeTab, selectedLeaderGroupId]);

  const handleApprove = async (userUid: string) => {
    if (!selectedLeaderGroupId) return;
    await GroupService.approveRequest(selectedLeaderGroupId, userUid);
    setPendingRequests(prev => prev.filter(p => p.uid !== userUid));
    // Refresh members list
    const uDoc = await getDoc(doc(db, "users", userUid));
    if (uDoc.exists()) {
      setGroupMembers(prev => [...prev, { profile: uDoc.data() as UserProfile, progress: 0 }]);
    }
  };

  const handleReject = async (userUid: string) => {
    if (!selectedLeaderGroupId) return;
    await GroupService.rejectRequest(selectedLeaderGroupId, userUid);
    setPendingRequests(prev => prev.filter(p => p.uid !== userUid));
  };

  const overallProgress = React.useMemo(() => {
    const values = Object.values(groupProgress) as number[];
    if (values.length === 0) return 0;
    return values.reduce((a: number, b: number) => a + b, 0) / values.length;
  }, [groupProgress]);

  const filteredMemberGroups = React.useMemo(() => {
    if (!showOnlyPending) return memberGroups;
    return memberGroups.filter(group => {
      const progress = groupProgress[group.id] || 0;
      return progress < 100;
    });
  }, [memberGroups, groupProgress, showOnlyPending]);

  const selectedLeaderGroup = leaderGroups.find(g => g.id === selectedLeaderGroupId);

  if (authLoading || loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
          <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center">
            <Users className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-800">Bem-vindo!</h3>
            <p className="text-slate-500 max-w-sm mx-auto font-medium">
              Faça login para acessar seus estudos e grupos.
            </p>
          </div>
          <button 
            onClick={() => navigate('/login')}
            className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Fazer Login
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800">Dashboard</h1>
            <p className="text-slate-500 font-medium">Bem-vindo de volta, {user?.displayName?.split(' ')[0] || 'Discípulo'}!</p>
          </div>

          {leaderGroups.length > 0 && (
            <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 self-start md:self-auto">
              <button
                onClick={() => setActiveTab('estudos')}
                className={cn(
                  "px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
                  activeTab === 'estudos' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <BookOpen className="w-4 h-4" /> Meus Estudos
              </button>
              <button
                onClick={() => setActiveTab('gestao')}
                className={cn(
                  "px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
                  activeTab === 'gestao' ? "bg-white text-cyan-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <LayoutDashboard className="w-4 h-4" /> Gestão
              </button>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'estudos' ? (
            <motion.div
              key="estudos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Overall Progress Highlight */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl group">
                  <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Trophy className="w-32 h-32 text-cyan-400" />
                  </div>
                  <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 bg-cyan-500/20 text-cyan-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                        <TrendingUp className="w-4 h-4" /> Progresso Geral
                      </div>
                      <h2 className="text-4xl font-black">Você está evoluindo!</h2>
                      <p className="text-slate-400 font-medium max-w-sm">
                        Sua média de conclusão em todos os grupos é de {overallProgress.toFixed(0)}%. Mantenha o foco na Palavra!
                      </p>
                    </div>
                    <div className="flex flex-col items-center md:items-end space-y-4">
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="64"
                            cy="64"
                            r="58"
                            stroke="currentColor"
                            strokeWidth="10"
                            fill="transparent"
                            className="text-slate-800"
                          />
                          <motion.circle
                            cx="64"
                            cy="64"
                            r="58"
                            stroke="currentColor"
                            strokeWidth="10"
                            fill="transparent"
                            strokeDasharray={364.4}
                            initial={{ strokeDashoffset: 364.4 }}
                            animate={{ strokeDashoffset: 364.4 - (364.4 * overallProgress) / 100 }}
                            className="text-cyan-400"
                          />
                        </svg>
                        <span className="absolute text-2xl font-black">{overallProgress.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 flex flex-col justify-between group">
                  <div className="space-y-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-indigo-200" />
                    </div>
                    <h3 className="text-xl font-bold">Dica do Dia</h3>
                    <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                      "Lâmpada para os meus pés é tua palavra e luz, para o meu caminho." - Salmos 119:105
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate('/groups')}
                    className="mt-6 w-full bg-white text-indigo-600 py-3 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                  >
                    Ver Biblioteca <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Continue Studying Section */}
              {uncompletedPosts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" /> Continuar Estudando
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uncompletedPosts.map((post) => (
                      <div 
                        key={post.id}
                        onClick={() => navigate(`/groups/${post.groupId}/days/${post.dayId}/posts/${post.id}`)}
                        className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendente</span>
                        </div>
                        <h4 className="font-bold text-slate-800 mb-1 line-clamp-1">{post.texto_principal || 'Estudo sem título'}</h4>
                        <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-4">
                          {post.livro ? `${post.livro} ${post.capitulo}:${post.versiculo}` : 'Clique para ler o conteúdo completo.'}
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                          <span className="text-[10px] font-bold text-indigo-600 uppercase">Ver Estudo</span>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* My Groups List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-cyan-600" /> Meus Grupos
                  </h3>
                  
                  {memberGroups.length > 0 && (
                    <button 
                      onClick={() => setShowOnlyPending(!showOnlyPending)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border-2",
                        showOnlyPending 
                          ? "bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-100" 
                          : "bg-white border-slate-100 text-slate-500 hover:border-cyan-200"
                      )}
                    >
                      <Filter className="w-3.5 h-3.5" />
                      {showOnlyPending ? "Mostrando Pendentes" : "Ver apenas Pendentes"}
                    </button>
                  )}
                </div>

                {filteredMemberGroups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredMemberGroups.map((group) => (
                      <div 
                        key={group.id}
                        className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-indigo-50 transition-all"
                      >
                        <div className="h-32 relative">
                          <img src={group.fotoUrl} alt={group.nome} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-4 left-6">
                            <h4 className="text-white font-bold text-lg">{group.nome}</h4>
                          </div>
                        </div>
                        <div className="p-6 space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                              <span className="text-slate-400">Seu Progresso</span>
                              <span className="text-cyan-500">{groupProgress[group.id]?.toFixed(0) || 0}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${groupProgress[group.id] || 0}%` }}
                                className="h-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <button 
                              onClick={() => navigate(`/groups/${group.id}`)}
                              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2"
                            >
                              Entrar no Grupo <ArrowRight className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={async () => {
                                if (window.confirm(`Deseja realmente sair do grupo ${group.nome}?`)) {
                                  await GroupService.leaveGroup(group.id);
                                }
                              }}
                              className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              title="Sair do Grupo"
                            >
                              <LogOut className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center space-y-6 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto">
                      {showOnlyPending ? (
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                      ) : (
                        <Sparkles className="w-10 h-10 text-slate-300" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-slate-800">
                        {showOnlyPending ? "Tudo em dia! 🎉" : "Explore novos estudos!"}
                      </h3>
                      <p className="text-slate-500 max-w-sm mx-auto font-medium">
                        {showOnlyPending 
                          ? "Você concluiu todos os estudos disponíveis nos seus grupos atuais." 
                          : "Você ainda não entrou em nenhum grupo. Comece sua jornada agora mesmo!"}
                      </p>
                    </div>
                    {!showOnlyPending && (
                      <button 
                        onClick={() => navigate('/groups')}
                        className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                      >
                        Descobrir Grupos
                      </button>
                    )}
                    {showOnlyPending && (
                      <button 
                        onClick={() => setShowOnlyPending(false)}
                        className="text-cyan-500 font-bold text-sm hover:underline"
                      >
                        Ver todos os grupos
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="gestao"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Group Selector for Leaders */}
              {leaderGroups.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {leaderGroups.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedLeaderGroupId(g.id)}
                      className={cn(
                        "px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all border-2",
                        selectedLeaderGroupId === g.id 
                          ? "bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-100" 
                          : "bg-white border-slate-100 text-slate-500 hover:border-cyan-200"
                      )}
                    >
                      {g.nome}
                    </button>
                  ))}
                </div>
              )}

              {selectedLeaderGroup && (
                <div className="space-y-8">
                  {/* Admin Header Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                      <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-3xl font-black text-slate-800">{selectedLeaderGroup.membros.length}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Membros Ativos</p>
                      </div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-3xl font-black text-slate-800">
                          {/* This would ideally be the average of all members */}
                          85%
                        </p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Taxa de Conclusão</p>
                      </div>
                    </div>
                    <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-100 flex flex-col justify-between text-white">
                      <div className="space-y-2">
                        <h4 className="font-black text-lg">Ações Rápidas</h4>
                        <p className="text-indigo-100 text-xs font-medium">Gerencie seu grupo com eficiência.</p>
                      </div>
                      <div className="flex items-center gap-2 pt-4">
                        <button 
                          onClick={() => navigate(`/groups/${selectedLeaderGroup.id}`)}
                          className="flex-1 bg-white text-indigo-600 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Novo Post
                        </button>
                        <button 
                          onClick={() => navigate(`/groups/${selectedLeaderGroup.id}`)}
                          className="p-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-400 transition-all"
                          title="Configurações do Grupo"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Member Management Table */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" /> Gestão de Membros
                      </h3>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        {groupMembers.length} Membros
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      {loadingGestao ? (
                        <div className="p-12 flex justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                        </div>
                      ) : groupMembers.length > 0 ? (
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50/50">
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Membro</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Progresso</th>
                              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {groupMembers.map((member) => (
                              <tr key={member.profile.uid} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-8 py-5">
                                  <div className="flex items-center gap-3">
                                    <img 
                                      src={member.profile.photoURL} 
                                      alt={member.profile.displayName}
                                      className="w-10 h-10 rounded-xl object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                    <div>
                                      <p className="text-sm font-bold text-slate-800">{member.profile.displayName}</p>
                                      <p className="text-[10px] text-slate-400 font-medium">{member.profile.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-5">
                                  <div className="w-full max-w-[120px] space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold">
                                      <span className="text-cyan-500">{member.progress.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-cyan-400" 
                                        style={{ width: `${member.progress}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                  <button 
                                    onClick={() => window.location.href = `mailto:${member.profile.email}`}
                                    className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-12 text-center text-slate-400 font-medium">
                          Nenhum membro encontrado.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pending Requests Section */}
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-emerald-500" /> Solicitações Pendentes
                    </h3>
                    
                    {pendingRequests.length > 0 ? (
                      <div className="space-y-4">
                        {pendingRequests.map((req) => (
                          <div key={req.uid} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                            <div className="flex items-center gap-3">
                              <img 
                                src={req.photoURL} 
                                alt={req.displayName} 
                                className="w-12 h-12 rounded-xl object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <p className="font-bold text-slate-800">{req.displayName}</p>
                                <p className="text-xs text-slate-500">{req.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleApprove(req.uid)}
                                className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-xs hover:bg-emerald-600 transition-all"
                              >
                                Aprovar
                              </button>
                              <button 
                                onClick={() => handleReject(req.uid)}
                                className="px-4 py-2 bg-white text-slate-500 border border-slate-200 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all"
                              >
                                Recusar
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                          <CheckCircle2 className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-slate-500 font-medium">Tudo em dia! Nenhuma solicitação pendente no momento.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
  );
}
