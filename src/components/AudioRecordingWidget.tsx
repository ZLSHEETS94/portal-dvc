import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Play, Pause, Upload, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface AudioRecordingWidgetProps {
  onAudioReady: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

export default function AudioRecordingWidget({ onAudioReady, onCancel }: AudioRecordingWidgetProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isMicReady, setIsMicReady] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStillPressingRef = useRef(false);

  useEffect(() => {
    console.log("AudioRecordingWidget montado. Verificando suporte...");
    const initStream = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          console.log("Microfone pré-inicializado com sucesso.");
          setPermissionError(null);
          setIsMicReady(true);
        } else {
          setPermissionError("Seu navegador não suporta gravação de áudio.");
        }
      } catch (err) {
        console.error("Erro ao pré-inicializar microfone:", err);
        setPermissionError("Permissão de microfone negada ou erro de acesso.");
      }
    };
    initStream();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [previewUrl]);

  const startRecording = async (e?: React.PointerEvent | React.TouchEvent) => {
    if (e) {
      if ('releasePointerCapture' in e.target) {
        (e.target as any).setPointerCapture(e.pointerId);
      }
    }
    if (isRecording || isStarting) return;
    
    console.log("Tentando iniciar gravação...");
    setIsStarting(true);
    setIsPressing(true);
    isStillPressingRef.current = true;
    
    try {
      let stream = streamRef.current;
      if (!stream || !stream.active) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        setIsMicReady(true);
      }
      
      // If user released before we got the stream, don't start
      if (!isStillPressingRef.current) {
        console.log("Usuário soltou antes da inicialização completar.");
        setIsStarting(false);
        setIsPressing(false);
        return;
      }

      const mimeTypes = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav'];
      const supportedType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || '';
      
      const mediaRecorder = new MediaRecorder(stream, supportedType ? { mimeType: supportedType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("Gravação finalizada com sucesso.");
        const blob = new Blob(audioChunksRef.current, { type: supportedType || 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setIsRecording(false);
        if (timerRef.current) clearInterval(timerRef.current);
      };

      mediaRecorder.start();
      console.log("MediaRecorder iniciado e gravando.");
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Erro fatal ao iniciar gravação:", err);
      setPermissionError("Erro ao acessar microfone. Verifique as configurações.");
      setIsPressing(false);
    } finally {
      setIsStarting(false);
    }
  };

  const stopRecording = (e?: React.PointerEvent | React.TouchEvent) => {
    if (e && 'releasePointerCapture' in e.target) {
      (e.target as any).releasePointerCapture(e.pointerId);
    }
    console.log("Solicitação de parada de gravação.");
    setIsPressing(false);
    isStillPressingRef.current = false;
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioBlob(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Get duration
      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        setRecordingTime(Math.floor(audio.duration));
      };
    }
  };

  const togglePreview = () => {
    if (!audioPreviewRef.current) return;
    if (isPlaying) {
      audioPreviewRef.current.pause();
    } else {
      audioPreviewRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleConfirm = () => {
    if (audioBlob) {
      onAudioReady(audioBlob, recordingTime);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Mic className="w-5 h-5 text-cyan-500" />
          {audioBlob ? 'Revisar Áudio' : 'Gravar Áudio'}
        </h3>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <XCircle className="w-6 h-6 text-slate-300" />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center py-8 space-y-6">
        {!audioBlob ? (
          <>
            <div className="relative">
              <AnimatePresence>
                {isRecording && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 0.2 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-0 bg-red-500 rounded-full"
                  />
                )}
              </AnimatePresence>
              <button 
                type="button"
                onPointerDown={startRecording}
                onPointerUp={stopRecording}
                onPointerLeave={stopRecording}
                onPointerCancel={stopRecording}
                disabled={isStarting || !!permissionError}
                className={cn(
                  "w-24 h-24 rounded-full flex items-center justify-center text-white shadow-2xl transition-all active:scale-95 z-10 relative touch-none",
                  isRecording ? "bg-red-500 hover:bg-red-600 scale-110" : isMicReady ? "bg-cyan-500 hover:bg-cyan-600" : "bg-slate-300",
                  isPressing && !isRecording && "scale-110 bg-cyan-600",
                  (isStarting || !!permissionError) && "opacity-50 cursor-not-allowed"
                )}
              >
                {isStarting ? (
                  <Loader2 className="w-10 h-10 animate-spin" />
                ) : isRecording ? (
                  <Square className="w-8 h-8 fill-current animate-pulse" />
                ) : !isMicReady && !permissionError ? (
                  <Loader2 className="w-10 h-10 animate-spin" />
                ) : (
                  <Mic className="w-10 h-10" />
                )}
              </button>
            </div>
            
            <div className="text-center space-y-1">
              {permissionError ? (
                <p className="text-xs text-red-500 font-bold px-4">{permissionError}</p>
              ) : (
                <>
                  <p className={cn("text-2xl font-black tabular-nums", isRecording ? "text-red-500" : "text-slate-800")}>
                    {formatTime(recordingTime)}
                  </p>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                    {isRecording ? 'Gravando...' : 'Segure para gravar'}
                  </p>
                </>
              )}
            </div>

            {!isRecording && (
              <div className="pt-4">
                <label className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-600 rounded-full text-sm font-bold cursor-pointer hover:bg-slate-100 transition-all border border-slate-100">
                  <Upload className="w-4 h-4" />
                  Escolher Arquivo
                  <input type="file" accept="audio/*" className="hidden" onChange={handleFileSelect} />
                </label>
              </div>
            )}
          </>
        ) : (
          <div className="w-full space-y-6">
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex items-center gap-4">
              <audio ref={audioPreviewRef} src={previewUrl!} onEnded={() => setIsPlaying(false)} />
              <button 
                onClick={togglePreview}
                className="w-14 h-14 bg-cyan-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-cyan-200"
              >
                {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
              </button>
              <div className="flex-1 space-y-2">
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-cyan-500"
                    animate={{ width: isPlaying ? '100%' : '0%' }}
                    transition={{ duration: isPlaying ? recordingTime : 0, ease: 'linear' }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <span>Visualização</span>
                  <span>{formatTime(recordingTime)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setAudioBlob(null);
                  setPreviewUrl(null);
                  setRecordingTime(0);
                }}
                className="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all"
              >
                <Trash2 className="w-5 h-5" /> Descartar
              </button>
              <button 
                onClick={handleConfirm}
                className="flex-1 py-4 bg-cyan-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-cyan-600 shadow-lg shadow-cyan-100 transition-all"
              >
                <CheckCircle2 className="w-5 h-5" /> Confirmar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
