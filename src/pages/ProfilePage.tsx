import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../firebase';
import { FirestoreService } from '../services/FirestoreService';
import { CloudinaryService } from '../services/CloudinaryService';
import { UserProfile, DEFAULT_AVATAR } from '../types';
import { 
  Camera, Save, User as UserIcon, Phone, CreditCard, 
  Loader2, Sparkles, GraduationCap, ShieldCheck, 
  Mail, Calendar, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import MainLayout from '../components/MainLayout';

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    cpf: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const data = await FirestoreService.getUserProfile(user.uid);
        if (data) {
          setProfile(data);
          setFormData({
            displayName: data.displayName || '',
            phoneNumber: data.phoneNumber || '',
            cpf: data.cpf || ''
          });
        }
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      await FirestoreService.updateProfile(profile.uid, formData);
      setProfile({ ...profile, ...formData });
      alert('Perfil atualizado com sucesso!');
    } catch (err) {
      alert('Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploading(true);
    try {
      const url = await CloudinaryService.uploadImage(file);
      await FirestoreService.updateProfile(profile.uid, { photoURL: url });
      setProfile({ ...profile, photoURL: url });
    } catch (err) {
      alert('Erro ao fazer upload da foto.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!auth.currentUser) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
          <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center">
            <UserIcon className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-800">Acesso Restrito</h3>
            <p className="text-slate-500 max-w-sm mx-auto font-medium">
              Faça login para visualizar e editar seu perfil.
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/login'}
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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100"
        >
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-40 relative">
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute -bottom-16 left-8 flex items-end gap-6">
              <div className="relative group">
                <div className="w-32 h-32 rounded-[2rem] border-4 border-white overflow-hidden bg-white shadow-2xl transition-transform group-hover:scale-105 duration-300">
                  <img
                    src={profile?.photoURL || DEFAULT_AVATAR}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-indigo-600 p-3 rounded-2xl shadow-lg hover:bg-indigo-700 transition-all text-white"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                  accept="image/*"
                />
              </div>
              <div className="pb-4 hidden sm:block">
                <h2 className="text-3xl font-bold text-slate-800">{profile?.displayName}</h2>
                <div className="flex items-center gap-2 text-slate-500 font-medium">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Estudante Nível 1</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-20 p-8 sm:p-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-12">
              <div className="bg-emerald-50/50 sm:bg-emerald-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-emerald-100/50 sm:border-emerald-100 flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-wider">Status</p>
                  <p className="text-base sm:text-lg font-bold text-emerald-900">{profile?.status}</p>
                </div>
              </div>
              <div className="bg-indigo-50/50 sm:bg-indigo-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-indigo-100/50 sm:border-indigo-100 flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-indigo-600 uppercase tracking-wider">Plano</p>
                  <p className="text-base sm:text-lg font-bold text-indigo-900">{profile?.plan}</p>
                </div>
              </div>
              <div className="bg-amber-50/50 sm:bg-amber-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-amber-100/50 sm:border-amber-100 flex items-center gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                  <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-bold text-amber-600 uppercase tracking-wider">Membro desde</p>
                  <p className="text-base sm:text-lg font-bold text-amber-900">
                    {profile?.createdAt ? new Date(profile.createdAt).getFullYear() : '2024'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                <h3 className="text-xl font-bold text-slate-800">Informações Pessoais</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 px-1">Nome Completo</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="text"
                      className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-medium text-sm sm:text-base text-slate-700"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 px-1">Email (Não editável)</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-300" />
                    <input
                      type="email"
                      disabled
                      className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-slate-100 border border-slate-200 rounded-xl sm:rounded-2xl text-slate-400 cursor-not-allowed font-medium text-sm sm:text-base"
                      value={profile?.email}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 px-1">Telefone de Contato</label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="text"
                      placeholder="(00) 00000-0000"
                      className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-medium text-sm sm:text-base text-slate-700"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 px-1">CPF</label>
                  <div className="relative group">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none transition-all font-medium text-sm sm:text-base text-slate-700"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto bg-indigo-600 text-white font-bold px-12 py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-indigo-200 text-sm sm:text-base"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <><Save className="w-4 h-4 sm:w-5 sm:h-5" /> Salvar Alterações</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Motivational Footer */}
        <div className="bg-white p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4 sm:gap-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-50 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-bold text-slate-800">Mantenha a constância!</h4>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Cada pequena atualização no seu perfil e cada lição concluída te aproxima do seu objetivo. 
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
