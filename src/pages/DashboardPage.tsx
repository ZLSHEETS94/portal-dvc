import MainLayout from '../components/MainLayout';
import { Construction, Sparkles, ArrowRight, BookOpen, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-200"
        >
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Jornada de Aperfeiçoamento</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Sua evolução espiritual começa aqui.
            </h1>
            <p className="text-indigo-100 text-lg mb-8 leading-relaxed">
              Estamos preparando um ambiente transformador para você se conectar e crescer todos os dias.
            </p>
            <button className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold hover:bg-indigo-50 transition-all flex items-center gap-2 group shadow-lg">
              Começar Jornada <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
        </motion.div>

        {/* Maintenance Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center">
              <Construction className="w-10 h-10 text-amber-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-800">Módulo em Construção</h2>
              <p className="text-slate-500 max-w-sm mx-auto">
                Nossa equipe está desenvolvendo ferramentas exclusivas para o seu devocional diário.
              </p>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '75%' }}
                className="bg-indigo-600 h-full rounded-full"
              />
            </div>
            <span className="text-sm font-semibold text-indigo-600">75% Concluído</span>
          </div>

          <div className="bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <Star className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-indigo-900">Dica do Dia</h3>
              <p className="text-indigo-700/80 leading-relaxed italic">
                "O aprendizado constante é a chave para a excelência. Dedique 15 minutos hoje para sua leitura."
              </p>
            </div>
            <div className="pt-6">
              <div className="flex items-center gap-2 text-indigo-600 font-bold">
                <BookOpen className="w-5 h-5" />
                <span>Ver Biblioteca</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
