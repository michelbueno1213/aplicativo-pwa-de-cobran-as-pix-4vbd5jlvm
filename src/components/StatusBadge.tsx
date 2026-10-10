import React from 'react'

/**
 * Status documentados oficialmente pela Eulen Pix2DePix:
 * - pending: QR Code gerado, aguardando pagamento
 * - under_review: Pagamento recebido, sob análise da provedora
 * - approved: Pagamento Pix confirmado e compensado (sinal recomendado de confirmação)
 * - depix_sent: DePix enviado à carteira Liquid do comerciante
 * - delayed: Pagamento retido temporariamente até delayUntil
 * - refunded: Devolvido ao pagador (ex: via MED)
 * - canceled / cancelled: Cancelado
 * - expired: QR Code expirou sem pagamento
 * - error: Erro no processamento
 * - under_bank_review: Bloqueio cautelar bancário
 * - will_refund: Reembolso programado por conformidade
 * - paid: Legado equivalente a approved/depix_sent
 */
export type EulenChargeStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'depix_sent'
  | 'delayed'
  | 'refunded'
  | 'canceled'
  | 'cancelled'
  | 'expired'
  | 'error'
  | 'unknown'
  | 'will_refund'
  | 'under_bank_review'
  | 'paid'

export type ChargeStatus = EulenChargeStatus

interface StatusBadgeProps {
  status: ChargeStatus | string
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'depix_sent':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#E8F5E9] text-[#1B5E20] border border-[#2E7D32]/30 shadow-xs ${className}`}
          title="DePix transferido com sucesso na rede Liquid"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
          DePix Enviado
        </span>
      )

    case 'approved':
    case 'paid':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/20 shadow-xs ${className}`}
          title="Pix confirmado pela provedora — envio de DePix em andamento"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
          Pix Confirmado
        </span>
      )

    case 'under_review':
    case 'under_bank_review':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#FFF8E1] text-[#F57F17] border border-[#F57F17]/30 shadow-xs ${className}`}
          title="Pix recebido, em análise pela conformidade"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#F57F17] animate-pulse" />
          Em Análise
        </span>
      )

    case 'delayed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#FFF3E0] text-[#E65100] border border-[#E65100]/30 shadow-xs ${className}`}
          title="Pagamento temporariamente retido"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#E65100]" />
          Retido
        </span>
      )

    case 'pending':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#FFF3E0] text-[#B26A00] border border-[#B26A00]/25 shadow-xs ${className}`}
          title="Aguardando pagamento Pix"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#B26A00] animate-pulse" />
          Aguardando Pix
        </span>
      )

    case 'refunded':
    case 'will_refund':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#ECEFF1] text-[#455A64] border border-[#B0BEC5] ${className}`}
          title="Valor reembolsado ao pagador"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#78909C]" />
          Reembolsado
        </span>
      )

    case 'expired':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#F1EFEA] text-[#6B6760] border border-[#D6D0C5] ${className}`}
          title="Cobrança expirada"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#6B6760]" />
          Expirada
        </span>
      )

    case 'canceled':
    case 'cancelled':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#FDECEA] text-[#B3261E] border border-[#B3261E]/20 ${className}`}
          title="Cobrança cancelada"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#B3261E]" />
          Cancelada
        </span>
      )

    case 'error':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#FDECEA] text-[#B3261E] border border-[#B3261E]/30 ${className}`}
          title="Erro no processamento"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#B3261E]" />
          Erro
        </span>
      )

    default:
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs bg-gray-100 text-gray-700 ${className}`}
        >
          {status}
        </span>
      )
  }
}

export default StatusBadge
