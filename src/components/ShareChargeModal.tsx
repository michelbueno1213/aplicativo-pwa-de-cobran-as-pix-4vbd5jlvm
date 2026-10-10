import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Copy, Check, Share2, AlertTriangle, ExternalLink } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import type { ChargeRecord } from '@/services/charges'

interface ShareChargeModalProps {
  charge: ChargeRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ShareChargeModal: React.FC<ShareChargeModalProps> = ({
  charge,
  open,
  onOpenChange,
}) => {
  const [copied, setCopied] = useState(false)

  if (!charge) return null

  const paymentLink = charge.payment_link || `https://rom.app/pay/sim_${charge.id.substring(0, 8)}`

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Olá, ${charge.customer_name}! Segue o link de pagamento Pix no valor de ${formatCurrency(
        charge.amount_cents,
      )}:\n${paymentLink}\n\n(Aviso: Cobrança em modo simulado ROM)`,
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#FFFFFF] border border-[#D6D0C5] text-[#1A1916] max-w-md p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="font-serif text-xl font-bold text-[#1A1916] flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#C9A227]" />
            Compartilhar Cobrança
          </DialogTitle>
          <DialogDescription className="text-xs text-[#6B6760]">
            Envie o link de pagamento simulado para {charge.customer_name}
          </DialogDescription>
        </DialogHeader>

        {/* Resumo da Cobrança */}
        <div className="my-2 p-3.5 rounded-xl bg-[#F6F4EF] border border-[#E6E1D8] space-y-1">
          <div className="flex justify-between items-center text-xs text-[#6B6760]">
            <span>Valor a receber</span>
            <span className="font-serif text-base font-bold text-[#1A1916]">
              {formatCurrency(charge.amount_cents)}
            </span>
          </div>
          {charge.description && (
            <div className="text-xs text-[#8C6A3F] truncate">{charge.description}</div>
          )}
        </div>

        {/* Aviso de Modo Simulado */}
        <div className="p-3 rounded-lg bg-[#FFF3E0] border border-[#B26A00]/25 text-[#B26A00] text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="leading-snug">
            <strong>Link simulado:</strong> Este link não processa pagamento bancário real. Ele
            serve para validação e testes até a aprovação da provedora Pix.
          </span>
        </div>

        {/* Campo com Link Copiável */}
        <div className="space-y-1.5 mt-2">
          <label className="text-xs font-semibold text-[#1A1916] uppercase tracking-wider">
            Link de Pagamento (Simulado)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={paymentLink}
              className="flex-1 px-3 py-2 bg-[#FAF8F3] border border-[#D6D0C5] rounded-lg text-xs font-mono text-[#1A1916] select-all focus:outline-none focus:ring-1 focus:ring-[#C9A227]"
            />
            <Button
              type="button"
              onClick={handleCopy}
              className={`h-9 px-3.5 text-xs font-medium transition-all ${
                copied
                  ? 'bg-[#2E7D32] hover:bg-[#2E7D32] text-white border-0'
                  : 'bg-gradient-to-r from-[#C9A227] to-[#A8861F] text-[#0B0B0D] hover:from-[#F5D77F] hover:to-[#C9A227] border-0'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" /> Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copiar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Ação WhatsApp */}
        <div className="pt-2">
          <Button
            type="button"
            onClick={handleWhatsApp}
            className="w-full h-11 bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm border-0"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar via WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ShareChargeModal
