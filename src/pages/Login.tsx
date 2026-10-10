import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { SkipLogo } from '@/components/SkipLogo'
import { GoldParticles } from '@/components/GoldParticles'
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, KeyRound } from 'lucide-react'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { ClientResponseError } from 'pocketbase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Login: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setGeneralError(null)

    // Validação local imediata
    const newErrors: Record<string, string> = {}
    if (!email.trim()) newErrors.email = 'Informe o seu e-mail'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = 'Formato de e-mail inválido'

    if (!password) newErrors.password = 'Informe sua senha'
    else if (password.length < 8) newErrors.password = 'A senha deve ter no mínimo 8 caracteres'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      await login(email.trim(), password)
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/inicio'
      navigate(from, { replace: true })
    } catch (err: unknown) {
      if (err instanceof ClientResponseError) {
        const fieldErrors = extractFieldErrors(err)
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors)
        } else {
          setGeneralError(err.message || 'Credenciais inválidas. Verifique seu e-mail e senha.')
        }
      } else if (err instanceof Error) {
        setGeneralError(err.message || 'Erro ao realizar login.')
      } else {
        setGeneralError('Erro inesperado ao conectar.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#0B0B0D] px-4 py-8 overflow-hidden text-[#F6F4EF]">
      <GoldParticles />

      {/* Cartão de vidro fosco */}
      <div className="relative z-10 w-full max-w-md bg-[#121110]/85 backdrop-blur-xl border border-[#C9A227]/30 rounded-2xl p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9),0_0_20px_rgba(201,162,39,0.15)] animate-fade-in-up">
        {/* Topo do cartão: Logo ornamentado */}
        <div className="flex flex-col items-center text-center mb-7">
          <SkipLogo size={52} subtitle="PLATAFORMA DE COBRANÇAS" />
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#F6F4EF] mt-5">
            Acesso à Conta
          </h1>
          <p className="text-sm text-[#8C6A3F] mt-1 font-sans">
            Entre para gerenciar e emitir suas cobranças Pix
          </p>
        </div>

        {generalError && (
          <div className="mb-5 p-3.5 rounded-lg bg-[#B3261E]/15 border border-[#B3261E]/30 text-[#FDECEA] text-sm flex items-start gap-2 animate-fade-in">
            <span className="text-red-400 font-bold">!</span>
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* E-mail */}
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-wider text-[#D6D0C5]"
            >
              E-mail corporativo
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C6A3F]">
                <Mail className="h-4 w-4" />
              </div>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu.email@empresa.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
                }}
                className={`pl-10 h-12 bg-[#0B0B0D]/80 border ${
                  errors.email
                    ? 'border-[#B3261E] focus-visible:ring-[#B3261E]'
                    : 'border-[#8C6A3F]/40 focus-visible:border-[#C9A227]'
                } text-[#F6F4EF] placeholder:text-[#6B6760] focus-visible:ring-2 focus-visible:ring-[#C9A227]/30 transition-all`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-[#B3261E] mt-1 font-medium">{errors.email}</p>
            )}
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-[#D6D0C5]"
              >
                Senha de acesso
              </Label>
              <Link
                to="/esqueci-senha"
                className="text-xs text-[#C9A227] hover:text-[#F5D77F] transition-colors underline-offset-4 hover:underline"
              >
                Esqueceu sua senha?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C6A3F]">
                <Lock className="h-4 w-4" />
              </div>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }))
                }}
                className={`pl-10 pr-10 h-12 bg-[#0B0B0D]/80 border ${
                  errors.password
                    ? 'border-[#B3261E] focus-visible:ring-[#B3261E]'
                    : 'border-[#8C6A3F]/40 focus-visible:border-[#C9A227]'
                } text-[#F6F4EF] placeholder:text-[#6B6760] focus-visible:ring-2 focus-visible:ring-[#C9A227]/30 transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8C6A3F] hover:text-[#C9A227] transition-colors"
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-[#B3261E] mt-1 font-medium">{errors.password}</p>
            )}
          </div>

          {/* Botão Entrar */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 bg-gradient-to-r from-[#C9A227] to-[#A8861F] hover:from-[#F5D77F] hover:to-[#C9A227] text-[#0B0B0D] font-semibold tracking-wide text-sm shadow-[0_4px_16px_rgba(201,162,39,0.3)] transition-all transform hover:-translate-y-0.5 active:scale-[0.98] border-0"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-[#0B0B0D] border-t-transparent rounded-full animate-spin" />
                <span>Autenticando...</span>
              </div>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Entrar na Plataforma
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>

        {/* Modelo de acesso por convite */}
        <div className="mt-6 pt-5 border-t border-[#8C6A3F]/20 text-center">
          <div className="flex items-center justify-center gap-2 text-xs text-[#8C6A3F] mb-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#C9A227]" />
            <span>Acesso exclusivo por convite</span>
          </div>
          <p className="text-xs text-[#6B6760] leading-relaxed">
            O cadastro de novos usuários é restrito. Se você recebeu um convite ou código de acesso,{' '}
            <Link to="/convite" className="text-[#C9A227] hover:underline font-medium">
              ative sua conta aqui
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Rodapé institucional */}
      <div className="relative z-10 mt-8 text-center text-xs text-[#8C6A3F] flex items-center gap-4">
        <span>© {new Date().getFullYear()} Skip</span>
        <span>•</span>
        <Link to="/termos" className="hover:text-[#C9A227] transition-colors">
          Termos
        </Link>
        <span>•</span>
        <Link to="/privacidade" className="hover:text-[#C9A227] transition-colors">
          Privacidade
        </Link>
      </div>
    </div>
  )
}

export default Login
