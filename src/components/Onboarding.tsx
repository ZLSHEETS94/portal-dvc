import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle2, Share2, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';

interface OnboardingProps {
  onClose: () => void;
}

const slides = [
  {
    title: "Bem-vindo ao Portal! 📖",
    description: "Aqui você encontrará todos os estudos, reflexões e materiais do seu grupo de forma organizada e moderna.",
    icon: BookOpen,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10"
  },
  {
    title: "Não perca o Fio da Meada! ✅",
    description: "Marque os estudos como concluídos para acompanhar seu progresso e ver sua barra de evolução crescer.",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10"
  },
  {
    title: "Multiplique a Palavra! 📲",
    description: "Compartilhe qualquer postagem diretamente no WhatsApp com apenas um clique e edifique outras vidas.",
    icon: Share2,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10"
  }
];

export function Onboarding({ onClose }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors z-10"
        >
          <X className="w-6 h-6 text-slate-400" />
        </button>

        <div className="p-8 sm:p-12 text-center space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className={cn(
                "w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner",
                slides[currentSlide].bg
              )}>
                {React.createElement(slides[currentSlide].icon, {
                  className: cn("w-12 h-12", slides[currentSlide].color)
                })}
              </div>
              
              <div className="space-y-3">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
                  {slides[currentSlide].title}
                </h2>
                <p className="text-slate-500 text-base sm:text-lg leading-relaxed font-medium">
                  {slides[currentSlide].description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-2">
            {slides.map((_, i) => (
              <div 
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  currentSlide === i ? "w-8 bg-cyan-400" : "w-2 bg-slate-200"
                )}
              />
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              className={cn(
                "flex items-center gap-2 font-bold text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-0",
              )}
            >
              <ChevronLeft className="w-5 h-5" /> Anterior
            </button>
            
            <button
              onClick={nextSlide}
              className="bg-cyan-400 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-100 flex items-center gap-2 group"
            >
              {currentSlide === slides.length - 1 ? "Começar agora" : "Próximo"}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
