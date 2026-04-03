import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Post, Comment, DEFAULT_AVATAR } from '../types';
import { PostService } from '../services/PostService';
import { auth } from '../firebase';
import MainLayout from '../components/MainLayout';
import { 
  ArrowLeft, MessageCircle, BookOpen, Send, 
  Bold, Italic, Palette, Save, CheckCircle2, Loader2,
  Sparkles, Heart, Share2, MoreVertical, List, Highlighter,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import AudioPlayerWidget from '../components/AudioPlayerWidget';
import VideoPlayerWidget from '../components/VideoPlayerWidget';
import PdfViewerWidget from '../components/PdfViewerWidget';
import { ProgressService } from '../services/ProgressService';
import confetti from 'canvas-confetti';

export default function PostDetailPage() {
  const { groupId, dayId, postId } = useParams<{ groupId: string; dayId: string; postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [togglingCompletion, setTogglingCompletion] = useState(false);
  const [activeTab, setActiveTab] = useState<'community' | 'journal'>('community');

  useEffect(() => {
    const fetchPost = async () => {
      if (groupId && dayId && postId) {
        const data = await PostService.getPostById(groupId, dayId, postId);
        setPost(data);
        setLoading(false);
      }
    };
    fetchPost();

    if (postId) {
      return ProgressService.subscribeToPostCompletion(postId, (completed) => {
        setIsCompleted(completed);
      });
    }
  }, [groupId, dayId, postId]);

  const handleToggleCompletion = async () => {
    if (!groupId || !postId || togglingCompletion) return;
    
    setTogglingCompletion(true);
    try {
      const nowCompleted = await ProgressService.toggleCompletion(groupId, postId);
      if (nowCompleted) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00E5FF', '#1e293b', '#ffffff']
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTogglingCompletion(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
      </MainLayout>
    );
  }

  if (!post) {
    return (
      <MainLayout>
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-slate-800">Post não encontrado</h2>
          <button 
            onClick={() => navigate(-1)}
            className="mt-4 text-cyan-500 font-bold flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto pb-20">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </button>
          <h1 className="text-lg font-bold text-slate-800">Detalhes da Postagem</h1>
        </div>

        {/* Post Content (Instagram Style) */}
        <div className="bg-white border-b border-slate-100">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-cyan-50">
                <img src={post.autor_foto || DEFAULT_AVATAR} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">{post.autor_nome}</h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  {new Date(post.criado_em).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button className="p-2 text-slate-300">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 pb-6 space-y-4">
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
              <PdfViewerWidget 
                url={post.pdf_url} 
                name={post.pdf_nome}
                className="mt-2"
              />
            )}

            {post.texto_principal && (
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-base">
                {post.texto_principal}
              </p>
            )}

            {post.livro && (
              <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-100 flex items-center justify-center text-cyan-600">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h5 className="text-sm font-black text-slate-800">
                    {post.livro} {post.capitulo}:{post.versiculo}
                  </h5>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Referência de Estudo</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <Heart className="w-6 h-6 text-slate-300" />
                <span className="text-xs font-bold text-slate-500">{post.curtidas?.length || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-slate-300" />
                <span className="text-xs font-bold text-slate-500">{post.comentarios_count || 0}</span>
              </div>
              <Share2 className="w-6 h-6 text-slate-300 ml-auto" />
            </div>

            <div className="pt-4">
              <button
                onClick={handleToggleCompletion}
                disabled={togglingCompletion}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg",
                  isCompleted 
                    ? "bg-cyan-500 text-white shadow-cyan-100" 
                    : "bg-white border-2 border-cyan-400 text-cyan-500 hover:bg-cyan-50 shadow-slate-100"
                )}
              >
                {togglingCompletion ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isCompleted ? (
                  <>
                    <CheckCircle className="w-5 h-5" /> Concluído
                  </>
                ) : (
                  "Marcar como Concluído"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white sticky top-[57px] z-20 border-b border-slate-100">
          <div className="flex">
            <button 
              onClick={() => setActiveTab('community')}
              className={cn(
                "flex-1 py-4 text-sm font-bold transition-all relative",
                activeTab === 'community' ? "text-cyan-500" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Comunidade
              {activeTab === 'community' && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500 rounded-t-full"
                />
              )}
            </button>
            <button 
              onClick={() => setActiveTab('journal')}
              className={cn(
                "flex-1 py-4 text-sm font-bold transition-all relative",
                activeTab === 'journal' ? "text-cyan-500" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Meu Diário
              {activeTab === 'journal' && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500 rounded-t-full"
                />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          <AnimatePresence mode="wait">
            {activeTab === 'community' ? (
              <motion.div
                key="community"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <CommentListWidget groupId={groupId!} dayId={dayId!} postId={postId!} />
              </motion.div>
            ) : (
              <motion.div
                key="journal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <PrivateJournalWidget groupId={groupId!} dayId={dayId!} postId={postId!} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </MainLayout>
  );
}

function CommentListWidget({ groupId, dayId, postId }: { groupId: string; dayId: string; postId: string }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return PostService.subscribeToComments(groupId, dayId, postId, (data) => {
      setComments(data);
    });
  }, [groupId, dayId, postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || sending) return;

    setSending(true);
    try {
      await PostService.addComment(groupId, dayId, postId, newComment);
      setNewComment("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'agora';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-6 pb-24">
        {comments.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
              <MessageCircle className="w-8 h-8 text-slate-200" />
            </div>
            <p className="text-sm text-slate-400 font-medium">Nenhum comentário ainda.<br/>Seja o primeiro a participar!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-slate-100">
                <img src={comment.autor_foto || DEFAULT_AVATAR} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">{comment.autor_nome}</span>
                  <span className="text-[10px] text-slate-400 font-medium">{timeAgo(comment.criado_em)}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl rounded-tl-none inline-block">
                  {comment.texto}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 z-40">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
          <input 
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Adicionar comentário..."
            className="flex-1 bg-slate-50 border-none rounded-full px-6 py-3 text-sm focus:ring-2 focus:ring-cyan-400 outline-none transition-all"
          />
          <button 
            type="submit"
            disabled={!newComment.trim() || sending}
            className="w-12 h-12 bg-cyan-500 text-white rounded-full flex items-center justify-center hover:bg-cyan-600 active:scale-95 transition-all disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}

function PrivateJournalWidget({ groupId, dayId, postId }: { groupId: string; dayId: string; postId: string }) {
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const userId = auth.currentUser?.uid;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadNote = async () => {
      if (userId) {
        const savedContent = await PostService.getPersonalNote(groupId, dayId, postId, userId);
        setContent(savedContent);
        if (editorRef.current) {
          editorRef.current.innerHTML = savedContent;
        }
      }
    };
    loadNote();
  }, [groupId, dayId, postId, userId]);

  const handleInput = () => {
    if (!editorRef.current) return;
    const newContent = editorRef.current.innerHTML;
    setContent(newContent);
    setSaveStatus('saving');

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      if (userId) {
        await PostService.updatePersonalNote(groupId, dayId, postId, userId, newContent);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    }, 2000);
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-1">
          <Sparkles className="w-4 h-4 text-cyan-500" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meu Diário Privado</span>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-1 text-amber-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-[10px] font-bold">Salvando...</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-1 text-emerald-500">
              <CheckCircle2 className="w-3 h-3" />
              <span className="text-[10px] font-bold">Alterações salvas</span>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-2xl border border-slate-100 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => execCommand('bold')}
          className="p-2 hover:bg-white rounded-xl transition-all text-slate-600"
          title="Negrito"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button 
          onClick={() => execCommand('italic')}
          className="p-2 hover:bg-white rounded-xl transition-all text-slate-600"
          title="Itálico"
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <button 
          onClick={() => execCommand('foreColor', '#00E5FF')}
          className="p-2 hover:bg-white rounded-xl transition-all text-cyan-500"
          title="Cor Ciano"
        >
          <Palette className="w-4 h-4" />
        </button>
        <button 
          onClick={() => execCommand('foreColor', '#1e293b')}
          className="p-2 hover:bg-white rounded-xl transition-all text-slate-800"
          title="Cor Preto"
        >
          <Palette className="w-4 h-4" />
        </button>
        <button 
          onClick={() => execCommand('foreColor', '#94a3b8')}
          className="p-2 hover:bg-white rounded-xl transition-all text-slate-400"
          title="Cor Cinza"
        >
          <Palette className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <button 
          onClick={() => execCommand('insertUnorderedList')}
          className="p-2 hover:bg-white rounded-xl transition-all text-slate-600"
          title="Marcadores"
        >
          <List className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <button 
          onClick={() => execCommand('hiliteColor', '#ffff00')}
          className="p-2 hover:bg-white rounded-xl transition-all text-yellow-500"
          title="Destaque Amarelo"
        >
          <Highlighter className="w-4 h-4" />
        </button>
        <button 
          onClick={() => execCommand('hiliteColor', '#00ff00')}
          className="p-2 hover:bg-white rounded-xl transition-all text-green-500"
          title="Destaque Verde"
        >
          <Highlighter className="w-4 h-4" />
        </button>
        <button 
          onClick={() => execCommand('hiliteColor', '#00E5FF')}
          className="p-2 hover:bg-white rounded-xl transition-all text-cyan-400"
          title="Destaque Ciano"
        >
          <Highlighter className="w-4 h-4" />
        </button>
        <button 
          onClick={() => execCommand('hiliteColor', 'transparent')}
          className="p-2 hover:bg-white rounded-xl transition-all text-slate-300"
          title="Remover Destaque"
        >
          <Highlighter className="w-4 h-4" />
        </button>
      </div>

      {/* Editor */}
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[300px] p-6 bg-white border border-slate-100 rounded-[2.5rem] outline-none focus:ring-2 focus:ring-cyan-100 transition-all text-slate-700 leading-relaxed prose prose-slate max-w-none"
        placeholder="Escreva suas reflexões pessoais aqui..."
      />
      
      <p className="text-[10px] text-slate-400 text-center font-medium">
        Este diário é privado. Somente você pode ver o que escreve aqui.
      </p>
    </div>
  );
}
