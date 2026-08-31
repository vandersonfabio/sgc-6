import React, { useState } from 'react';
import {
  Shield,
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
} from 'lucide-react';
import { useDatabase } from '../../services/store';
import { getActiveSupabaseConfig } from '../../services/supabaseClient';

interface LoginViewProps {
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { login } = useDatabase();
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identificador.trim()) {
      setErrorMessage('Por favor, informe o seu E-mail Institucional ou Matrícula PM.');
      return;
    }
    if (!senha) {
      setErrorMessage('Por favor, digite a sua senha de acesso.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await login(identificador, senha);
      setIsLoading(false);

      if (res.success) {
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setErrorMessage(res.error || 'Credenciais inválidas. Verifique os dados informados.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Erro de comunicação ao autenticar.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white relative overflow-hidden">
      {/* Background Military Gradient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-blue-900/20 via-slate-900/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Top Institutional Header */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 border border-blue-400/40 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-blue-900/30 tracking-wider">
            6BPM
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white">POLÍCIA MILITAR DO RN</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                PMRN
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              6º Batalhão de Polícia Militar • Batalhão Senador Dinarte Mariz (Caicó/RN)
            </p>
          </div>
        </div>

        {/* Backend Badge */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Supabase / PostgreSQL RLS</span>
        </div>
      </header>

      {/* Center Auth Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md space-y-6">
          {/* Title and Badge */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-800/60 text-blue-400 text-xs font-semibold shadow-inner">
              <Shield className="w-3.5 h-3.5" />
              <span>SGC-6 • SISTEMA DE GESTÃO E CAUTELA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Controle de Acesso
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
              Acesso restrito aos operadores e armeiros credenciados pelo P4 / Comando do 6º BPM
            </p>
          </div>

          {/* Login Form Box */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60 backdrop-blur-xl relative">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                  <div className="leading-relaxed font-medium">{errorMessage}</div>
                </div>
              )}

              {/* Identificação Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Identificação Institucional <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-identificador"
                    type="text"
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    placeholder="Matrícula PM ou E-mail institucional"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                <p className="text-[10px] text-slate-400 pl-1">
                  Ex: <code>1984201</code> ou <code>armeiro.6bpm@pm.rn.gov.br</code>
                </p>
              </div>

              {/* Senha Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-300">
                    Senha de Acesso <span className="text-red-400">*</span>
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-senha"
                    type={showPassword ? 'text' : 'password'}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite sua senha"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition cursor-pointer"
                    title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Autenticando Operador...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Entrar no Sistema</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Institutional Security Notice */}
          <div className="text-center space-y-1">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-medium">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Conexão criptografada • Gestão de operadores gerenciada internamente</span>
            </p>
            <p className="text-[10px] text-slate-400">
              Novos operadores são cadastrados e geridos exclusivamente pelos perfis <strong>Superuser</strong> e <strong>P4</strong>.
            </p>
          </div>
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-4 text-center text-xs text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>SGC-6 • 6º Batalhão de Polícia Militar</strong> • Caicó/RN • Seridó Potiguar
          </div>
          <div className="text-slate-400 text-[11px]">
            Seção de Logística e Patrimônio (P4) • Diretoria de Apoio Logístico (DAL / PMRN)
          </div>
        </div>
      </footer>
    </div>
  );
};
