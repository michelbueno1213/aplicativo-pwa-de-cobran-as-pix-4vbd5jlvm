import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { SkipLogo } from '@/components/SkipLogo'
import { GoldParticles } from '@/components/GoldParticles'
import { Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError('Token de recuperação ausente ou inválido.')
      return
    }

    if (!password || password.length < 8) {
      setError('A nova senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (password !== passwordConfirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    try {
      await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm)
      setSuccess(true)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Token expirado ou inválido. Solicite uma nova recuperação.')
      } else {
        setError('Falha ao redefinir senha.')
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
          <SkipLogo size={46} subtitle="SEGURANÇA DA CONTA" />
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#F6F4EF] mt-5">
            Redefinir Senha
          </h1>
          <p className="text-sm text-[#8C6A3F] mt-1 font-sans">
            Crie uma nova senha segura para sua conta
          </p>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-[#2E7D32]/20 border border-[#2E7D32]/40 text-[#2E7D32] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-[#4CAF50]" />
            </div>
            <h2 className="font-serif text-xl font-bold text-[#F6F4EF]">Senha Atualizada!</h2>
            <p className="text-sm text-[#D6D0C5] leading-relaxed">
              Sua senha foi redefinida com sucesso. Faça login com as novas credenciais.
            </p>
            <Button
              onClick={() => navigate('/entrar')}
              className="w-full h-11 bg-gradient-to-r from-[#C9A227] to-[#A8861F] text-[#0B0B0D] font-semibold border-0"
            >
              Ir para o Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-[#B3261E]/15 border border-[#B3261E]/30 text-[#FDECEA] text-xs">
                {error}
              </div>
            )}

            {!token && (
              <div className="p-3 rounded-lg bg-[#B26A00]/15 border border-[#B26A00]/30 text-[#FFF3E0] text-xs">
                Aviso: Nenhum token de verificação foi encontrado na URL. Verifique o link recebido
                por e-mail.
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-[#D6D0C5]"
              >
                Nova senha
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C6A3F]">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 bg-[#0B0B0D]/80 border-[#8C6A3F]/40 text-[#F6F4EF]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#8C6A3F]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="passwordConfirm"
                className="text-xs font-semibold uppercase tracking-wider text-[#D6D0C5]"
              >
                Confirmar nova senha
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8C6A3F]">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  id="passwordConfirm"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repita a senha"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="pl-10 h-12 bg-[#0B0B0D]/80 border-[#8C6A3F]/40 text-[#F6F4EF]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading || !token}
              className="w-full h-12 bg-gradient-to-r from-[#C9A227] to-[#A8861F] text-[#0B0B0D] font-semibold text-sm border-0"
            >
              {loading ? 'Redefinindo...' : 'Redefinir Senha'}
            </Button>

            <div className="pt-2 text-center">
              <Link
                to="/entrar"
                className="text-xs text-[#8C6A3F] hover:text-[#C9A227] transition-colors"
              >
                Voltar para o Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPassword
