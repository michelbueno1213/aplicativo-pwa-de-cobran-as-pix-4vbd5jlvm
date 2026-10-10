import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Lock,
  Copy,
  Check,
  Clock,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Home,
  QrCode,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { publicChargeService, PublicChargeData } from '@/services/publicCharge'
import { RomLogo } from '@/components/SkipLogo'
import { formatCurrency, formatDateBr } from '@/lib/formatters'
import { Button } from '@/components/ui/button'

export const PublicPaymentPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  const [charge, setCharge] = useState<PublicChargeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorNotFound, setErrorNotFound] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Contagem regressiva de expiração
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    if (!id) {
      setErrorNotFound(true)
      setLoading(false)
      return
    }

    let isMounted = true

    const fetchCharge = async () => {
      try {
        const data = await publicChargeService.getPublicCharge(id)
        if (isMounted) {
          setCharge(data)
          setErrorNotFound(false)
        }
      } catch {
        if (isMounted) {
          setErrorNotFound(true)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchCharge()

    return () => {
      isMounted = false
    }
  }, [id])

  // Timer de expiração
  useEffect(() => {
    if (!charge?.expires_at) return

    const updateTimer = () => {
      const diff = new Date(charge.expires_at!).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft('Expirada')
        return
      }
      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [charge?.expires_at])

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2500)
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 animate-spin text-[#C5A059] mb-3" />
        <p className="text-xs text-[#73726C]">Carregando pagamento seguro...</p>
      </div>
    )
  }

  // Cobrança não encontrada
  if (errorNotFound || !charge) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#FFFFFF] border border-[#D6D0C5] rounded-2xl p-8 text-center space-y-5 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold text-[#141413]">
              Cobrança não encontrada.
            </h1>
            <p className="text-xs text-[#73726C] mt-1.5 leading-relaxed">
              O link de pagamento informado não existe ou já foi cancelado.
            </p>
          </div>
          <Button
            asChild
            className="w-full bg-[#C5A059] hover:bg-[#B38F46] text-[#141413] font-semibold text-xs"
          >
            <Link to="/entrar">
              <Home className="w-4 h-4 mr-1.5" />
              Ir para o início
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  // Determinar etapa da linha do tempo
  // Linha do tempo de 3 etapas: "Aguardando pagamento" -> "Pix Confirmado" -> "DePix Enviado"
  // Estados de falha: Expirada/Estornada/Cancelada/Erro
  const isFailed = [
    'expired',
    'refunded',
    'canceled',
    'cancelled',
    'error',
    'will_refund',
  ].includes(charge.status)

  let activeStepIndex = 0 // 0: Aguardando pagamento, 1: Pix Confirmado, 2: DePix Enviado
  if (charge.status === 'approved' || charge.status === 'paid') {
    activeStepIndex = 1
  } else if (charge.status === 'depix_sent') {
    activeStepIndex = 2
  }

  const steps = [
    { title: 'Aguardando pagamento', desc: 'Aguardando transferência Pix' },
    { title: 'Pix Confirmado', desc: 'Pagamento validado' },
    { title: 'DePix Enviado', desc: 'Liquidação Liquid concluída' },
  ]

  const isSimulated = Boolean(charge.is_simulated)
  const hasRealQrData = Boolean(charge.pix_copia_cola || charge.qr_image_url)

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#141413] flex flex-col justify-between p-4 sm:p-6 md:p-8">
      <div className="max-w-lg w-full mx-auto my-auto space-y-4">
        {/* Banner de Homologação (se for simulação) */}
        {isSimulated && (
          <div className="rounded-xl border border-amber-400 bg-amber-50 p-3.5 text-amber-900 text-xs flex items-start gap-2.5 shadow-xs">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-semibold block text-amber-950">
                Cobrança de homologação — ambiente de teste.
              </strong>
              Esta não é uma cobrança real.
            </div>
          </div>
        )}

        {/* Card Único de Pagamento */}
        <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-2xl shadow-sm overflow-hidden">
          {/* Header do Card: ROM — Pagamento seguro */}
          <div className="p-5 sm:p-6 border-b border-[#E6E4DD] bg-[#141413] text-[#FAF8F5] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RomLogo size={30} />
              <div>
                <span className="font-serif text-lg font-bold tracking-tight text-[#FAF8F5]">
                  ROM
                </span>
                <span className="block text-[10px] text-[#C5A059] uppercase tracking-wider font-medium">
                  Pagamento seguro
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#201F1D] border border-[#2C2A29] text-[11px] text-[#C5A059] font-medium">
              <Lock className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Ambiente Seguro</span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Dados do Comerciante e Valor */}
            <div className="text-center space-y-2 border-b border-[#E6E4DD] pb-6">
              <span className="text-xs text-[#73726C] uppercase tracking-wider font-medium">
                Pagar para
              </span>
              <h2 className="font-semibold text-base text-[#141413]">
                {charge.merchant_name || 'Comerciante ROM'}
              </h2>

              {charge.description && (
                <p className="text-xs text-[#73726C] max-w-sm mx-auto">{charge.description}</p>
              )}

              <div className="pt-2">
                <span className="text-xs text-[#73726C] block">Valor total</span>
                <div className="font-serif text-3xl sm:text-4xl font-bold text-[#141413] mt-0.5">
                  {formatCurrency(charge.amount_cents)}
                </div>
              </div>
            </div>

            {/* Linha do Tempo com 3 etapas */}
            <div className="space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#73726C] block">
                Progresso da Operação
              </span>

              {isFailed ? (
                /* Estado de falha */
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <div>
                    <strong className="font-semibold block">Operação {charge.status}</strong>
                    <span>
                      Esta cobrança não está mais disponível para recebimento de pagamentos.
                    </span>
                  </div>
                </div>
              ) : (
                /* 3 Etapas */
                <div className="grid grid-cols-3 gap-2">
                  {steps.map((step, idx) => {
                    const isDone = idx < activeStepIndex
                    const isCurrent = idx === activeStepIndex
                    return (
                      <div
                        key={step.title}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isDone
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : isCurrent
                              ? 'bg-[#FAF8F5] border-[#C5A059] shadow-xs'
                              : 'bg-[#FAF8F5]/50 border-[#E6E4DD] text-[#8C8A7B] opacity-70'
                        }`}
                      >
                        <div className="flex items-center justify-center mb-1">
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <span
                              className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                                isCurrent
                                  ? 'bg-[#C5A059] text-[#141413]'
                                  : 'bg-[#E6E4DD] text-[#73726C]'
                              }`}
                            >
                              {idx + 1}
                            </span>
                          )}
                        </div>
                        <p
                          className={`text-[11px] font-semibold leading-tight ${
                            isCurrent ? 'text-[#141413]' : ''
                          }`}
                        >
                          {step.title}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Comportamento do QR Code / Conteúdo Central */}
            {!isFailed && activeStepIndex === 0 && (
              <div className="space-y-5">
                {isSimulated ? (
                  /* Cobrança de HOMOLOGAÇÃO: placeholder neutro. NUNCA renderizar QR fictício */
                  <div className="p-8 rounded-xl bg-[#FAF8F5] border border-dashed border-[#D6D0C5] text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#EAE6DF] text-[#73726C] flex items-center justify-center mx-auto">
                      <QrCode className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-medium text-[#73726C]">
                      O QR Code será exibido aqui em cobranças reais.
                    </p>
                    <p className="text-[11px] text-[#8C8A7B]">
                      Ambiente de teste e homologação do ROM.
                    </p>
                  </div>
                ) : hasRealQrData ? (
                  /* Cobrança REAL com dados de QR (quando existir integração) */
                  <div className="space-y-4">
                    {charge.qr_image_url && (
                      <div className="p-4 bg-[#FAF8F5] border border-[#D6D0C5] rounded-xl flex items-center justify-center">
                        <img
                          src={charge.qr_image_url}
                          alt="QR Code Pix"
                          className="w-48 h-48 object-contain"
                        />
                      </div>
                    )}

                    {timeLeft && timeLeft !== 'Expirada' && (
                      <div className="flex items-center justify-center gap-1.5 text-xs text-[#73726C]">
                        <Clock className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Expira em: </span>
                        <strong className="font-mono text-[#141413]">{timeLeft}</strong>
                      </div>
                    )}

                    {charge.pix_copia_cola && (
                      <div className="space-y-2">
                        <Button
                          onClick={() => copyToClipboard(charge.pix_copia_cola!, 'copiacola')}
                          className="w-full bg-[#C5A059] hover:bg-[#B38F46] text-[#141413] font-semibold text-xs h-11 shadow-xs"
                        >
                          {copiedKey === 'copiacola' ? (
                            <>
                              <Check className="w-4 h-4 mr-2 text-emerald-800" />
                              Código Pix Copiado com Sucesso!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copiar código Pix (copia e cola)
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E6E4DD] text-[11px] text-[#73726C] text-center">
                      O pagador poderá ser identificado conforme exigências da provedora, em
                      ambiente seguro.
                    </div>
                  </div>
                ) : (
                  /* Cobrança REAL sem dados de QR: mensagem oficial "Em breve" */
                  <div className="p-8 rounded-xl bg-[#FAF8F5] border border-[#D6D0C5] text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                      <Clock className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-sm text-[#141413]">
                      Em breve: geração de cobranças Pix.
                    </h3>
                    <p className="text-xs text-[#73726C] leading-relaxed max-w-xs mx-auto">
                      Estamos finalizando nossa integração com a provedora de pagamentos.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Estado de Pagamento Concluído */}
            {!isFailed && activeStepIndex > 0 && (
              <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="font-semibold text-sm text-emerald-900">
                  {activeStepIndex === 2
                    ? 'Pagamento e Liquidação Concluídos!'
                    : 'Pix Confirmado com Sucesso!'}
                </h3>
                <p className="text-xs text-emerald-800">
                  {activeStepIndex === 2
                    ? 'Os tokens DePix foram transmitidos para a carteira Liquid do comerciante.'
                    : 'Aguardando confirmação de envio dos tokens DePix na rede Liquid.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé da Página Pública */}
        <footer className="text-center text-[11px] text-[#8C8A7B] leading-relaxed px-2">
          Pagamentos processados pela provedora de pagamentos do ROM. Emissão real de cobranças
          habilitada somente após aprovação da provedora e implantação das credenciais.
        </footer>
      </div>
    </div>
  )
}

export default PublicPaymentPage
