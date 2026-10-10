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
      // DePix Enviado (esmeralda escuro)
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#064E3B]/10 text-[#064E3B] border border-[#064E3B]/30 shadow-xs ${className}`}
          title="DePix transferido com sucesso na rede Liquid"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#064E3B]" />
          DePix Enviado
        </span>
      )

    case 'approved':
    case 'paid':
      // Pix Confirmado (verde)
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#16A34A]/10 text-[#15803D] border border-[#16A34A]/25 shadow-xs ${className}`}
          title="Pix confirmado pela provedora — envio de DePix em andamento"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
          Pix Confirmado
        </span>
      )

    case 'under_review':
    case 'under_bank_review':
      // Em Análise (âmbar)
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#D97706]/10 text-[#B45309] border border-[#D97706]/30 shadow-xs ${className}`}
          title="Pix recebido, em análise pela conformidade"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse" />
          Em Análise
        </span>
      )

    case 'delayed':
      // Atrasada (laranja)
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#EA580C]/10 text-[#C2410C] border border-[#EA580C]/30 shadow-xs ${className}`}
          title="Pagamento temporariamente retido / atrasado"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
          Atrasada
        </span>
      )

    case 'pending':
      // Aguardando Pagamento (cinza)
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#64748B]/10 text-[#475569] border border-[#64748B]/25 shadow-xs ${className}`}
          title="Aguardando pagamento Pix"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#64748B] animate-pulse" />
          Aguardando Pagamento
        </span>
      )

    case 'refunded':
    case 'will_refund':
      // Estornada (vermelho)
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#DC2626]/10 text-[#B91C1C] border border-[#DC2626]/25 shadow-xs ${className}`}
          title="Valor estornado ao pagador"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
          Estornada
        </span>
      )

    case 'expired':
      // Expirada (cinza)
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#64748B]/10 text-[#475569] border border-[#64748B]/20 shadow-xs ${className}`}
          title="Cobrança expirada"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
          Expirada
        </span>
      )

    case 'canceled':
    case 'cancelled':
      // Cancelada (cinza escuro)
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#334155]/10 text-[#1E293B] border border-[#334155]/30 shadow-xs ${className}`}
          title="Cobrança cancelada"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#334155]" />
          Cancelada
        </span>
      )

    case 'error':
      // Erro (vermelho escuro)
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#7F1D1D]/15 text-[#7F1D1D] border border-[#7F1D1D]/35 shadow-xs ${className}`}
          title="Erro no processamento"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#7F1D1D]" />
          Erro
        </span>
      )

    // Badges de Saque:
    // Aguardando Envio (cinza), Enviando (azul), Pix Enviado (verde), Em Revisão (âmbar), Estornado (vermelho), Erro (vermelho escuro)
    case 'saque_aguardando_envio':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#64748B]/10 text-[#475569] border border-[#64748B]/25 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" />
          Aguardando Envio
        </span>
      )

    case 'saque_enviando':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#2563EB]/10 text-[#1D4ED8] border border-[#2563EB]/25 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
          Enviando
        </span>
      )

    case 'saque_pix_enviado':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#16A34A]/10 text-[#15803D] border border-[#16A34A]/25 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
          Pix Enviado
        </span>
      )

    case 'saque_em_revisao':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#D97706]/10 text-[#B45309] border border-[#D97706]/30 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-pulse" />
          Em Revisão
        </span>
      )

    case 'saque_estornado':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#DC2626]/10 text-[#B91C1C] border border-[#DC2626]/25 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
          Estornado
        </span>
      )

    case 'saque_erro':
      return (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] text-xs font-semibold bg-[#7F1D1D]/15 text-[#7F1D1D] border border-[#7F1D1D]/35 ${className}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#7F1D1D]" />
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
