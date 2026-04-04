import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, User, LogOut, BookOpen, Trophy, Target, Users, FileText, Calendar } from 'lucide-react';
import { AuthService } from '../services/AuthService';
import { StatsService, UserStats } from '../services/StatsService';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { LOGO_URL } from '../types';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState<UserStats>({ posts: 0, devocionais: 0, grupos: 0 });

  useEffect(() => {
    const unsubscribe = StatsService.subscribeToUserStats((data) => {
      setStats(data);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await AuthService.logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Meus Devocionais', path: '/groups' },
    { icon: User, label: 'Meu Perfil', path: '/profile' },
  ];

  const statsItems = [
    { icon: FileText, label: 'Posts', value: stats.posts.toString(), color: 'text-emerald-600' },
    { icon: Calendar, label: 'Devocionais', value: stats.devocionais.toString(), color: 'text-amber-600' },
    { icon: Users, label: 'Grupos', value: stats.grupos.toString(), color: 'text-indigo-600' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-indigo-100 flex items-center justify-center bg-slate-900">
              <img src={LOGO_URL} alt="Logo" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">Portal Devocional</span>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200",
                    isActive 
                      ? "bg-indigo-50 text-indigo-600 shadow-sm" 
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-indigo-600" : "text-slate-400")} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Progresso Semanal</p>
            <div className="space-y-3">
              {statsItems.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                    <span className="text-xs text-slate-600">{stat.label}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-800">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile Nav */}
      <nav className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-slate-900">
            <img src={LOGO_URL} alt="Logo" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
          </div>
          <span className="font-bold text-lg text-slate-800">Portal Devocional</span>
        </div>
        <div className="flex items-center gap-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "p-2 rounded-lg transition-all",
                location.pathname === item.path ? "bg-indigo-50 text-indigo-600" : "text-slate-500"
              )}
            >
              <item.icon className="w-6 h-6" />
            </button>
          ))}
          <button onClick={handleLogout} className="p-2 text-red-500">
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
