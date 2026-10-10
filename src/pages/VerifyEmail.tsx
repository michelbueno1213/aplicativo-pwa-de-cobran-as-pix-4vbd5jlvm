import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SkipLogo } from '@/components/SkipLogo'
import { GoldParticles } from '@/components/GoldParticles'
import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import pb from '@/lib/pocketbase/client'

export const VerifyEmail: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const verify = async () => {
      if (!token) {
        if (isMounted) {
          setError('Token de verificação não informado.')
          setLoading(false)
        }
        return
      }

      try {
        await pb.collection('users').confirmVerification(token)
        if (isMounted) setSuccess(true)
      } catch (err: unknown) {
        if (isMounted) {
          if (err instanceof Error) {
            setError(err.message || 'Token expirado ou inválido.')
          } else {
            setError('Falha ao verificar conta.')
          }
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    verify()

    return () => {
      isMounted = false
    }
  }, [token])

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#0B0B0D] px-4 py-8 overflow-hidden text-[#F6F4EF]">
      <GoldParticles />

      <div className="relative z-10 w-full max-w-md bg-[#121110]/85 backdrop-blur-xl border border-[#C9A227]/30 rounded-2xl p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] text-center animate-fade-in-up">
        <div className="flex flex-col items-center mb-6">
          <SkipLogo size={46} subtitle="ATIVAÇÃO DE CONTA" />
        </div>

        {loading ? (
          <div className="py-8 space-y-4">
            <Loader2 className="w-10 h-10 text-[#C9A227] animate-spin mx-auto" />
            <p className="text-sm text-[#D6D0C5]">Validando sua conta...</p>
          </div>
        ) : success ? (
          <div className="space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-[#2E7D32]/20 border border-[#2E7D32]/40 text-[#2E7D32] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-[#4CAF50]" />
            </div>
            <h2 className="font-serif text-xl font-bold text-[#F6F4EF]">Conta Ativada!</h2>
            <p className="text-sm text-[#D6D0C5] leading-relaxed">
              E-mail verificado com sucesso. Você já pode acessar a plataforma Skip Pix.
            </p>
            <Button
              onClick={() => navigate('/entrar')}
              className="w-full h-11 bg-gradient-to-r from-[#C9A227] to-[#A8861F] text-[#0B0B0D] font-semibold mt-4 border-0"
            >
              Fazer Login
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-[#B3261E]/20 border border-[#B3261E]/40 text-[#B3261E] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 text-[#E53935]" />
            </div>
            <h2 className="font-serif text-xl font-bold text-[#F6F4EF]">Falha na Verificação</h2>
            <p className="text-sm text-[#D6D0C5] leading-relaxed">{error}</p>
            <Button
              onClick={() => navigate('/entrar')}
              className="w-full h-11 bg-gradient-to-r from-[#C9A227] to-[#A8861F] text-[#0B0B0D] font-semibold mt-4 border-0"
            >
              Ir para o Login
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default VerifyEmail
