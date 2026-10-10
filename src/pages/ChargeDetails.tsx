import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { chargesService, type ChargeRecord } from '@/services/charges'
import { formatCurrency, formatDateBr, maskPixKey, maskAddress } from '@/lib/formatters'
import { StatusBadge } from '@/components/StatusBadge'
import { GoldConfetti } from '@/components/GoldConfetti'
import { PixQrCode } from '@/components/PixQrCode'
import useRealtime from '@/hooks/use-realtime'
import {
  ArrowLeft,
  Share2,
  CheckCircle2,
  XCircle,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Receipt,
  Clock,
  ShieldAlert,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export const ChargeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [charge, setCharge] = useState<ChargeRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedPixCode, setCopiedPixCode] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  const loadCharge = async () => {
    if (!id) return
    try {
      const rec = await chargesService.getById(id)
      setCharge(rec)
    } catch {
      navigate('/cobrancas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCharge()
  }, [id])

  useRealtime('charges', (e) => {
    if (e.record.id === id) {
      setCharge(e.record as ChargeRecord)
    }
  })

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#C9A227] border-t-transparent animate-spin mx-auto mb-2" />
        <p className="text-xs text-[#6B6760]">Carregando detalhes da cobrança...</p>
      </div>
    )
  }

  if (!charge) return null

  const paymentLink = charge.payment_link || `https://rom.app/pay/sim_${charge.id.substring(0, 8)}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Olá, ${charge.customer_name}! Segue o link de pagamento Pix no valor de ${formatCurrency(
        charge.amount_cents,
      )}:\n${paymentLink}\n\n(Aviso: Cobrança em modo simulado ROM)`,
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const handleMarkAsPaid = async () => {
    setActionLoading(true)
    try {
      const updated = await chargesService.markAsPaid(charge.id)
      setCharge(updated)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2500)
    } catch {
      // Ignora erro
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    setActionLoading(true)
    try {
      const updated = await chargesService.cancel(charge.id)
      setCharge(updated)
      setCancelModalOpen(false)
    } catch {
      // Ignora erro
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await chargesService.delete(charge.id)
      setDeleteModalOpen(false)
      navigate('/cobrancas')
    } catch {
      // Ignora erro
    } finally {
      setActionLoading(false)
    }
  }

  const isPending = charge.status === 'pending'

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in relative">
      <GoldConfetti active={showConfetti} />

      {/* Navegação Voltar */}
      <div className="flex items-center justify-between">
        <Link
          to="/cobrancas"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#8C6A3F] hover:text-[#C9A227] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Cobranças
        </Link>

        <button
          onClick={() => setDeleteModalOpen(true)}
          className="p-2 text-[#8C6A3F] hover:text-[#B3261E] hover:bg-[#B3261E]/10 rounded-lg transition-colors"
          title="Excluir cobrança"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Cartão de Detalhes da Cobrança */}
      <div className="bg-white rounded-2xl border border-[#D6D0C5] p-6 sm:p-8 shadow-sm space-y-6">
        {/* Cabeçalho do Cartão: Cliente e Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#E6E1D8]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8C6A3F] to-[#C9A227] text-[#0B0B0D] font-serif font-bold text-sm flex items-center justify-center shadow-sm">
              {charge.customer_name ? charge.customer_name[0].toUpperCase() : 'C'}
            </div>
            <div>
              <h1 className="font-serif text-xl font-bold text-[#1A1916]">
                {charge.customer_name}
              </h1>
              <p className="text-xs text-[#6B6760]">Emitido em {formatDateBr(charge.created)}</p>
            </div>
          </div>

          <StatusBadge status={charge.status} className="self-start sm:self-center" />
        </div>

        {/* Valor Grande Destacado */}
        <div className="text-center py-4 bg-[#FAF8F3] rounded-2xl border border-[#E6E1D8]">
          <span className="text-xs font-sans text-[#8C6A3F] uppercase tracking-wider block mb-1">
            Valor da Cobrança Pix
          </span>
          <span className="font-serif text-3xl sm:text-4xl font-extrabold text-[#1A1916] tracking-tight">
            {formatCurrency(charge.amount_cents)}
          </span>
          <span className="text-[11px] text-[#8C6A3F] block mt-1">
            Pagador quita via Pix • Recebimento do vendedor em DePix (Liquid)
          </span>
          {charge.paid_at && (
            <p className="text-xs text-[#2E7D32] mt-1.5 font-medium">
              Liquidado em {formatDateBr(charge.paid_at)}
            </p>
          )}
        </div>

        {/* Bloco de Validade e Carteira Liquid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E6E1D8] flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-[#8C6A3F] flex-shrink-0" />
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#8C6A3F] font-semibold block">
                Prazo de Validade
              </span>
              <span className="text-[#1A1916] font-medium">
                {charge.expires_at ? formatDateBr(charge.expires_at) : '24 horas após emissão'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#E6E1D8] flex items-center gap-2.5">
            <Wallet className="w-4 h-4 text-[#8C6A3F] flex-shrink-0" />
            <div className="overflow-hidden">
              <span className="text-[10px] uppercase tracking-wider text-[#8C6A3F] font-semibold block">
                Carteira Liquid de Recebimento
              </span>
              <span className="font-mono text-[#1A1916] font-medium truncate block">
                {charge.liquid_address ? maskAddress(charge.liquid_address) : 'Padrão da conta'}
              </span>
            </div>
          </div>
        </div>

        {/* Exibição do QR Code Pix e Código Copia e Cola */}
        <div className="p-5 rounded-2xl bg-[#FAF8F3] border border-[#E6E1D8] space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#1A1916]">
              QR Code Pix para Pagamento
            </h2>
            <p className="text-[11px] text-[#6B6760]">
              O pagador lê o QR Code no app do banco e você recebe em DePix na Liquid
            </p>
          </div>

          <div className="flex flex-col items-center justify-center py-2 space-y-3">
            <PixQrCode
              value={
                charge.pix_copia_cola ||
                `00020126580014br.gov.bcb.pix2536simulado-rom.app/pix/${charge.id}520400005303986540${(
                  charge.amount_cents / 100
                ).toFixed(2)}5802BR5925ROM SIMULADO NAO PAGAR6009SAO PAULO62070503***6304SIMU`
              }
              size={200}
              isSimulated={charge.payment_method === 'simulated'}
            />

            <div className="max-w-md w-full p-2.5 rounded-xl bg-[#FFF3E0] border border-[#C9A227]/40 text-center">
              <span className="text-[11px] font-semibold text-[#8C6A3F] flex items-center justify-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-[#C9A227]" />
                Modo Simulado — QR Code e payload fictícios (sem cobrança bancária real)
              </span>
            </div>
          </div>

          {/* Código Pix Copia e Cola */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-semibold text-[#1A1916] uppercase tracking-wider block">
              Código Pix Copia e Cola
            </label>
            <div className="relative">
              <textarea
                readOnly
                rows={2}
                value={
                  charge.pix_copia_cola ||
                  `00020126580014br.gov.bcb.pix2536simulado-rom.app/pix/${charge.id}520400005303986540${(
                    charge.amount_cents / 100
                  ).toFixed(2)}5802BR5925ROM SIMULADO NAO PAGAR6009SAO PAULO62070503***6304SIMU`
                }
                className="w-full p-2.5 bg-white border border-[#D6D0C5] rounded-xl text-xs font-mono text-[#1A1916] select-all focus:outline-none focus:ring-1 focus:ring-[#C9A227] break-all resize-none"
              />
            </div>
            <Button
              type="button"
              onClick={() => {
                const code =
                  charge.pix_copia_cola ||
                  `00020126580014br.gov.bcb.pix2536simulado-rom.app/pix/${charge.id}520400005303986540${(
                    charge.amount_cents / 100
                  ).toFixed(2)}5802BR5925ROM SIMULADO NAO PAGAR6009SAO PAULO62070503***6304SIMU`
                navigator.clipboard.writeText(code)
                setCopiedPixCode(true)
                setTimeout(() => setCopiedPixCode(false), 2500)
              }}
              className={`w-full h-10 text-xs font-semibold rounded-xl transition-all border-0 shadow-sm flex items-center justify-center gap-1.5 ${
                copiedPixCode
                  ? 'bg-[#2E7D32] hover:bg-[#2E7D32] text-white'
                  : 'bg-gradient-to-r from-[#C9A227] to-[#A8861F] text-[#0B0B0D] hover:from-[#F5D77F] hover:to-[#C9A227]'
              }`}
            >
              {copiedPixCode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copiado com Sucesso!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Código Pix Copia e Cola
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Metadados da Cobrança */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-[#F6F4EF] border border-[#E6E1D8]">
            <span className="text-[#8C6A3F] uppercase tracking-wider text-[10px] block font-semibold">
              Método / Liquidação
            </span>
            <span className="text-[#1A1916] font-medium mt-0.5 block">
              {charge.payment_method === 'simulated'
                ? 'Pix Simulado (Teste) → DePix Liquid'
                : 'Pix Real → DePix Liquid'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F6F4EF] border border-[#E6E1D8]">
            <span className="text-[#8C6A3F] uppercase tracking-wider text-[10px] block font-semibold">
              Valor Líquido Estimado em DePix
            </span>
            <span className="text-[#1A1916] font-medium mt-0.5 block">
              {charge.net_depix_amount_cents
                ? `${(charge.net_depix_amount_cents / 100).toFixed(2)} DePix`
                : `${(charge.amount_cents / 100).toFixed(2)} DePix (estimado)`}
            </span>
          </div>

          {charge.description && (
            <div className="sm:col-span-2 p-3.5 rounded-xl bg-[#F6F4EF] border border-[#E6E1D8]">
              <span className="text-[#8C6A3F] uppercase tracking-wider text-[10px] block font-semibold">
                Descrição
              </span>
              <p className="text-[#1A1916] mt-0.5 leading-relaxed">{charge.description}</p>
            </div>
          )}
        </div>

        {/* Link de Pagamento Simulado com Copiar */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-semibold text-[#1A1916] uppercase tracking-wider">
            Link de Pagamento Web (Simulado)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={paymentLink}
              className="flex-1 px-3.5 py-2.5 bg-[#FAF8F3] border border-[#D6D0C5] rounded-xl text-xs font-mono text-[#1A1916] select-all focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
            />
            <Button
              type="button"
              onClick={handleCopyLink}
              className={`h-10 px-4 text-xs font-medium transition-all ${
                copied
                  ? 'bg-[#2E7D32] hover:bg-[#2E7D32] text-white border-0'
                  : 'bg-white border border-[#D6D0C5] text-[#1A1916] hover:bg-[#FAF8F3]'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-white" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copiar Link
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Ações da Cobrança */}
        <div className="pt-2 space-y-2.5">
          {/* Compartilhar via WhatsApp */}
          <Button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full h-12 bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm border-0"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar via WhatsApp
          </Button>

          {/* Marcar como Paga e Cancelar (se pendente) */}
          {isPending && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Button
                type="button"
                disabled={actionLoading}
                onClick={handleMarkAsPaid}
                className="h-11 bg-gradient-to-r from-[#C9A227] to-[#A8861F] hover:from-[#F5D77F] hover:to-[#C9A227] text-[#0B0B0D] font-semibold text-xs rounded-xl border-0 flex items-center justify-center gap-2 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Marcar como Paga
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={actionLoading}
                onClick={() => setCancelModalOpen(true)}
                className="h-11 border-[#B3261E]/40 text-[#B3261E] hover:bg-[#B3261E]/10 text-xs rounded-xl flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                Cancelar Cobrança
              </Button>
            </div>
          )}
        </div>

        {/* Nota de Rodapé do Cartão */}
        <div className="pt-4 border-t border-[#E6E1D8] text-center">
          <p className="text-[11px] text-[#8C6A3F] flex items-center justify-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            Cobranças geradas em modo simulado — nada processa pagamento real. Quando a integração
            com a provedora estiver ativa, os valores serão recebidos em DePix na sua carteira
            Liquid.
          </p>
        </div>
      </div>

      {/* Modal de Confirmação de Cancelamento */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent className="bg-white border border-[#D6D0C5] text-[#1A1916] max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-[#1A1916]">
              Cancelar Cobrança?
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B6760]">
              O status será alterado para cancelado e o cliente não poderá mais simular o pagamento.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setCancelModalOpen(false)}
              className="border-[#D6D0C5] text-xs"
            >
              Voltar
            </Button>
            <Button
              onClick={handleCancel}
              className="bg-[#B3261E] hover:bg-[#962019] text-white text-xs border-0"
            >
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="bg-white border border-[#D6D0C5] text-[#1A1916] max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-[#B3261E] flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Excluir Cobrança
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B6760]">
              Esta ação removerá o registro permanentemente do seu histórico. Deseja prosseguir?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              className="border-[#D6D0C5] text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-[#B3261E] hover:bg-[#962019] text-white text-xs border-0"
            >
              Excluir Registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ChargeDetails
