import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { SkipLogo } from '@/components/SkipLogo'
import { GoldParticles } from '@/components/GoldParticles'
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import pb from '@/lib/pocketbase/client'

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Informe seu e-mail cadastrado.')
      return
    }

    setLoading(true)
    try {
      // PocketBase envia recuperação de senha sem revelar se o e-mail existe
      await pb.collection('users').requestPasswordReset(email.trim())
    } catch {
      // Ignora erro para não revelar enumeração de contas
    } finally {
      setLoading(false)
      setSubmitted(true)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#0B0B0D] px-4 py-8 overflow-hidden text-[#F6F4EF]">
      <GoldParticles />

      <div className="relative z-10 w-full max-w-md bg-[#121110]/85 backdrop-blur-xl border border-[#C9A227]/30 rounded-2xl p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9),0_0_20px_rgba(201,162,39,0.15)] animate-fade-in-up">
        <div className="flex flex-col items-center text-center mb-6">
          <SkipLogo size={46} subtitle="RECUPERAÇÃO DE CONTA" />
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#F6F4EF] mt-5">
            Esqueceu sua Senha?
          </h1>
          <p className="text-sm text-[#8C6A3F] mt-1 font-sans">
            Informe seu e-mail para receber as instruções de recuperação
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-4 space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-[#C9A227]/20 border border-[#C9A227]/40 text-[#C9A227] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-[#F5D77F]" />
            </div>
            <p className="text-sm text-[#D6D0C5] leading-relaxed">
              Se houver uma conta associada a <strong>{email}</strong>, enviamos um link com
              instruções para redefinição.
            </p>
            <p className="text-xs text-[#6B6760]">
              Por favor, cheque também sua pasta de spam ou lixo eletrônico.
            </p>
            <div className="pt-2">
              <Link to="/entrar">
                <Button className="w-full h-11 bg-gradient-to-r from-[#C9A227] to-[#A8861F] text-[#0B0B0D] font-semibold border-0">
                  Voltar para o Login
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-[#B3261E]/15 border border-[#B3261E]/30 text-[#FDECEA] text-xs">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-[#D6D0C5]"
              >
                E-mail cadastrado
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 bg-[#0B0B0D]/80 border-[#8C6A3F]/40 text-[#F6F4EF]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-[#C9A227] to-[#A8861F] text-[#0B0B0D] font-semibold text-sm border-0 flex items-center justify-center gap-2"
            >
              {loading ? (
                'Enviando link...'
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Enviar Link de Recuperação
                </>
              )}
            </Button>

            <div className="pt-2 text-center">
              <Link
                to="/entrar"
                className="inline-flex items-center gap-2 text-xs text-[#8C6A3F] hover:text-[#C9A227] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar para o Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
