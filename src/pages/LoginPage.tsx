import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../services/AuthService';
import { LOGO_URL } from '../types';
import { Mail, Lock, LogIn, Chrome } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const user = await AuthService.handleRedirectResult();
        if (user) {
          navigate('/dashboard');
        }
      } catch (err: any) {
        console.error('Redirect result error:', err);
        setError(`Erro no login: ${err.message || 'Erro desconhecido'}`);
      }
    };
    checkRedirect();
  }, [navigate]);

  const getFriendlyErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/invalid-email':
        return "Não encontramos uma conta com este e-mail. Que tal se cadastrar?";
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return "Ops! A senha parece estar incorreta. Tente novamente.";
      case 'auth/network-request-failed':
        return "Problema de conexão. Verifique sua internet.";
      case 'auth/too-many-requests':
        return "Muitas tentativas malsucedidas. Tente novamente mais tarde.";
      default:
        return "Ocorreu um erro ao tentar entrar. Verifique seus dados.";
    }
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await AuthService.login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      const message = getFriendlyErrorMessage(err.code);
      setError(message);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await AuthService.loginWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(`Erro Google: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "max-w-md w-full bg-white rounded-3xl shadow-xl p-8 space-y-8",
          isShaking && "animate-shake"
        )}
      >
        <div className="text-center">
          <img src={LOGO_URL} alt="Portal Devocional" className="h-24 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h1>
          <p className="text-gray-500 mt-2">Acesse sua conta para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              placeholder="Email"
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="password"
              placeholder="Senha"
              required
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Carregando...' : <><LogIn className="w-5 h-5" /> Entrar</>}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Ou entre com</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <Chrome className="w-5 h-5 text-red-500" /> Google
        </button>

        <p className="text-center text-gray-600">
          Não tem uma conta?{' '}
          <Link to="/signup" className="text-blue-600 font-semibold hover:underline">
            Cadastre-se
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
