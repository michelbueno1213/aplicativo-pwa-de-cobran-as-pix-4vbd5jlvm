import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { SkipLogo } from '@/components/SkipLogo'
import { GoldParticles } from '@/components/GoldParticles'
import { Lock, Mail, User, ArrowRight, ShieldCheck, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { ClientResponseError } from 'pocketbase'

export const InviteAccept: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialEmail = searchParams.get('email') || ''
  const token = searchParams.get('token') || ''

  const [name, setName] = useState('')
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)
  const [generalError, setGeneralError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setGeneralError(null)

    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = 'Informe seu nome completo'
    if (!email.trim()) newErrors.email = 'Informe seu e-mail'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'E-mail inválido'

    if (!password) newErrors.password = 'Crie uma senha'
    else if (password.length < 8) newErrors.password = 'A senha deve ter no mínimo 8 caracteres'

    if (password !== passwordConfirm) {
      newErrors.passwordConfirm = 'As senhas não coincidem'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      // Criar conta do convidado
      await pb.collection('users').create({
        name: name.trim(),
        email: email.trim(),
        password,
        passwordConfirm,
      })

      // Enviar e-mail de verificação
      try {
        await pb.collection('users').requestVerification(email.trim())
      } catch {
        // Prossegue mesmo se envio falhar no mock local
      }

      setSuccess(true)
    } catch (err: unknown) {
      if (err instanceof ClientResponseError) {
        const fieldErrors = extractFieldErrors(err)
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors)
        } else {
          setGeneralError(
            err.message || 'Não foi possível ativar o convite. Verifique se o e-mail já existe.',
          )
        }
      } else if (err instanceof Error) {
        setGeneralError(err.message)
      } else {
        setGeneralError('Erro inesperado.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#0B0B0D] px-4 py-8 overflow-hidden text-[#F6F4EF]">
      <GoldParticles />

      <div className="relative z-10 w-full max-w-md bg-[#121110]/85 backdrop-blur-xl border border-[#C9A227]/30 rounded-2xl p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9),0_0_20px_rgba(201,162,39,0.15)] animate-fade-in-up">
        <div className="flex flex-col items-center text-center mb-6">
          <SkipLogo size={48} subtitle="ACESSO POR CONVITE" />
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#F6F4EF] mt-5">
            Ativação de Convite
          </h1>
          <p className="text-sm text-[#8C6A3F] mt-1 font-sans">
            Complete seu cadastro para acessar a plataforma
          </p>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-[#2E7D32]/20 border border-[#2E7D32]/40 text-[#2E7D32] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-[#4CAF50]" />
            </div>
            <h2 className="font-serif text-xl font-bold text-[#F6F4EF]">
              Conta Criada com Sucesso!
            </h2>
            <p className="text-sm text-[#D6D0C5] leading-relaxed">
              Enviamos um link de verificação para <strong>{email}</strong>. Confirme seu e-mail e
              faça seu primeiro login.
            </p>
            <Button
              onClick={() => navigate('/entrar')}
              className="w-full h-11 bg-gradient-to-r from-[#C9A227] to-[#A8861F] text-[#0B0B0D] font-semibold mt-3"
            >
              Ir para o Login
            </Button>
          </div>
        ) : (
          <>
            {generalError && (
              <div className="mb-5 p-3.5 rounded-lg bg-[#B3261E]/15 border border-[#B3261E]/30 text-[#FDECEA] text-sm flex items-start gap-2">
                <span className="text-red-400 font-bold">!</span>
                <span>{generalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="name"
                  className="text-xs font-semibold uppercase tracking-wider text-[#D6D0C5]"
                >
                  Nome Completo
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C6A3F]">
                    <User className="h-4 w-4" />
                  </div>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
                    }}
                    className="pl-10 h-11 bg-[#0B0B0D]/80 border-[#8C6A3F]/40 text-[#F6F4EF]"
                  />
                </div>
                {errors.name && <p className="text-xs text-[#B3261E]">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-xs font-semibold uppercase tracking-wider text-[#D6D0C5]"
                >
                  E-mail Convidado
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C6A3F]">
                    <Mail className="h-4 w-4" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu.email@empresa.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
                    }}
                    className="pl-10 h-11 bg-[#0B0B0D]/80 border-[#8C6A3F]/40 text-[#F6F4EF]"
                  />
                </div>
                {errors.email && <p className="text-xs text-[#B3261E]">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider text-[#D6D0C5]"
                >
                  Definir Senha (mínimo 8 caracteres)
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C6A3F]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (errors.password) setErrors((prev) => ({ ...prev, password: '' }))
                    }}
                    className="pl-10 pr-10 h-11 bg-[#0B0B0D]/80 border-[#8C6A3F]/40 text-[#F6F4EF]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8C6A3F]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-[#B3261E]">{errors.password}</p>}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="passwordConfirm"
                  className="text-xs font-semibold uppercase tracking-wider text-[#D6D0C5]"
                >
                  Confirmar Senha
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C6A3F]">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="passwordConfirm"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={passwordConfirm}
                    onChange={(e) => {
                      setPasswordConfirm(e.target.value)
                      if (errors.passwordConfirm)
                        setErrors((prev) => ({ ...prev, passwordConfirm: '' }))
                    }}
                    className="pl-10 h-11 bg-[#0B0B0D]/80 border-[#8C6A3F]/40 text-[#F6F4EF]"
                  />
                </div>
                {errors.passwordConfirm && (
                  <p className="text-xs text-[#B3261E]">{errors.passwordConfirm}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 bg-gradient-to-r from-[#C9A227] to-[#A8861F] text-[#0B0B0D] font-semibold text-sm border-0"
              >
                {loading ? 'Criando Conta...' : 'Ativar e Criar Conta'}
              </Button>
            </form>

            <div className="mt-5 text-center">
              <Link
                to="/entrar"
                className="text-xs text-[#8C6A3F] hover:text-[#C9A227] transition-colors"
              >
                Já possui uma conta? Faça login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default InviteAccept
