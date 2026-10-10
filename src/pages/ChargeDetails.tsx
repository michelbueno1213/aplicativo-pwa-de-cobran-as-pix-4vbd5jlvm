import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  QrCode,
  Share2,
  Trash2,
  Info,
  Layers,
} from 'lucide-react'
import { chargesService, ChargeRecord } from '@/services/charges'
import { StatusBadge, ChargeStatus } from '@/components/StatusBadge'
import { formatCurrency, formatDateBr } from '@/lib/formatters'
import { PixQrCode } from '@/components/PixQrCode'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { GoldConfetti } from '@/components/GoldConfetti'

export const ChargeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = Boolean(user?.is_admin || user?.role === 'admin')

  const [charge, setCharge] = useState<ChargeRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [syncNotice, setSyncNotice] = useState<string | null>(null)

  const loadCharge = useCallback(async () => {
    if (!id) return
    try {
      const data = await chargesService.getById(id)
      setCharge(data)
      if (data.status === 'depix_sent' || data.status === 'approved' || data.status === 'paid') {
        setShowConfetti(true)
      }
    } catch {
      setCharge(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadCharge()
  }, [loadCharge])

  // Realtime updates
  useRealtime<ChargeRecord>('charges', (e) => {
    if (e.record && e.record.id === id) {
      if (e.action === 'update') {
        setCharge(e.record)
        if (
          e.record.status === 'depix_sent' ||
          e.record.status === 'approved' ||
          e.record.status === 'paid'
        ) {
          setShowConfetti(true)
        }
      }
      if (e.action === 'delete') {
        navigate('/cobrancas')
      }
    }
  })

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2500)
  }

  // Sincronização via Eulen API
  const handleSync = async () => {
    if (!id) return
    setSyncing(true)
    setSyncNotice(null)
    try {
      const res = await chargesService.syncStatus(id)
      if (res && res.charge) {
        setCharge(res.charge)
        setSyncNotice('Status sincronizado com a provedora de pagamentos.')
      } else {
        setSyncNotice('Cobrança aguardando confirmação da rede bancária Pix.')
      }
    } catch {
      setSyncNotice('Consulta direta disponível após ativação completa da provedora.')
    } finally {
      setSyncing(false)
    }
  }

  // Ações de simulação permitidas APENAS para administradores em cobranças com is_simulated = true
  const handleSimulatePayment = async () => {
    if (!charge || !isAdmin || !charge.is_simulated) return
    try {
      const updated = await chargesService.markAsPaidSimulated(charge.id)
      setCharge(updated)
      setShowConfetti(true)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSimulateCancel = async () => {
    if (!charge || !isAdmin || !charge.is_simulated) return
    try {
      const updated = await chargesService.cancelSimulated(charge.id)
      setCharge(updated)
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="p-12 text-center">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#C5A059] mb-2" />
        <p className="text-sm text-[#73726C]">Carregando detalhes da cobrança...</p>
      </div>
    )
  }

  if (!charge) {
    return (
      <div className="max-w-xl mx-auto text-center py-12 space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-[#141413]">Cobrança não encontrada</h2>
        <p className="text-sm text-[#73726C]">
          A cobrança solicitada não existe ou pertence a outro comerciante.
        </p>
        <Button onClick={() => navigate('/cobrancas')} variant="outline">
          Voltar para a lista
        </Button>
      </div>
    )
  }

  const isCompleted =
    charge.status === 'depix_sent' || charge.status === 'approved' || charge.status === 'paid'

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <GoldConfetti active={showConfetti} />

      {/* Navegação Superior */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate('/cobrancas')}
          className="text-[#57564F] hover:text-[#141413] -ml-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Voltar para Cobranças
        </Button>

        <div className="flex items-center gap-2">
          {charge.eulen_deposit_id && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="border-[#D6D0C5] text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${syncing ? 'animate-spin' : ''}`} />
              Sincronizar
            </Button>
          )}
        </div>
      </div>

      {/* Notificação de Sincronização */}
      {syncNotice && (
        <Alert className="border-amber-400 bg-amber-50 text-amber-900 text-xs py-2.5">
          <Info className="w-4 h-4 text-amber-700" />
          <AlertDescription>{syncNotice}</AlertDescription>
        </Alert>
      )}

      {/* Painel Restrito de Homologação (exibido APENAS se o registro for is_simulated e o usuário for admin) */}
      {charge.is_simulated && isAdmin && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Ambiente de Homologação (Apenas Administrador)
              </span>
            </div>
            <span className="text-[11px] font-medium bg-amber-200 text-amber-900 px-2 py-0.5 rounded">
              Registro de Teste
            </span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Este registro está arquivado no ambiente de testes. Em produção, os pagamentos são
            processados automaticamente via webhook e conciliação bancária — alterações manuais são
            estritamente bloqueadas.
          </p>
          {charge.status === 'pending' && (
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                onClick={handleSimulatePayment}
                className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs"
              >
                Simular Pagamento Pix e Envio DePix
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSimulateCancel}
                className="border-red-300 text-red-700 hover:bg-red-50 text-xs"
              >
                Simular Cancelamento
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Cartão Principal da Cobrança */}
      <div className="bg-[#FFFFFF] border border-[#D6D0C5] rounded-xl shadow-xs overflow-hidden">
        {/* Topo / Header da Cobrança */}
        <div className="p-6 border-b border-[#E6E4DD] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF8F5]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-[#73726C] uppercase tracking-wider">
                Cobrança Pix
              </span>
              <StatusBadge status={charge.status as ChargeStatus} />
            </div>
            <h2 className="font-serif text-3xl font-bold text-[#141413]">
              {formatCurrency(charge.amount_cents)}
            </h2>
            <p className="text-xs text-[#73726C] mt-1">
              Criada em {formatDateBr(charge.created)} para{' '}
              <strong>{charge.customer_name || 'Cliente'}</strong>
            </p>
          </div>

          <div className="text-left sm:text-right text-xs space-y-1">
            <div className="text-[#73726C]">Liquidação Liquid</div>
            <div className="font-semibold text-emerald-800">
              {formatCurrency(charge.net_depix_amount_cents || charge.amount_cents)} DePix
            </div>
            <div className="text-[11px] text-[#8C8A7B]">1 BRL = 1 DePix</div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Se estiver pendente, exibir dados do Pix Copia e Cola / QR Code */}
          {charge.status === 'pending' ? (
            <div className="space-y-6">
              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-6 bg-[#FAF8F5] border border-[#D6D0C5] rounded-xl text-center">
                <PixQrCode
                  value={charge.pix_copia_cola || `https://rom.app/pay/${charge.id}`}
                  size={220}
                />
                <p className="text-xs text-[#73726C] mt-4 max-w-xs">
                  Escaneie no aplicativo do seu banco para pagar via Pix
                </p>
              </div>

              {/* Pix Copia e Cola */}
              {charge.pix_copia_cola && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#141413] uppercase tracking-wider">
                    Código Pix Copia e Cola
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={charge.pix_copia_cola}
                      className="flex-1 font-mono text-xs bg-[#FAF8F5] border border-[#D6D0C5] rounded-lg px-3 py-2.5 text-[#57564F] select-all truncate"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(charge.pix_copia_cola!, 'copiacola')}
                      className="border-[#D6D0C5] shrink-0"
                    >
                      {copiedKey === 'copiacola' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1.5" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Link de Pagamento */}
              {charge.payment_link && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#141413] uppercase tracking-wider">
                    Link de Pagamento
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={charge.payment_link}
                      className="flex-1 text-xs bg-[#FAF8F5] border border-[#D6D0C5] rounded-lg px-3 py-2.5 text-[#57564F] truncate select-all"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(charge.payment_link!, 'link')}
                      className="border-[#D6D0C5] shrink-0"
                    >
                      {copiedKey === 'link' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 mr-1.5" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 mr-1.5" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : isCompleted ? (
            /* Estado Pago / DePix Enviado */
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl space-y-4 text-emerald-950">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm">
                    {charge.status === 'depix_sent'
                      ? 'DePix Enviado com Sucesso!'
                      : 'Pagamento Pix Confirmado'}
                  </h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    {charge.status === 'depix_sent'
                      ? 'A liquidação foi transmitida diretamente para o seu endereço Liquid na blockchain.'
                      : 'O pagamento foi confirmado e a provedora está transmitindo os tokens DePix.'}
                  </p>
                </div>
              </div>

              {charge.blockchain_tx_id && (
                <div className="pt-2 border-t border-emerald-200/80">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
                    ID da Transação Liquid (Blockchain TxID):
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs bg-white/70 px-2.5 py-1.5 rounded border border-emerald-300 text-emerald-900 truncate flex-1 select-all">
                      {charge.blockchain_tx_id}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-900 text-xs shrink-0"
                    >
                      <a
                        href={`https://blockstream.info/liquid/tx/${charge.blockchain_tx_id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1" />
                        Explorador
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Outros Estados (Cancelada, Expirada, Retida) */
            <div className="p-5 bg-[#FAF8F5] border border-[#D6D0C5] rounded-xl text-center space-y-2">
              <AlertCircle className="w-6 h-6 text-[#8C8A7B] mx-auto" />
              <p className="text-sm font-semibold text-[#141413]">
                Esta cobrança está com status {charge.status}
              </p>
              <p className="text-xs text-[#73726C]">
                Operações finalizadas ou canceladas não aceitam novos pagamentos.
              </p>
            </div>
          )}

          {/* Dados Técnicos e Liquidação */}
          <div className="border-t border-[#E6E4DD] pt-6 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#73726C]">
              Dados de Recebimento
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#D6D0C5] space-y-1">
                <span className="text-[#8C8A7B]">Carteira Liquid do Comerciante:</span>
                <p className="font-mono text-[11px] text-[#141413] break-all select-all font-medium">
                  {charge.liquid_address || 'Não informada'}
                </p>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#D6D0C5] space-y-1">
                <span className="text-[#8C8A7B]">Identificador da Operação (Eulen ID):</span>
                <p className="font-mono text-[11px] text-[#141413] break-all font-medium">
                  {charge.eulen_deposit_id ||
                    (charge.is_simulated ? 'SIMULADO' : 'Aguardando provedora')}
                </p>
              </div>

              {charge.payer_name && (
                <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#D6D0C5] space-y-1">
                  <span className="text-[#8C8A7B]">Nome Oficial do Pagador (Pix):</span>
                  <p className="text-[11px] text-[#141413] font-medium">{charge.payer_name}</p>
                </div>
              )}

              {charge.bank_tx_id && (
                <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#D6D0C5] space-y-1">
                  <span className="text-[#8C8A7B]">ID da Transação Bancária (Pix):</span>
                  <p className="font-mono text-[11px] text-[#141413] truncate font-medium">
                    {charge.bank_tx_id}
                  </p>
                </div>
              )}
            </div>

            {charge.description && (
              <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#D6D0C5] text-xs">
                <span className="text-[#8C8A7B] block mb-1">Descrição:</span>
                <p className="text-[#141413]">{charge.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChargeDetails
